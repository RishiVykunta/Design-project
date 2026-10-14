import Head from 'next/head'
import { useState } from 'react'

// Automatically compress and resize images over 2MB client-side to prevent Vercel 4.5MB limit
async function compressImageIfNeeded(inputFile) {
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
        const maxDim = 1280;
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
          0.85
        );
      };
      img.onerror = () => resolve(inputFile);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(inputFile);
    reader.readAsDataURL(inputFile);
  });
}

export default function Home() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [result, setResult] = useState(null)

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) {
      setFile(f)
      setPreview(URL.createObjectURL(f))
      setResult(null)
      setStatusMessage('')
    }
  }

  const handleChange = (e) => {
    const f = e.target.files[0]
    if (f) {
      setFile(f)
      setPreview(URL.createObjectURL(f))
      setResult(null)
      setStatusMessage('')
    }
  }

  const uploadAndAnalyze = async () => {
    if (!file) {
      setStatusMessage('Please select or drop an image first.')
      return
    }

    setLoading(true)
    setStatusMessage('Optimizing image & preparing upload...')
    setResult(null)

    try {
      // 1. Compress image client-side if > 2MB to ensure it never exceeds Vercel 4.5MB threshold
      const fileToUpload = await compressImageIfNeeded(file)
      setStatusMessage('Uploading to SIDA AI engine...')

      const form = new FormData()
      form.append('image', fileToUpload)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      })

      // 2. Safe check before reading body
      if (!res.ok) {
        const errorText = await res.text()
        let friendlyErr = errorText
        try {
          const errObj = JSON.parse(errorText)
          friendlyErr = errObj.error || errObj.message || errorText
        } catch (_) {}

        if (res.status === 413 || friendlyErr.includes('Request Entity Too Large') || friendlyErr.includes('413')) {
          throw new Error('Image exceeds Vercel 4.5MB payload limit. Please try a smaller image.')
        }
        throw new Error(friendlyErr || `Upload failed with HTTP status ${res.status}`)
      }

      const data = await res.json()

      // If backend did not have SIDA attached directly, attempt direct client-side SIDA query
      let sidaData = data.sida
      if (!sidaData) {
        try {
          const directForm = new FormData()
          directForm.append('file', fileToUpload)
          directForm.append('mode', 'description')
          const directRes = await fetch('http://127.0.0.1:8000/api/predict', {
            method: 'POST',
            body: directForm,
          })
          if (directRes.ok) {
            sidaData = await directRes.json()
          }
        } catch (clientErr) {
          console.warn('Direct SIDA connection note:', clientErr.message)
        }
      }


      setResult({
        blobUrl: data.url,
        filename: data.filename,
        sida: sidaData,
      })

      setStatusMessage('Analysis complete!')
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>SIDA: Image Deepfake Detection, Localization & Explanation</title>
        <meta name="description" content="Social Media Image Deepfake Detection, Localization and Explanation with Large Multimodal Model (CVPR 2025)" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>

      <main style={styles.main}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerBadge}>CVPR 2025 OFFICIAL ARCHITECTURE</div>
          <h1 style={styles.title}>SIDA Image Deepfake Forensic Suite</h1>
          <p style={styles.subtitle}>
            Detect whether an image is <strong>Real</strong>, <strong>Full Synthetic (AI Generated)</strong>, or <strong>Tampered (Fake)</strong>, and pinpoint <strong>exactly where it is fake</strong> using SAM ViT-H pixel segmentation.
          </p>
        </header>

        {/* Upload Container */}
        <div style={styles.uploadCard}>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById('file-picker').click()}
            style={styles.dropzone}
          >
            {preview ? (
              <img src={preview} alt="preview" style={styles.previewImg} />
            ) : (
              <div style={styles.dropContent}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📸</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Drag & drop image here, or click to browse</div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>Supports PNG, JPEG, WebP social media images</div>
              </div>
            )}
          </div>

          <input
            id="file-picker"
            type="file"
            accept="image/*"
            onChange={handleChange}
            style={{ display: 'none' }}
          />

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', width: '100%' }}>
            <button
              onClick={uploadAndAnalyze}
              disabled={loading}
              style={{
                ...styles.primaryBtn,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '🔍 Running Multimodal Forensic Analysis...' : '⚡ Upload & Inspect Authenticity'}
            </button>
          </div>

          {statusMessage && (
            <p style={{ marginTop: '1rem', color: '#cbd5e1', fontSize: '0.95rem' }}>{statusMessage}</p>
          )}
        </div>

        {/* Results Presentation */}
        {result && (
          <div style={styles.resultsContainer}>
            {/* Verdict Card */}
            <div style={styles.verdictCard}>
              <div>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
                  Authenticity Verdict
                </div>
                <div style={getVerdictStyle(result.sida?.verdict)}>
                  {result.sida?.verdict ? result.sida.verdict.toUpperCase() : 'UPLOADED (STORAGE ONLY)'}
                </div>
              </div>

              {result.blobUrl && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Permanent Vercel Storage</div>
                  <a href={result.blobUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: '#38bdf8', textDecoration: 'none' }}>
                    View Raw Cloud File ↗
                  </a>
                </div>
              )}
            </div>

            {/* SIDA Detailed Reasoning */}
            {result.sida?.text_output && (
              <div style={styles.explanationBox}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Forensic Explanation & Findings
                </div>
                <div style={{ fontFamily: `'JetBrains Mono', monospace`, fontSize: '0.95rem', lineHeight: 1.6, color: '#f1f5f9' }}>
                  {result.sida.text_output}
                </div>
              </div>
            )}

            {/* Where It Is Fake: 3-Way Visual Comparison */}
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#f8fafc' }}>
                📍 Localization: Where Is It Manipulated?
              </h3>

              <div style={styles.imageGrid}>
                {/* 1. Original */}
                <div style={styles.imageCard}>
                  <div style={styles.imageCardHeader}>1. Original Uploaded Image</div>
                  <img
                    src={result.sida?.original_image || preview}
                    alt="Original"
                    style={styles.resultImg}
                  />
                </div>

                {/* 2. Mask */}
                <div style={styles.imageCard}>
                  <div style={styles.imageCardHeader}>
                    2. Tamper Mask (White = Fake Region)
                  </div>
                  {result.sida?.mask_image ? (
                    <img
                      src={result.sida.mask_image}
                      alt="Segmentation Mask"
                      style={styles.resultImg}
                    />
                  ) : (
                    <div style={styles.placeholderBox}>
                      No mask predicted (Image classified as authentic or SIDA backend starting)
                    </div>
                  )}
                </div>

                {/* 3. Red Overlay */}
                <div style={styles.imageCard}>
                  <div style={styles.imageCardHeader}>
                    3. Localization Overlay (Red Highlight)
                  </div>
                  {result.sida?.overlay_image ? (
                    <img
                      src={result.sida.overlay_image}
                      alt="Localization Overlay"
                      style={styles.resultImg}
                    />
                  ) : (
                    <div style={styles.placeholderBox}>
                      Overlay available for tampered images
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Note if SIDA backend is offline */}
            {!result.sida && (
              <div style={styles.backendNotice}>
                <strong>ℹ️ To enable instant Real/Fake classification and mask localization:</strong>
                <p style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                  Make sure the local SIDA Python engine is running: <code>.\.venv\Scripts\python.exe app.py</code>.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  )
}

function getVerdictStyle(verdict) {
  const base = {
    fontSize: '1.5rem',
    fontWeight: 800,
    marginTop: '0.25rem',
    display: 'inline-block',
    padding: '0.35rem 1rem',
    borderRadius: '8px',
  }
  if (!verdict) return { ...base, color: '#94a3b8', background: 'rgba(255,255,255,0.05)' }
  const v = verdict.toLowerCase()
  if (v.includes('tamper') || v.includes('fake')) {
    return { ...base, color: '#f87171', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)' }
  } else if (v.includes('synthetic')) {
    return { ...base, color: '#c084fc', background: 'rgba(192, 132, 252, 0.15)', border: '1px solid rgba(192, 132, 252, 0.4)' }
  } else {
    return { ...base, color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.4)' }
  }
}

const styles = {
  main: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at 10% 10%, #0f172a 0%, #020617 100%)',
    color: '#f8fafc',
    fontFamily: `'Outfit', sans-serif`,
    padding: '2.5rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  header: {
    maxWidth: '800px',
    textAlign: 'center',
    marginBottom: '2rem',
  },
  headerBadge: {
    display: 'inline-block',
    padding: '0.3rem 0.85rem',
    borderRadius: '9999px',
    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    marginBottom: '0.75rem',
  },
  title: {
    fontSize: '2.25rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    background: 'linear-gradient(to right, #ffffff, #94a3b8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '0.75rem',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#94a3b8',
    lineHeight: 1.6,
  },
  uploadCard: {
    width: '100%',
    maxWidth: '720px',
    background: 'rgba(30, 41, 59, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '1.75rem',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  dropzone: {
    width: '100%',
    height: '240px',
    border: '2px dashed rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: 'rgba(255, 255, 255, 0.02)',
    overflow: 'hidden',
    transition: 'all 0.2s',
  },
  dropContent: {
    textAlign: 'center',
    padding: '1rem',
  },
  previewImg: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  primaryBtn: {
    flex: 1,
    padding: '0.9rem',
    background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: 600,
    boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  resultsContainer: {
    width: '100%',
    maxWidth: '1000px',
    marginTop: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  verdictCard: {
    background: 'rgba(30, 41, 59, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    padding: '1.25rem 1.75rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  explanationBox: {
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '1.25rem',
  },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.25rem',
  },
  imageCard: {
    background: 'rgba(30, 41, 59, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  imageCardHeader: {
    padding: '0.6rem 0.85rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#94a3b8',
    background: 'rgba(255, 255, 255, 0.02)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  resultImg: {
    width: '100%',
    height: '240px',
    objectFit: 'contain',
    background: '#030712',
  },
  placeholderBox: {
    height: '240px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    textAlign: 'center',
    fontSize: '0.85rem',
    color: '#64748b',
    background: '#030712',
  },
  backendNotice: {
    background: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    borderRadius: '10px',
    padding: '1rem',
    color: '#bae6fd',
    fontSize: '0.9rem',
  },
}
