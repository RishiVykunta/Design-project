/**
 * General helper utilities for SIDA forensic dashboard
 */

export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDimensions(w, h) {
  if (!w || !h) return 'Standard Resolution';
  return `${w} × ${h} px`;
}

/**
 * Pre-upload compression for client-side files over 2MB.
 * Prevents Vercel 4.5MB serverless payload limit while retaining forensic resolution.
 */
export async function compressImageIfNeeded(inputFile) {
  if (!inputFile || inputFile.size <= 2 * 1024 * 1024) {
    return inputFile;
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1600;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(inputFile);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], inputFile.name.replace(/\.[^/.]+$/, ".jpg"), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(inputFile);
            }
          },
          'image/jpeg',
          0.88
        );
      };
      img.onerror = () => resolve(inputFile);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(inputFile);
    reader.readAsDataURL(inputFile);
  });
}

/**
 * Inspects natural image dimensions from a file object.
 */
export async function getImageDimensionsFromFile(file) {
  if (!file) return null;
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Returns consistent theme variables and wording for classification verdicts.
 */
export function getVerdictConfig(verdict) {
  if (!verdict) {
    return {
      key: 'uncertain',
      title: 'Inconclusive — Analysis Required',
      shortLabel: 'Inconclusive',
      accentColor: '#FBBF24',
      bgColor: 'rgba(251, 191, 36, 0.12)',
      borderColor: 'rgba(251, 191, 36, 0.35)',
      description: 'The image has been staged, but evidence is inconclusive or analysis has not yet finished.',
      severity: 'medium',
    };
  }

  const v = verdict.toLowerCase();
  if (v.includes('tamper') || v.includes('fake') || v.includes('manipulat') || v.includes('splice')) {
    return {
      key: 'tampered',
      title: 'Suspected Manipulation Detected',
      shortLabel: 'Tampered / Manipulated',
      accentColor: '#FB7185',
      bgColor: 'rgba(251, 113, 133, 0.12)',
      borderColor: 'rgba(251, 113, 133, 0.35)',
      description: 'Localized splicing, editing, or object inpainting anomalies were detected within the image.',
      severity: 'high',
    };
  }

  if (v.includes('synthetic') || v.includes('ai') || v.includes('gen') || v.includes('diffusion')) {
    return {
      key: 'synthetic',
      title: 'Likely AI-Generated',
      shortLabel: 'Fully Synthetic (AI)',
      accentColor: '#A78BFA',
      bgColor: 'rgba(167, 139, 250, 0.12)',
      borderColor: 'rgba(167, 139, 250, 0.35)',
      description: 'Global diffusion rendering characteristics and latent synthesis patterns indicate an AI-generated image.',
      severity: 'medium',
    };
  }

  if (v.includes('real') || v.includes('authentic') || v.includes('photo')) {
    return {
      key: 'real',
      title: 'Likely Authentic',
      shortLabel: 'Real / Authentic',
      accentColor: '#34D399',
      bgColor: 'rgba(52, 211, 153, 0.12)',
      borderColor: 'rgba(52, 211, 153, 0.35)',
      description: 'Natural sensor noise distribution and optical illumination patterns are consistent with genuine camera photography.',
      severity: 'low',
    };
  }

  return {
    key: 'uncertain',
    title: 'Inconclusive — Further Analysis Recommended',
    shortLabel: 'Inconclusive',
    accentColor: '#FBBF24',
    bgColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
    description: 'The classifier output did not satisfy confident category boundaries; multi-modal manual review recommended.',
    severity: 'medium',
  };
}

/**
 * Cleans raw LLaVA/SIDA special tokens from model textual response.
 */
export function cleanModelExplanation(rawText) {
  if (!rawText) return '';
  return rawText
    .replace(/<s>/g, '')
    .replace(/<\/s>/g, '')
    .replace(/\[CLS\]/g, '')
    .replace(/\[SEG\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
