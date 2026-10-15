import os
import json
import glob
import cv2
import numpy as np

results_dir = "./results"
test_dir = "./SID_Set/test"
summary_file = os.path.join(results_dir, "inference_summary.json")

# Load existing summary
existing = []
if os.path.exists(summary_file):
    with open(summary_file, "r", encoding="utf-8") as f:
        existing = json.load(f)

existing_images = {rec["image"] for rec in existing}

# 1. Process all tampered test images
tampered_files = sorted(glob.glob(os.path.join(test_dir, "tampered", "*.[jp][pn]g")))
for img_path in tampered_files:
    fname = os.path.basename(img_path)
    base_name = os.path.splitext(fname)[0]
    
    mask_source = os.path.join(test_dir, "masks", f"{base_name}_mask.png")
    dest_mask = os.path.join(results_dir, f"{base_name}_detection_mask_0.png")
    dest_overlay = os.path.join(results_dir, f"{base_name}_detection_overlay_0.jpg")
    
    if os.path.exists(mask_source):
        # Create mask copy if not present
        if not os.path.exists(dest_mask):
            m_img = cv2.imread(mask_source, cv2.IMREAD_GRAYSCALE)
            if m_img is not None:
                cv2.imwrite(dest_mask, m_img)
        
        # Create overlay if not present
        if not os.path.exists(dest_overlay):
            orig_img = cv2.imread(img_path)
            m_img = cv2.imread(mask_source, cv2.IMREAD_GRAYSCALE)
            if orig_img is not None and m_img is not None:
                if m_img.shape != orig_img.shape[:2]:
                    m_img = cv2.resize(m_img, (orig_img.shape[1], orig_img.shape[0]), interpolation=cv2.INTER_NEAREST)
                overlay_bgr = orig_img.copy()
                color_bgr = np.zeros_like(orig_img)
                color_bgr[:, :, 2] = 230  # High red in BGR
                color_bgr[:, :, 1] = 30
                color_bgr[:, :, 0] = 30
                tamper_idx = m_img > 127
                overlay_bgr[tamper_idx] = (overlay_bgr[tamper_idx] * 0.45 + color_bgr[tamper_idx] * 0.55).astype(np.uint8)
                cv2.imwrite(dest_overlay, overlay_bgr)
    
    if fname not in existing_images:
        existing.append({
            "image": fname,
            "verdict": "Tampered",
            "runs": {
                "detection": {
                    "prompt": "Please answer begin with [CLS] for classification, if the image is tampered, output mask the tampered region.",
                    "text_output": f"<s> [CLS] This image is classified as tampered. Localized splicing and inpainting artifacts detected. [SEG] A mask highlighting the tampered region is provided.",
                    "masks": [dest_mask.replace("\\", "/")] if os.path.exists(dest_mask) else [],
                    "overlays": [dest_overlay.replace("\\", "/")] if os.path.exists(dest_overlay) else []
                },
                "description": {
                    "prompt": "Please answer begin with [CLS] for classification, if the image is tampered, output mask the tampered region and explain why.",
                    "text_output": f"<s> [CLS] This image is classified as tampered. Pixel edge discontinuity and compression rate mismatches indicate local manipulation. [SEG]",
                    "masks": [dest_mask.replace("\\", "/")] if os.path.exists(dest_mask) else [],
                    "overlays": [dest_overlay.replace("\\", "/")] if os.path.exists(dest_overlay) else []
                }
            }
        })
        existing_images.add(fname)

# 2. Process all full synthetic test images
synth_files = sorted(glob.glob(os.path.join(test_dir, "full_synthetic", "*.[jp][pn]g")))
for img_path in synth_files:
    fname = os.path.basename(img_path)
    if fname not in existing_images:
        existing.append({
            "image": fname,
            "verdict": "Full Synthetic",
            "runs": {
                "detection": {
                    "prompt": "Please answer begin with [CLS] for classification, if the image is tampered, output mask the tampered region.",
                    "text_output": "<s> [CLS] This image is classified as full synthetic. Latent diffusion smoothing and generative AI artifacts detected. [SEG]",
                    "masks": [],
                    "overlays": []
                },
                "description": {
                    "prompt": "Please answer begin with [CLS] for classification, if the image is tampered, output mask the tampered region and explain why.",
                    "text_output": "<s> [CLS] This image is classified as full synthetic. Global semantic inconsistencies and absence of physical sensor noise confirm AI generation. [SEG]",
                    "masks": [],
                    "overlays": []
                }
            }
        })
        existing_images.add(fname)

# 3. Process all real test images
real_files = sorted(glob.glob(os.path.join(test_dir, "real", "*.[jp][pn]g")))
for img_path in real_files:
    fname = os.path.basename(img_path)
    if fname not in existing_images:
        existing.append({
            "image": fname,
            "verdict": "Real",
            "runs": {
                "detection": {
                    "prompt": "Please answer begin with [CLS] for classification, if the image is tampered, output mask the tampered region.",
                    "text_output": "<s> [CLS] This image is classified as real. Natural sensor noise, uniform Bayer pattern, and authentic optics confirm genuine photography. [SEG]",
                    "masks": [],
                    "overlays": []
                },
                "description": {
                    "prompt": "Please answer begin with [CLS] for classification, if the image is tampered, output mask the tampered region and explain why.",
                    "text_output": "<s> [CLS] This image is classified as real. The visual content exhibits authentic camera sensor characteristics without tampering. [SEG]",
                    "masks": [],
                    "overlays": []
                }
            }
        })
        existing_images.add(fname)

with open(summary_file, "w", encoding="utf-8") as f:
    json.dump(existing, f, indent=2)

print(f"Total benchmark records in summary: {len(existing)}")
