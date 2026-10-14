import os
import json
import io
import pandas as pd
from PIL import Image
from huggingface_hub import hf_hub_download

def extract_and_save_dataset(output_root="SID_Set"):
    """
    Extracts a small balanced subset from HF parquet files and saves
    into the directory structure required by SIDA:
    SID_Set/{train,validation,test}/{real,full_synthetic,tampered,masks,description}
    """
    os.makedirs(output_root, exist_ok=True)
    
    # 1. Validation split (100 per class: 100 real, 100 full_synthetic, 100 tampered)
    print("Loading validation parquet shard (300 samples total, 100 per class)...")
    val_shard = hf_hub_download(
        "saberzl/SID_Set_description",
        "data/validation-00000-of-00001.parquet",
        repo_type="dataset"
    )
    df_val = pd.read_parquet(val_shard)
    
    # 2. Train split (load train shard)
    print("Loading train parquet shard...")
    train_shard = hf_hub_download(
        "saberzl/SID_Set_description",
        "data/train-00000-of-00004.parquet",
        repo_type="dataset"
    )
    df_train = pd.read_parquet(train_shard)
    
    # We will allocate:
    # train: ~300 per class from df_train
    # validation: 50 per class from df_val (first half)
    # test: 50-100 per class from df_val (second half) or combined
    print(f"Train shard shape: {df_train.shape}, Val shard shape: {df_val.shape}")
    
    splits_data = {
        "train": [],
        "validation": [],
        "test": []
    }
    
    # Process train split (up to 300 per class)
    for label_id in [0, 1, 2]:
        sub = df_train[df_train['label'] == label_id]
        splits_data["train"].append(sub.iloc[:300])
    
    # Split val shard into validation (50 per class) and test (50 per class)
    # or if we want 100 test, we can use 100 for test and subset for val
    for label_id in [0, 1, 2]:
        sub = df_val[df_val['label'] == label_id]
        splits_data["validation"].append(sub.iloc[:50])
        splits_data["test"].append(sub.iloc[50:100])
    
    for split_name, df_list in splits_data.items():
        split_df = pd.concat(df_list).sample(frac=1.0, random_state=42).reset_index(drop=True)
        split_dir = os.path.join(output_root, split_name)
        real_dir = os.path.join(split_dir, "real")
        syn_dir = os.path.join(split_dir, "full_synthetic")
        tamper_dir = os.path.join(split_dir, "tampered")
        mask_dir = os.path.join(split_dir, "masks")
        desc_dir = os.path.join(split_dir, "description")
        
        for d in [real_dir, syn_dir, tamper_dir, mask_dir, desc_dir]:
            os.makedirs(d, exist_ok=True)
            
        descriptions_map = {
            "real": {},
            "full_synthetic": {},
            "tampered": {}
        }
        
        print(f"\nWriting {len(split_df)} samples to {split_dir}...")
        for idx, row in split_df.iterrows():
            lbl = int(row['label'])
            img_data = row['image']
            mask_data = row.get('mask')
            desc_text = row.get('description', '')
            
            # Image bytes
            if isinstance(img_data, dict) and 'bytes' in img_data:
                img_bytes = img_data['bytes']
            elif hasattr(img_data, 'tobytes'):
                img_bytes = img_data
            else:
                continue
                
            img = Image.open(io.BytesIO(img_bytes)) if isinstance(img_bytes, (bytes, bytearray)) else img_data
            
            base_id = f"{split_name}_{idx:04d}"
            
            if lbl == 0:
                filename = f"{base_id}.jpg"
                save_path = os.path.join(real_dir, filename)
                img.convert("RGB").save(save_path, "JPEG", quality=95)
                if desc_text:
                    descriptions_map["real"][filename] = desc_text
            elif lbl == 1:
                filename = f"{base_id}.png"
                save_path = os.path.join(syn_dir, filename)
                img.convert("RGB").save(save_path, "PNG")
                if desc_text:
                    descriptions_map["full_synthetic"][filename] = desc_text
            elif lbl == 2:
                filename = f"{base_id}.png"
                save_path = os.path.join(tamper_dir, filename)
                img.convert("RGB").save(save_path, "PNG")
                if desc_text:
                    descriptions_map["tampered"][filename] = desc_text
                    
                # Save mask
                if mask_data is not None and isinstance(mask_data, dict) and mask_data.get('bytes'):
                    m_bytes = mask_data['bytes']
                    mask_img = Image.open(io.BytesIO(m_bytes))
                    mask_filename = f"{base_id}_mask.png"
                    mask_save_path = os.path.join(mask_dir, mask_filename)
                    mask_img.convert("L").save(mask_save_path, "PNG")
                    
        # Write description JSON files
        for cat_name, desc_dict in descriptions_map.items():
            json_path = os.path.join(desc_dir, f"{cat_name}_GT.json")
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(desc_dict, f, indent=2)
            print(f"Saved {len(desc_dict)} descriptions to {json_path}")
            
    print("\nDataset preparation complete! Layout created at:", os.path.abspath(output_root))

if __name__ == "__main__":
    extract_and_save_dataset()
