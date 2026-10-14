import argparse
import glob
import os
import sys

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, BitsAndBytesConfig, CLIPImageProcessor

from model.SIDA import SIDAForCausalLM
from model.llava import conversation as conversation_lib
from model.llava.mm_utils import tokenizer_image_token
from model.segment_anything.utils.transforms import ResizeLongestSide
from utils.utils import (DEFAULT_IM_END_TOKEN, DEFAULT_IM_START_TOKEN,
                         DEFAULT_IMAGE_TOKEN, IMAGE_TOKEN_INDEX)


def parse_args(args):
    parser = argparse.ArgumentParser(description="SIDA chat")
    parser.add_argument("--version", default="./ck/SIDA-7B")
    parser.add_argument("--vis_save_path", default="./results", type=str)
    parser.add_argument(
        "--precision",
        default="fp16",
        type=str,
        choices=["fp32", "bf16", "fp16"],
        help="precision for inference",
    )
    parser.add_argument("--image_size", default=1024, type=int, help="image size")
    parser.add_argument("--model_max_length", default=512, type=int)
    parser.add_argument("--lora_r", default=8, type=int)
    parser.add_argument(
        "--vision-tower", default="openai/clip-vit-large-patch14", type=str
    )
    parser.add_argument(
        "--vision_pretrained", default="./ck/sam_vit_h_4b8939.pth", type=str
    )
    parser.add_argument("--local-rank", default=0, type=int, help="node rank")
    parser.add_argument("--load_in_8bit", action="store_true", default=False)
    parser.add_argument("--load_in_4bit", action="store_true", default=False)
    parser.add_argument("--use_mm_start_end", action="store_true", default=True)
    parser.add_argument(
        "--conv_type",
        default="llava_v1",
        type=str,
        choices=["llava_v1", "llava_llama_2"],
    )
    parser.add_argument("--image_path", default="", type=str, help="Path or glob pattern to image(s)")
    parser.add_argument("--prompt", default="", type=str, help="Prompt text for inference")
    return parser.parse_args(args)


def preprocess(
    x,
    pixel_mean=torch.Tensor([123.675, 116.28, 103.53]).view(-1, 1, 1),
    pixel_std=torch.Tensor([58.395, 57.12, 57.375]).view(-1, 1, 1),
    img_size=1024,
) -> torch.Tensor:
    """Normalize pixel values and pad to a square input."""
    # Normalize colors
    x = (x - pixel_mean) / pixel_std
    # Pad
    h, w = x.shape[-2:]
    padh = img_size - h
    padw = img_size - w
    x = F.pad(x, (0, padw, 0, padh))
    return x


def run_inference_on_image(model, tokenizer, clip_image_processor, transform, args, device, torch_dtype, image_path, prompt_text):
    if not os.path.exists(image_path):
        print(f"File not found: {image_path}")
        return None

    conv = conversation_lib.conv_templates[args.conv_type].copy()
    conv.messages = []

    prompt = DEFAULT_IMAGE_TOKEN + "\n" + prompt_text
    if args.use_mm_start_end:
        replace_token = (
            DEFAULT_IM_START_TOKEN + DEFAULT_IMAGE_TOKEN + DEFAULT_IM_END_TOKEN
        )
        prompt = prompt.replace(DEFAULT_IMAGE_TOKEN, replace_token)

    conv.append_message(conv.roles[0], prompt)
    conv.append_message(conv.roles[1], "")
    prompt = conv.get_prompt()

    image_np = cv2.imread(image_path)
    if image_np is None:
        print(f"Failed to read image at: {image_path}")
        return None
    image_np = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
    original_size_list = [image_np.shape[:2]]

    image_clip = (
        clip_image_processor.preprocess(image_np, return_tensors="pt")[
            "pixel_values"
        ][0]
        .unsqueeze(0)
        .to(device=device, dtype=torch_dtype)
    )

    image = transform.apply_image(image_np)
    resize_list = [image.shape[:2]]

    image = (
        preprocess(torch.from_numpy(image).permute(2, 0, 1).contiguous())
        .unsqueeze(0)
        .to(device=device, dtype=torch_dtype)
    )

    input_ids = tokenizer_image_token(prompt, tokenizer, return_tensors="pt")
    input_ids = input_ids.unsqueeze(0).to(device=device)

    output_ids, pred_masks = model.evaluate(
        image_clip,
        image,
        input_ids,
        resize_list,
        original_size_list,
        max_new_tokens=512,
        tokenizer=tokenizer,
    )
    output_ids = output_ids[0][output_ids[0] != IMAGE_TOKEN_INDEX]

    text_output = tokenizer.decode(output_ids, skip_special_tokens=False)
    text_output = text_output.replace("\n", "").replace("  ", " ")
    print(f"\n[{os.path.basename(image_path)}] Result: {text_output}")

    base_name = os.path.splitext(os.path.basename(image_path))[0]
    mask_saved_paths = []
    overlay_saved_paths = []

    for i, pred_mask in enumerate(pred_masks):
        if pred_mask.shape[0] == 0:
            continue

        pred_mask_np = pred_mask.detach().cpu().numpy()[0]
        pred_mask_bin = pred_mask_np > 0

        mask_save_path = os.path.join(args.vis_save_path, f"{base_name}_mask_{i}.png")
        cv2.imwrite(mask_save_path, (pred_mask_bin * 255).astype(np.uint8))
        print(f"Mask saved to: {mask_save_path}")
        mask_saved_paths.append(mask_save_path)

        overlay_save_path = os.path.join(args.vis_save_path, f"{base_name}_masked_img_{i}.jpg")
        save_img = image_np.copy()
        save_img[pred_mask_bin] = (
            image_np * 0.5
            + pred_mask_bin[:, :, None].astype(np.uint8) * np.array([255, 0, 0]) * 0.5
        )[pred_mask_bin]
        save_img = cv2.cvtColor(save_img, cv2.COLOR_RGB2BGR)
        cv2.imwrite(overlay_save_path, save_img)
        print(f"Overlay saved to: {overlay_save_path}")
        overlay_saved_paths.append(overlay_save_path)

    return {
        "image_path": image_path,
        "text_output": text_output,
        "masks": mask_saved_paths,
        "overlays": overlay_saved_paths,
    }


