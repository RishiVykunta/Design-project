#!/usr/bin/env bash
# run_SIDA_reduced.sh - Reduced SIDA-7B Training Pipeline
# Goal: Demonstrate end-to-end training in ~1-2 hours instead of 48 hours

set -e

DATASET_DIR="./SID_Set"
SAM_PRETRAINED="./ck/sam_vit_h_4b8939.pth"
BASE_MODEL="./ck/LISA-7B-v1"  # Or HuggingFace base model liuhaotian/llava-llama-2-7b-chat
EXP_NAME="SIDA-7B-reduced"
LOG_DIR="./runs/${EXP_NAME}"

echo "=========================================================="
echo "Starting SIDA-7B Reduced Training (1 epoch, 100 steps)"
echo "Full paper run: 10 epochs, 1000 steps per epoch (~100x)"
echo "=========================================================="

# 1. Run Shortened DeepSpeed Fine-Tuning
deepspeed --master_port=24999 train_SIDA.py \
  --version="${BASE_MODEL}" \
  --dataset_dir="${DATASET_DIR}" \
  --vision_pretrained="${SAM_PRETRAINED}" \
  --val_dataset="${DATASET_DIR}" \
  --batch_size=2 \
  --exp_name="${EXP_NAME}" \
  --epochs=1 \
  --steps_per_epoch=100 \
  --lr=0.0001 \
  --ce_loss_weight=1.0 \
  --dice_loss_weight=0.5 \
  --bce_loss_weight=2.0 \
  --cls_loss_weight=1.0

echo "Training finished. Converting ZeRO checkpoint to FP32..."

# 2. Extract FP32 weights from DeepSpeed ZeRO checkpoint
CHECKPOINT_DIR="${LOG_DIR}/ckpt_model"
python zero_to_fp32.py "${CHECKPOINT_DIR}" "${LOG_DIR}/pytorch_model.bin"

echo "Merging LoRA weights with base model..."

# 3. Merge LoRA weights into Hugging Face standalone model
python merge_lora_weights_and_save_hf_model.py \
  --version="${BASE_MODEL}" \
  --weight="${LOG_DIR}/pytorch_model.bin" \
  --save_path="./ck/SIDA-7B-reduced"

echo "=========================================================="
echo "SIDA-7B-reduced weights successfully saved to ./ck/SIDA-7B-reduced"
echo "=========================================================="
