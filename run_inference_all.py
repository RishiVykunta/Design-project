import os
import glob
import json
import cv2
import numpy as np
import torch
from transformers import AutoTokenizer, CLIPImageProcessor
from model.SIDA import SIDAForCausalLM
from model.llava import conversation as conversation_lib
from model.llava.mm_utils import tokenizer_image_token
from model.segment_anything.utils.transforms import ResizeLongestSide
from utils.utils import (DEFAULT_IM_END_TOKEN, DEFAULT_IM_START_TOKEN,
                         DEFAULT_IMAGE_TOKEN, IMAGE_TOKEN_INDEX)

def preprocess(
    x,
    pixel_mean=torch.Tensor([123.675, 116.28, 103.53]).view(-1, 1, 1),
    pixel_std=torch.Tensor([58.395, 57.12, 57.375]).view(-1, 1, 1),
    img_size=1024,
) -> torch.Tensor:
    x = (x - pixel_mean) / pixel_std
    h, w = x.shape[-2:]
    padh = img_size - h
    padw = img_size - w
    return torch.nn.functional.pad(x, (0, padw, 0, padh))

def main():
    version = "./ck/SIDA-7B"
    sam_path = "./ck/sam_vit_h_4b8939.pth"
    save_dir = "./results"
    os.makedirs(save_dir, exist_ok=True)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    torch_dtype = torch.float32
    print(f"Device: {device.upper()}")

    print("Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(
        version,
        cache_dir=None,
        model_max_length=512,
        padding_side="right",
        use_fast=False,
    )
    tokenizer.pad_token = tokenizer.unk_token
    seg_token_idx = tokenizer("[SEG]", add_special_tokens=False).input_ids[0]
    cls_token_idx = tokenizer("[CLS]", add_special_tokens=False).input_ids[0]

    print("Loading model...")
    model = SIDAForCausalLM.from_pretrained(
        version,
        low_cpu_mem_usage=True,
        vision_tower="openai/clip-vit-large-patch14",
        vision_pretrained=sam_path,
        seg_token_idx=seg_token_idx,
        cls_token_idx=cls_token_idx,
        torch_dtype=torch_dtype,
    )

    model.config.eos_token_id = tokenizer.eos_token_id
    model.config.bos_token_id = tokenizer.bos_token_id
    model.config.pad_token_id = tokenizer.pad_token_id

    try:
        model.get_model().initialize_vision_modules(model.get_model().config)
        vision_tower = model.get_model().get_vision_tower()
        vision_tower.to(device=device, dtype=torch_dtype)
    except AttributeError:
        pass

    model = model.to(device=device, dtype=torch_dtype)
    clip_image_processor = CLIPImageProcessor.from_pretrained(model.config.vision_tower)
    transform = ResizeLongestSide(1024)
    model.eval()
    print("Model ready!")

    test_images = sorted(glob.glob("./examples/figure[1-3].png"))
    prompts = [
        ("detection", "Please answer begin with [CLS] for classification, if the image is tampered, output mask the tampered region."),
        ("description", "Please answer begin with [CLS] for classification, if the image is tampered, output mask the tampered region and explain why.")
    ]

    all_results = []

    for img_path in test_images:
        base_name = os.path.splitext(os.path.basename(img_path))[0]
        image_np = cv2.imread(img_path)
        image_np_rgb = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
        original_size_list = [image_np_rgb.shape[:2]]

        image_clip = (
            clip_image_processor.preprocess(image_np_rgb, return_tensors="pt")[
                "pixel_values"
            ][0]
            .unsqueeze(0)
            .to(device=device, dtype=torch_dtype)
        )

        image_transformed = transform.apply_image(image_np_rgb)
        resize_list = [image_transformed.shape[:2]]

        image_tensor = (
            preprocess(torch.from_numpy(image_transformed).permute(2, 0, 1).contiguous())
            .unsqueeze(0)
            .to(device=device, dtype=torch_dtype)
        )

        img_record = {"image": os.path.basename(img_path), "runs": {}}

        for mode_name, prompt_text in prompts:
            print(f"\nRunning {mode_name} on {base_name}...")
            conv = conversation_lib.conv_templates["llava_v1"].copy()
            conv.messages = []
            full_prompt = DEFAULT_IM_START_TOKEN + DEFAULT_IMAGE_TOKEN + DEFAULT_IM_END_TOKEN + "\n" + prompt_text
            conv.append_message(conv.roles[0], full_prompt)
            conv.append_message(conv.roles[1], "")
            formatted_prompt = conv.get_prompt()

            input_ids = tokenizer_image_token(formatted_prompt, tokenizer, return_tensors="pt")
            input_ids = input_ids.unsqueeze(0).to(device=device)

            output_ids, pred_masks = model.evaluate(
                image_clip,
                image_tensor,
                input_ids,
                resize_list,
                original_size_list,
                max_new_tokens=512,
                tokenizer=tokenizer,
            )
            output_ids = output_ids[0][output_ids[0] != IMAGE_TOKEN_INDEX]
            text_output = tokenizer.decode(output_ids, skip_special_tokens=False).replace("\n", " ").strip()
            print(f"Output: {text_output}")

            mask_paths = []
            overlay_paths = []

            for i, p_mask in enumerate(pred_masks):
                if p_mask.shape[0] == 0:
                    continue
                m_np = p_mask.detach().cpu().numpy()[0] > 0
                
                m_path = os.path.join(save_dir, f"{base_name}_{mode_name}_mask_{i}.png")
                cv2.imwrite(m_path, (m_np * 255).astype(np.uint8))
                mask_paths.append(m_path)

                overlay = image_np_rgb.copy()
                overlay[m_np] = (
                    image_np_rgb * 0.5 + m_np[:, :, None].astype(np.uint8) * np.array([255, 0, 0]) * 0.5
                )[m_np]
                ov_path = os.path.join(save_dir, f"{base_name}_{mode_name}_overlay_{i}.jpg")
                cv2.imwrite(ov_path, cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))
                overlay_paths.append(ov_path)

            img_record["runs"][mode_name] = {
                "prompt": prompt_text,
                "text_output": text_output,
                "masks": mask_paths,
                "overlays": overlay_paths,
            }

        all_results.append(img_record)

    summary_file = os.path.join(save_dir, "inference_summary.json")
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2)
    print(f"\nSummary successfully written to: {summary_file}")

if __name__ == "__main__":
    main()
