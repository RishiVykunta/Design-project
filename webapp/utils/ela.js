/**
 * Research-grade Error Level Analysis (ELA) and Mask Analysis Utilities
 * Runs client-side using standard HTML5 Canvas without heavy external dependencies.
 */

/**
 * Computes the Error Level Analysis (ELA) pixel difference map.
 * ELA re-saves the image at a specified JPEG compression level and computes
 * the absolute difference between original and recompressed pixel values.
 * 
 * @param {string} imageSrc - Image URL or DataURL
 * @param {number} quality - JPEG compression quality (0.5 to 0.98, default 0.90)
 * @param {number} scale - Amplification scale multiplier (10 to 40, default 20)
 * @returns {Promise<string|null>} - Base64 PNG DataURL of the ELA heatmap
 */
export async function computeClientELA(imageSrc, quality = 0.90, scale = 20) {
  if (typeof window === 'undefined' || !imageSrc) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        if (!width || !height) return resolve(null);

        // Cap dimensions for performance if image is massive (e.g. > 1600px)
        const maxDim = 1600;
        let targetW = width;
        let targetH = height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            targetH = Math.round((height * maxDim) / width);
            targetW = maxDim;
          } else {
            targetW = Math.round((width * maxDim) / height);
            targetH = maxDim;
          }
        }

        const origCanvas = document.createElement('canvas');
        origCanvas.width = targetW;
        origCanvas.height = targetH;
        const origCtx = origCanvas.getContext('2d');
        if (!origCtx) return resolve(null);

        origCtx.drawImage(img, 0, 0, targetW, targetH);
        const origData = origCtx.getImageData(0, 0, targetW, targetH);
        const origPixels = origData.data;

        // Recompress to JPEG at user quality setting
        const jpegUrl = origCanvas.toDataURL('image/jpeg', quality);

        const recompressedImg = new Image();
        recompressedImg.onload = () => {
          try {
            const reCanvas = document.createElement('canvas');
            reCanvas.width = targetW;
            reCanvas.height = targetH;
            const reCtx = reCanvas.getContext('2d');
            if (!reCtx) return resolve(null);

            reCtx.drawImage(recompressedImg, 0, 0, targetW, targetH);
            const reData = reCtx.getImageData(0, 0, targetW, targetH);
            const rePixels = reData.data;

            const elaData = origCtx.createImageData(targetW, targetH);
            const elaPixels = elaData.data;
            const total = origPixels.length;

            for (let i = 0; i < total; i += 4) {
              const diffR = Math.abs(origPixels[i] - rePixels[i]) * scale;
              const diffG = Math.abs(origPixels[i + 1] - rePixels[i + 1]) * scale;
              const diffB = Math.abs(origPixels[i + 2] - rePixels[i + 2]) * scale;

              elaPixels[i] = Math.min(255, diffR);
              elaPixels[i + 1] = Math.min(255, diffG);
              elaPixels[i + 2] = Math.min(255, diffB);
              elaPixels[i + 3] = 255; // Fully opaque
            }

            origCtx.putImageData(elaData, 0, 0);
            resolve(origCanvas.toDataURL('image/png'));
          } catch (e) {
            console.warn('ELA pixel diff computation error:', e);
            resolve(null);
          }
        };

        recompressedImg.onerror = () => resolve(null);
        recompressedImg.src = jpegUrl;

      } catch (err) {
        console.warn('ELA preparation error:', err);
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = imageSrc;
  });
}

/**
 * Calculates the exact percentage of pixels identified in the tamper mask.
 * 
 * @param {string} maskSrc - Mask image URL or DataURL
 * @returns {Promise<number|null>} - Percentage coverage (0.0 to 100.0) or null
 */
export async function calculateMaskCoverage(maskSrc) {
  if (typeof window === 'undefined' || !maskSrc) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // Downsample for quick calculation
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 300 / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);

        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        let whitePixels = 0;
        const totalPixels = w * h;

        for (let i = 0; i < data.length; i += 4) {
          // Check luminance: foreground is typically white/bright
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (brightness > 120 && data[i + 3] > 64) {
            whitePixels++;
          }
        }

        const percentage = Math.round((whitePixels / totalPixels) * 1000) / 10;
        resolve(percentage);
      } catch (err) {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = maskSrc;
  });
}
