import os
import requests
from tqdm import tqdm

SAM_URL = "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth"
DEST_PATH = os.path.join("ck", "sam_vit_h_4b8939.pth")

def download_file(url, dest_path):
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    temp_path = dest_path + ".tmp"
    initial_pos = os.path.getsize(temp_path) if os.path.exists(temp_path) else 0

    headers = {}
    if initial_pos > 0:
        headers["Range"] = f"bytes={initial_pos}-"

    print(f"Connecting to {url} (resuming from {initial_pos / 1024**2:.1f} MB)...")
    response = requests.get(url, headers=headers, stream=True, timeout=30)
    
    if response.status_code == 416: # Range not satisfiable, file probably done
        total_size = initial_pos
    elif response.status_code in (200, 206):
        total_size = int(response.headers.get("content-length", 0)) + initial_pos
    else:
        response.raise_for_status()

    mode = "ab" if initial_pos > 0 else "wb"
    with open(temp_path, mode) as f, tqdm(
        total=total_size,
        initial=initial_pos,
        unit="B",
        unit_scale=True,
        desc=os.path.basename(dest_path),
    ) as pbar:
        for chunk in response.iter_content(chunk_size=1024 * 1024):
            if chunk:
                f.write(chunk)
                pbar.update(len(chunk))

    if os.path.exists(dest_path):
        os.remove(dest_path)
    os.rename(temp_path, dest_path)
    print(f"Successfully downloaded {dest_path} ({os.path.getsize(dest_path) / 1024**2:.1f} MB)")

if __name__ == "__main__":
    download_file(SAM_URL, DEST_PATH)