def main(args):
    args = parse_args(args)
    os.makedirs(args.vis_save_path, exist_ok=True)

    # Determine execution device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Executing inference on device: {device.upper()}")

    # Create model & tokenizer
    tokenizer = AutoTokenizer.from_pretrained(
        args.version,
        cache_dir=None,
        model_max_length=args.model_max_length,
        padding_side="right",
        use_fast=False,
    )
    tokenizer.pad_token = tokenizer.unk_token
    args.seg_token_idx = tokenizer("[SEG]", add_special_tokens=False).input_ids[0]
    args.cls_token_idx = tokenizer("[CLS]", add_special_tokens=False).input_ids[0]

    torch_dtype = torch.float32
    if device == "cuda":
        if args.precision == "bf16":
            torch_dtype = torch.bfloat16
        elif args.precision == "fp16":
            torch_dtype = torch.half
    else:
        # CPU executes safely with float32
        torch_dtype = torch.float32
        args.precision = "fp32"

    kwargs = {"torch_dtype": torch_dtype}
    if device == "cuda" and args.load_in_4bit:
        kwargs.update(
            {
                "torch_dtype": torch.half,
                "load_in_4bit": True,
                "quantization_config": BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_compute_dtype=torch.float16,
                    bnb_4bit_use_double_quant=True,
                    bnb_4bit_quant_type="nf4",
                    llm_int8_skip_modules=["visual_model"],
                ),
            }
        )
    elif device == "cuda" and args.load_in_8bit:
        kwargs.update(
            {
                "torch_dtype": torch.half,
                "quantization_config": BitsAndBytesConfig(
                    llm_int8_skip_modules=["visual_model"],
                    load_in_8bit=True,
                ),
            }
        )

    print(f"Loading SIDA model from {args.version}...")
    model = SIDAForCausalLM.from_pretrained(
        args.version,
        low_cpu_mem_usage=True,
        vision_tower=args.vision_tower,
        vision_pretrained=args.vision_pretrained,
        seg_token_idx=args.seg_token_idx,
        cls_token_idx=args.cls_token_idx,
        **kwargs
    )

    model.config.eos_token_id = tokenizer.eos_token_id
    model.config.bos_token_id = tokenizer.bos_token_id
    model.config.pad_token_id = tokenizer.pad_token_id

    try:
        model.get_model().initialize_vision_modules(model.get_model().config)
        vision_tower = model.get_model().get_vision_tower()
        vision_tower.to(device=device, dtype=torch_dtype)
    except AttributeError:
        print("Vision tower initialization skipped as SIDA-7B-v1 may not have this module.")

    model = model.to(device=device, dtype=torch_dtype)

    clip_image_processor = CLIPImageProcessor.from_pretrained(model.config.vision_tower)
    transform = ResizeLongestSide(args.image_size)

    model.eval()
    print("Model initialized and ready for inference!")

    # Check if batch / non-interactive execution was requested
    if args.image_path:
        images_to_process = glob.glob(args.image_path)
        if not images_to_process:
            if os.path.exists(args.image_path):
                images_to_process = [args.image_path]
            else:
                print(f"No images found matching path: {args.image_path}")
                return

        prompt_text = args.prompt or "Please answer begin with [CLS] for classification, if the image is tampered, output mask the tampered region."
        print(f"Processing {len(images_to_process)} image(s) with prompt: '{prompt_text}'")

        results = []
        for img_path in images_to_process:
            res = run_inference_on_image(
                model, tokenizer, clip_image_processor, transform, args, device, torch_dtype, img_path, prompt_text
            )
            if res:
                results.append(res)
        print(f"\nInference completed successfully. All results saved to {os.path.abspath(args.vis_save_path)}")
        return

    # Interactive mode fallback
    while True:
        prompt = input("Please input your prompt: ")
        if not prompt.strip():
            break
        image_path = input("Please input the image path: ")
        run_inference_on_image(
            model, tokenizer, clip_image_processor, transform, args, device, torch_dtype, image_path, prompt
        )


if __name__ == "__main__":
    main(sys.argv[1:])
