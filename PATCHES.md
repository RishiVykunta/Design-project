# PATCHES.md - SIDA Modifications and Compatibility Patches

## Environment & Dependency Audit
- **Operating System**: Windows 11 (x64)
- **Hardware**: 12th Gen Intel Core i5-12500H, Intel Iris Xe Integrated Graphics (128 MB dedicated VRAM), 16GB System RAM (No discrete NVIDIA GPU / CUDA).

### Requirements Audit & Conflicts
1. **`torch==1.13.1` & `torchvision==0.14.1` with `--extra-index-url https://download.pytorch.org/whl/cu117`**:
   - The upstream repo hardcodes CUDA 11.7 PyTorch wheels (2.3 GB download). On this Windows host with integrated Intel Iris Xe graphics, `torch==1.13.1+cpu` and `torchvision==0.14.1+cpu` provide identical API and exact version pins without downloading 2.3 GB of unused CUDA driver binaries.
2. **`deepspeed==0.14.0`**:
   - Upstream pinned `deepspeed==0.14.0`. On Windows, installing from source fails with `PermissionError: [WinError 5] Access is denied: '.\\deepspeed\\ops\\csrc'` (due to directory symlinks in setup.py) and requires MSVC + Linux headers.
   - **Resolution**: DeepSpeed is strictly needed for distributed multi-GPU training (`train_SIDA.py`), not for inference (`chat.py`, `chat_description.py`, `test.py`). DeepSpeed is excluded from the local Windows environment and preserved in the Cloud/Colab training scripts.
3. **`pycocotools==2.0.6`**:
   - Upstream pinned `pycocotools==2.0.6`, which lacks precompiled wheels for Python 3.10 on Windows and threw `error: Microsoft Visual C++ 14.0 or greater is required`.
   - **Resolution**: Installed `pycocotools==2.0.11`, which provides pre-built Windows x64 binary wheels with identical COCO evaluation APIs.
4. **`bitsandbytes==0.41.1`**:
   - Upstream relies on `bitsandbytes` for 8-bit/4-bit quantization on CUDA GPUs. On Windows without an NVIDIA GPU, `bitsandbytes` loads in CPU-only mode (emitting a warning that 8-bit optimizers/quantization are unavailable). Fallbacks for inference on CPU are configured.

### Code-Level Compatibility Patches
5. **`model/SIDA.py` & `model/SIDA_description.py` Unconditional DeepSpeed Import**:
   - **Problem**: Both model definition files had top-level `import deepspeed` at line 18, even though deepspeed is not used during model definition or inference. Without deepspeed installed on Windows, running `chat.py` crashed immediately with `ModuleNotFoundError: No module named 'deepspeed'`.
   - **Patch**: Wrapped the import in `try: import deepspeed except ImportError: deepspeed = None`.
6. **Data Ingestion Script (`fetch_small_subset.py`)**:
   - Created script utilizing `huggingface_hub` and `pyarrow` to stream parquet shards from `saberzl/SID_Set_description` and generate the required directory layout:
     - `SID_Set/train/` (675 samples, balanced classes, masks, and descriptions)
     - `SID_Set/validation/` (150 samples)
     - `SID_Set/test/` (150 samples)
   - Created ground truth description maps (`real_GT.json`, `full_synthetic_GT.json`, `tampered_GT.json`) for each split.
7. **`model/SIDA.py` & `model/SIDA_description.py` Dynamic Tensor Devices in `evaluate()`**:
   - **Problem**: Lines 437, 460, and 475 in both model files hardcoded `.cuda()` on positional mask and offset tensors (`torch.zeros(...).bool().cuda()`). On CPU or fallback environments without CUDA, this triggered runtime exceptions.
   - **Patch**: Updated tensor allocations to dynamically match the active output sequence device (`device=cls_token_mask.device`, `device=seg_token_mask.device`, and `device=seg_token_offset.device`).
8. **`model/segment_anything/build_sam.py` Deserialization Device Mapping**:
   - **Problem**: Line 106 loaded the SAM checkpoint using `torch.load(f)` without `map_location`, causing `RuntimeError: Attempting to deserialize object on a CUDA device` when executed on CPU.
   - **Patch**: Added `map_location = None if torch.cuda.is_available() else "cpu"` to map state dict keys to the host device.
9. **`chat.py` & `chat_description.py` Non-Interactive CLI & OS Path Normalization**:
   - **Problem**: The upstream scripts blocked indefinitely waiting for `input()` interactive prompts and used Unix-style `/` string splitting to name output files, failing on Windows `\` paths. Additionally, all tensors were hardcoded to `.cuda()`.
   - **Patch**: Added `--image_path` and `--prompt` CLI arguments for automated batch evaluation, added dynamic device placement (`to(device=device, dtype=torch_dtype)`), and normalized path basename parsing via `os.path.splitext(os.path.basename(path))[0]`.
10. **Conversation Template Alignment & Evaluation Pipeline (`utils/SID_Set.py`, `eval_subset.py`)**:
   - **Problem**: In `model/llava/conversation.py`, `default_conversation` defaults to `conv_vicuna_v0` (roles `###Human:` and `###Assistant:`, separator `###`). `utils/SID_Set.py` in `__getitem__` and `collate_fn` accesses `conversation_lib.default_conversation` assuming `llava_v1` format (`USER` and `ASSISTANT`, separator `</s>`). When uninitialized, `collate_fn` failed with `AssertionError: Length mismatch`.
   - **Patch**: Configured `conversation_lib.default_conversation = conversation_lib.conv_templates["llava_v1"]` at script entry points and built a direct non-interactive evaluation loop in `eval_subset.py` that formats pure prompts, decodes `[CLS]` predictions, extracts SAM ViT-H masks, and calculates IoU, AUC, and F1.

