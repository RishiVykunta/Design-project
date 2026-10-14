import os
from huggingface_hub import snapshot_download

def download_sida_7b(repo_id="saberzl/SIDA-7B", target_dir=os.path.join("ck", "SIDA-7B")):
    os.makedirs(target_dir, exist_ok=True)
    print(f"Starting download of {repo_id} to {target_dir}...")
    print("This will download tokenizer and PyTorch model shards (~15 GB)...")
    
    snapshot_download(
        repo_id=repo_id,
        local_dir=target_dir,
        local_dir_use_symlinks=False,
        resume_download=True,
        max_workers=2
    )
    print(f"Successfully downloaded {repo_id} into {target_dir}!")

if __name__ == "__main__":
    download_sida_7b()
