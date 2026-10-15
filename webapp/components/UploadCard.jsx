import React, { useState, useRef, useEffect } from 'react';
import { formatBytes, formatDimensions } from '../utils/helpers';

export default function UploadCard({
  file,
  preview,
  dimensions,
  loading,
  loadingStage,
  error,
  statusMessage,
  onFileSelect,
  onClearFile,
  onAnalyze,
  onLoadSample,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [samples, setSamples] = useState([]);
  const [loadingSampleId, setLoadingSampleId] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch benchmark sample list
  useEffect(() => {
    fetch('/api/samples')
      .then((res) => res.json())
      .then((data) => {
        if (data.samples && Array.isArray(data.samples)) {
          setSamples(data.samples);
        }
      })
      .catch((err) => console.warn('Samples fetch warning:', err));
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!loading) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (loading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSelect(droppedFile);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const validateAndSelect = (selectedFile) => {
    if (!selectedFile) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp'];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(jpg|jpeg|png|webp|tiff|bmp)$/i)) {
      alert('Unsupported file format. Please upload a standard image file (JPEG, PNG, WebP, TIFF).');
      return;
    }
    onFileSelect(selectedFile);
  };

  const handleSampleClick = async (sample) => {
    if (loading) return;
    setLoadingSampleId(sample.id);
    try {
      await onLoadSample(sample);
    } finally {
      setLoadingSampleId(null);
    }
  };

  return (
    <div id="upload-section" style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <h3 style={styles.cardTitle}>Image Forensic Ingestion</h3>
          <p style={styles.cardSubtitle}>
            Select or drag a suspect image for authenticity screening and pixel-level tampering segmentation.
          </p>
        </div>
        <div style={styles.specBadge}>
          <span>Formats: JPEG, PNG, WebP, TIFF</span>
          <span>• Max 4.5 MB</span>
        </div>
      </div>

      {/* Dropzone / Preview Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !loading && !file && fileInputRef.current?.click()}
        style={{
          ...styles.dropzone,
          borderColor: isDragOver ? '#3B82F6' : file ? '#273449' : 'rgba(255, 255, 255, 0.16)',
          backgroundColor: isDragOver ? 'rgba(59, 130, 246, 0.08)' : file ? '#080D1B' : 'rgba(21, 31, 50, 0.45)',
          cursor: loading ? 'not-allowed' : file ? 'default' : 'pointer',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/tiff"
          onChange={handleInputChange}
          style={{ display: 'none' }}
          disabled={loading}
        />

        {preview ? (
          <div style={styles.previewContainer}>
            <div style={styles.imageWrapper}>
              <img
                src={preview}
                alt="Selected Image Preview"
                style={styles.previewImage}
              />
            </div>
            
            {/* Metadata Bar */}
            <div style={styles.metaBar}>
              <div style={styles.metaDetails}>
                <span style={styles.fileName} title={file?.name}>{file?.name || 'Uploaded File'}</span>
                <span style={styles.metaChip}>{formatBytes(file?.size)}</span>
                {dimensions && (
                  <span style={styles.metaChip}>{formatDimensions(dimensions.width, dimensions.height)}</span>
                )}
                <span style={styles.metaChip}>{file?.type || 'image/jpeg'}</span>
              </div>
              
              <div style={styles.metaActions}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={loading}
                  style={styles.actionBtnSmall}
                >
                  Replace Image
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearFile();
                  }}
                  disabled={loading}
                  style={{ ...styles.actionBtnSmall, color: '#FB7185' }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.emptyPrompt}>
            <div style={styles.uploadIconCircle}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#38BDF8' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p style={styles.promptMain}>
              <strong>Click to browse</strong> or drag & drop image here
            </p>
            <p style={styles.promptSub}>
              Social media screenshots, camera photos, or generative AI outputs
            </p>
          </div>
        )}
      </div>

      {/* Benchmark Samples Selector Shelf */}
      {samples.length > 0 && (
        <div style={styles.samplesShelf}>
          <div style={styles.samplesShelfTitle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#94A3B8' }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>Or test with benchmark dataset verification samples:</span>
          </div>
          <div style={styles.sampleChipsContainer}>
            {samples.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSampleClick(sample)}
                disabled={loading}
                style={{
                  ...styles.sampleChip,
                  borderColor: loadingSampleId === sample.id ? '#3B82F6' : '#273449',
                }}
              >
                <span style={{ ...styles.sampleBadge, color: sample.badgeColor, backgroundColor: `${sample.badgeColor}18` }}>
                  {sample.typeLabel}
                </span>
                <span style={styles.sampleChipName}>{sample.name}</span>
                {loadingSampleId === sample.id && (
                  <span style={styles.chipSpinner}>...</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons & Status */}
      <div style={styles.actionRow}>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={!file || loading}
          style={{
            ...styles.analyzeBtn,
            opacity: !file || loading ? 0.6 : 1,
            cursor: !file || loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? (
            <span style={styles.btnContent}>
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              <span>{loadingStage || 'Analyzing Authenticity...'}</span>
            </span>
          ) : (
            <span style={styles.btnContent}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
              <span>Inspect Authenticity</span>
            </span>
          )}
        </button>
      </div>

      {/* Loading Progress Stages */}
      {loading && (
        <div style={styles.loadingBanner}>
          <div style={styles.loadingHeader}>
            <span style={styles.loadingPulse}></span>
            <span style={styles.loadingTitle}>{loadingStage || 'Processing Forensic Pipeline'}</span>
          </div>
          <div style={styles.loadingSteps}>
            <div style={styles.stepItem}>
              <span style={styles.stepDot}>1</span>
              <span>Bitstream header & EXIF verification</span>
            </div>
            <div style={styles.stepItem}>
              <span style={styles.stepDot}>2</span>
              <span>Multimodal authenticity classification</span>
            </div>
            <div style={styles.stepItem}>
              <span style={styles.stepDot}>3</span>
              <span>SAM ViT-H pixel segmentation & ELA diff</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner with Retry */}
      {error && (
        <div style={styles.errorBanner}>
          <div style={styles.errorIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div style={styles.errorContent}>
            <strong style={styles.errorTitle}>Analysis Encountered an Issue</strong>
            <p style={styles.errorMessage}>{error}</p>
          </div>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={!file || loading}
            style={styles.retryBtn}
          >
            Retry
          </button>
        </div>
      )}

      {/* Status Notice */}
      {statusMessage && !error && !loading && (
        <div style={styles.statusBanner}>
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    width: '100%',
    maxWidth: '1000px',
    margin: '0 auto',
    backgroundColor: '#151F32',
    border: '1px solid #273449',
    borderRadius: '16px',
    padding: '1.75rem',
    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  cardTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#F8FAFC',
    margin: 0,
  },
  cardSubtitle: {
    fontSize: '0.875rem',
    color: '#94A3B8',
    margin: '0.25rem 0 0 0',
  },
  specBadge: {
    fontSize: '0.75rem',
    color: '#64748B',
    backgroundColor: '#10182A',
    border: '1px solid #273449',
    padding: '0.35rem 0.65rem',
    borderRadius: '6px',
    display: 'flex',
    gap: '0.35rem',
  },
  dropzone: {
    width: '100%',
    minHeight: '220px',
    border: '2px dashed',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
    position: 'relative',
  },
  emptyPrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '2.5rem 1.5rem',
  },
  uploadIconCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  promptMain: {
    fontSize: '1rem',
    color: '#E2E8F0',
    margin: '0 0 0.35rem 0',
  },
  promptSub: {
    fontSize: '0.825rem',
    color: '#64748B',
    margin: 0,
  },
  previewContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  imageWrapper: {
    width: '100%',
    height: '280px',
    backgroundColor: '#080D1B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    display: 'block',
  },
  metaBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.75rem',
    padding: '0.85rem 1.25rem',
    backgroundColor: '#10182A',
    borderTop: '1px solid #273449',
  },
  metaDetails: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  fileName: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#F1F5F9',
    maxWidth: '240px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  metaChip: {
    fontSize: '0.75rem',
    color: '#94A3B8',
    backgroundColor: '#151F32',
    border: '1px solid #273449',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
  },
  metaActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  actionBtnSmall: {
    backgroundColor: '#151F32',
    color: '#CBD5E1',
    border: '1px solid #273449',
    padding: '0.35rem 0.65rem',
    borderRadius: '6px',
    fontSize: '0.775rem',
    fontWeight: 600,
    transition: 'all 0.15s ease',
  },
  samplesShelf: {
    backgroundColor: 'rgba(16, 24, 42, 0.65)',
    border: '1px solid #273449',
    borderRadius: '10px',
    padding: '0.85rem 1rem',
  },
  samplesShelfTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#94A3B8',
    marginBottom: '0.65rem',
  },
  sampleChipsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  sampleChip: {
    backgroundColor: '#151F32',
    border: '1px solid #273449',
    borderRadius: '8px',
    padding: '0.35rem 0.75rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  sampleBadge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '0.15rem 0.45rem',
    borderRadius: '4px',
  },
  sampleChipName: {
    fontSize: '0.8rem',
    color: '#E2E8F0',
  },
  chipSpinner: {
    fontSize: '0.8rem',
    color: '#3B82F6',
  },
  actionRow: {
    display: 'flex',
    width: '100%',
  },
  analyzeBtn: {
    width: '100%',
    padding: '0.95rem 1.5rem',
    backgroundColor: '#3B82F6',
    backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: 700,
    boxShadow: '0 8px 20px rgba(59, 130, 246, 0.35)',
    transition: 'all 0.2s ease',
  },
  btnContent: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.6rem',
  },
  loadingBanner: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '10px',
    padding: '1rem 1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
  },
  loadingHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  loadingPulse: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#38BDF8',
    boxShadow: '0 0 10px #38BDF8',
  },
  loadingTitle: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#BAE6FD',
  },
  loadingSteps: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  stepItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    fontSize: '0.775rem',
    color: '#94A3B8',
  },
  stepDot: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: '#1E293B',
    color: '#38BDF8',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 700,
  },
  errorBanner: {
    backgroundColor: 'rgba(251, 113, 133, 0.1)',
    border: '1px solid rgba(251, 113, 133, 0.35)',
    borderRadius: '10px',
    padding: '0.85rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
  },
  errorIcon: {
    color: '#FB7185',
    flexShrink: 0,
  },
  errorContent: {
    flex: 1,
  },
  errorTitle: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#FECDD3',
    display: 'block',
  },
  errorMessage: {
    fontSize: '0.8rem',
    color: '#F43F5E',
    margin: '0.15rem 0 0 0',
  },
  retryBtn: {
    backgroundColor: '#FB7185',
    color: '#080D1B',
    border: 'none',
    padding: '0.4rem 0.85rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: 700,
  },
  statusBanner: {
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    border: '1px solid rgba(52, 211, 153, 0.25)',
    borderRadius: '8px',
    padding: '0.65rem 1rem',
    fontSize: '0.85rem',
    color: '#A7F3D0',
    textAlign: 'center',
  },
};
