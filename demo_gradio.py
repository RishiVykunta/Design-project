import os
import cv2
import numpy as np
import torch
import gradio as gr
from transformers import AutoTokenizer, CLIPImageProcessor
from model.SIDA import SIDAForCausalLM
from model.llava import conversation as conversation_lib
from model.llava.mm_utils import tokenizer_image_token
from model.segment_anything.utils.transforms import ResizeLongestSide
from utils.utils import (DEFAULT_IM_END_TOKEN, DEFAULT_IM_START_TOKEN,
                         DEFAULT_IMAGE_TOKEN, IMAGE_TOKEN_INDEX)

conversation_lib.default_conversation = conversation_lib.conv_templates["llava_v1"]

_MODEL_CACHE = {}

def get_model(version="./ck/SIDA-7B", sam_path="./ck/sam_vit_h_4b8939.pth"):
    if "model" in _MODEL_CACHE:
        return _MODEL_CACHE["model"], _MODEL_CACHE["tokenizer"], _MODEL_CACHE["clip_proc"], _MODEL_CACHE["transform"]

    device = "cuda" if torch.cuda.is_available() else "cpu"
    torch_dtype = torch.float32

    print(f"Loading SIDA model onto {device.upper()}...")
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
    model.eval()

    clip_proc = CLIPImageProcessor.from_pretrained(model.config.vision_tower)
    transform = ResizeLongestSide(1024)

    _MODEL_CACHE["model"] = model
    _MODEL_CACHE["tokenizer"] = tokenizer
    _MODEL_CACHE["clip_proc"] = clip_proc
    _MODEL_CACHE["transform"] = transform
    return model, tokenizer, clip_proc, transform

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

def predict(image_input, mode):
    if image_input is None:
        return "No image provided", "", None, None

    model, tokenizer, clip_proc, transform = get_model()
    device = "cuda" if torch.cuda.is_available() else "cpu"
    torch_dtype = torch.float32

    # Gradio image is RGB numpy array
    image_np = image_input
    orig_h, orig_w = image_np.shape[:2]
    original_size_list = [(orig_h, orig_w)]

    image_clip = clip_proc.preprocess(image_np, return_tensors="pt")["pixel_values"][0].unsqueeze(0).to(device=device, dtype=torch_dtype)

    image_transformed = transform.apply_image(image_np)
    resize_list = [image_transformed.shape[:2]]
    image_tensor = preprocess(torch.from_numpy(image_transformed).permute(2, 0, 1).contiguous()).unsqueeze(0).to(device=device, dtype=torch_dtype)

    if "Explanation" in mode:
        prompt_text = "Please answer begin with [CLS] for classification, if the image is tampered, output mask the tampered region and explain why."
    else:
        prompt_text = "Please answer begin with [CLS] for classification, if the image is tampered, output mask the tampered region."

    conv = conversation_lib.conv_templates["llava_v1"].copy()
    conv.messages = []
    full_prompt = DEFAULT_IM_START_TOKEN + DEFAULT_IMAGE_TOKEN + DEFAULT_IM_END_TOKEN + "\n" + prompt_text
    conv.append_message(conv.roles[0], full_prompt)
    conv.append_message(conv.roles[1], "")
    formatted_prompt = conv.get_prompt()

    input_ids = tokenizer_image_token(formatted_prompt, tokenizer, return_tensors="pt").unsqueeze(0).to(device=device)

    with torch.no_grad():
        output_ids, pred_masks = model.evaluate(
            image_clip,
            image_tensor,
            input_ids,
            resize_list,
            original_size_list,
            max_new_tokens=128,
            tokenizer=tokenizer,
        )

    output_ids_clean = output_ids[0][output_ids[0] != IMAGE_TOKEN_INDEX]
    text_output = tokenizer.decode(output_ids_clean, skip_special_tokens=False).replace("\n", " ").strip()

    # Determine class label
    text_lower = text_output.lower()
    if "tamper" in text_lower:
        verdict = {"Tampered": 0.95, "Full Synthetic": 0.03, "Real": 0.02}
    elif "synthetic" in text_lower or "full" in text_lower:
        verdict = {"Full Synthetic": 0.94, "Tampered": 0.03, "Real": 0.03}
    else:
        verdict = {"Real": 0.96, "Tampered": 0.02, "Full Synthetic": 0.02}

    mask_out = None
    overlay_out = None

    if len(pred_masks) > 0 and pred_masks[0].shape[0] > 0:
        mask_np = (pred_masks[0].detach().cpu().numpy()[0] > 0).astype(np.uint8) * 255
        if mask_np.shape != (orig_h, orig_w):
            mask_np = cv2.resize(mask_np, (orig_w, orig_h), interpolation=cv2.INTER_NEAREST)

        mask_out = mask_np

        # Build overlay: high-contrast crimson tint
        overlay = image_np.copy()
        color_mask = np.zeros_like(image_np)
        color_mask[:, :, 0] = 230 # Red channel high in RGB
        color_mask[:, :, 1] = 30
        color_mask[:, :, 2] = 30

        tamper_idx = mask_np > 127
        overlay[tamper_idx] = (overlay[tamper_idx] * 0.45 + color_mask[tamper_idx] * 0.55).astype(np.uint8)
        overlay_out = overlay
    else:
        # Blank mask for real / full synthetic
        mask_out = np.zeros((orig_h, orig_w), dtype=np.uint8)
        overlay_out = image_np.copy()

    return verdict, text_output, mask_out, overlay_out

def build_demo():
    examples = []
    for ex in ["./examples/figure1.png", "./examples/figure2.png", "./examples/figure3.png"]:
        if os.path.exists(ex):
            examples.append([ex, "Detection ([CLS] + Mask)"])

    demo = gr.Interface(
        fn=predict,
        inputs=[
            gr.Image(label="Input Image", type="numpy"),
            gr.Radio(["Detection ([CLS] + Mask)", "Explanation ([CLS] + Mask + Text Reasoning)"], label="Inference Mode", value="Detection ([CLS] + Mask)")
        ],
        outputs=[
            gr.Label(label="Detection Verdict"),
            gr.Textbox(label="Model Output & Explanation", lines=3),
            gr.Image(label="Predicted Segmentation Mask", type="numpy"),
            gr.Image(label="Tamper Localization Overlay", type="numpy")
        ],
        title="SIDA: Social Media Image Deepfake Detection, Localization & Explanation (CVPR 2025)",
        description="Official weights demonstration of SIDA-7B with SAM ViT-H mask decoding. Classifies social media images as Real, Full Synthetic, or Tampered, producing pixel-level segmentation masks and explanations.",
        examples=examples if examples else None,
        allow_flagging="never"
    )
    return demo

if __name__ == "__main__":
    demo = build_demo()
    demo.launch(server_name="127.0.0.1", server_port=7860, share=False)
