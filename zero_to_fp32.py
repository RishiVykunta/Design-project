#!/usr/bin/env python
# zero_to_fp32.py - DeepSpeed ZeRO checkpoint consolidation script
import os
import sys
import torch

def convert_zero_checkpoint_to_fp32(checkpoint_dir, output_file):
    print(f"Consolidating DeepSpeed checkpoint from {checkpoint_dir} to {output_file}...")
    try:
        from deepspeed.utils.zero_to_fp32 import convert_zero_checkpoint_to_fp32_state_dict
        state_dict = convert_zero_checkpoint_to_fp32_state_dict(checkpoint_dir, output_file)
        print("DeepSpeed official conversion completed successfully.")
        return
    except ImportError:
        pass

    # Fallback consolidation for PyTorch partition files
    state_dict = {}
    pt_files = [f for f in os.listdir(checkpoint_dir) if f.endswith(".pt") or f.endswith(".bin")]
    if not pt_files:
        raise FileNotFoundError(f"No checkpoint partition files found in {checkpoint_dir}")

    for pf in sorted(pt_files):
        p_path = os.path.join(checkpoint_dir, pf)
        print(f"Loading partition: {pf}")
        data = torch.load(p_path, map_location="cpu")
        if isinstance(data, dict):
            if "module" in data:
                sub = data["module"]
            elif "model" in data:
                sub = data["model"]
            else:
                sub = data
            state_dict.update(sub)

    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    torch.save(state_dict, output_file)
    print(f"Successfully saved consolidated state dict ({len(state_dict)} keys) to {output_file}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python zero_to_fp32.py <checkpoint_dir> <output_fp32_path>")
        sys.exit(1)
    convert_zero_checkpoint_to_fp32(sys.argv[1], sys.argv[2])
