import React, { useState, useEffect } from 'react';

export default function ImageModal({
  isOpen,
  onClose,
  initialTitle,
  initialSrc,
  result,
}) {
  const [zoom, setZoom] = useState(1);
  const [currentTitle, setCurrentTitle] = useState(initialTitle);
  const [currentSrc, setCurrentSrc] = useState(initialSrc);

  useEffect(() => {
    setCurrentTitle(initialTitle);
    setCurrentSrc(initialSrc);
    setZoom(1);
  }, [initialTitle, initialSrc]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !currentSrc) return null;

  const originalSrc = result?.sida?.original_image;
  const maskSrc = result?.sida?.mask_image;
  const overlaySrc = result?.sida?.overlay_image;
  const elaSrc = result?.sida?.ela_image;

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={styles.modalHeader}>
          <div style={styles.titleInfo}>
            <h3 style={styles.modalTitle}>{currentTitle}</h3>
            <span style={styles.zoomBadge}>Zoom: {Math.round(zoom * 100)}%</span>
          </div>

          <div style={styles.modalControls}>
            {/* Zoom Controls */}
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              style={styles.iconBtn}
              title="Zoom Out"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              style={styles.iconBtn}
              title="Reset Zoom"
            >
              1:1
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              style={styles.iconBtn}
              title="Zoom In"
            >
              +
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              style={styles.closeBtn}
              title="Close modal (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer */}
        <div style={styles.viewer}>
          <div
            style={{
              ...styles.zoomWrapper,
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            <img
              src={currentSrc}
              alt={currentTitle}
              style={styles.modalImage}
            />
          </div>
        </div>

        {/* Modal Switcher Bar */}
        <div style={styles.modalFooter}>
          <div style={styles.switchTabs}>
            {originalSrc && (
              <button
                type="button"
                onClick={() => {
                  setCurrentTitle('Original Uploaded Image');
                  setCurrentSrc(originalSrc);
                }}
                style={{
                  ...styles.tabBtn,
                  backgroundColor: currentSrc === originalSrc ? '#2563EB' : '#10182A',
                  color: currentSrc === originalSrc ? '#FFFFFF' : '#94A3B8',
                }}
              >
                1. Original
              </button>
            )}
            {maskSrc && (
              <button
                type="button"
                onClick={() => {
                  setCurrentTitle('Tamper Mask (SAM ViT-H)');
                  setCurrentSrc(maskSrc);
                }}
                style={{
                  ...styles.tabBtn,
                  backgroundColor: currentSrc === maskSrc ? '#2563EB' : '#10182A',
                  color: currentSrc === maskSrc ? '#FFFFFF' : '#94A3B8',
                }}
              >
                2. Tamper Mask
              </button>
            )}
            {overlaySrc && (
              <button
                type="button"
                onClick={() => {
                  setCurrentTitle('Localization Overlay');
                  setCurrentSrc(overlaySrc);
                }}
                style={{
                  ...styles.tabBtn,
                  backgroundColor: currentSrc === overlaySrc ? '#2563EB' : '#10182A',
                  color: currentSrc === overlaySrc ? '#FFFFFF' : '#94A3B8',
                }}
              >
                3. Overlay
              </button>
            )}
            {elaSrc && (
              <button
                type="button"
                onClick={() => {
                  setCurrentTitle('Error Level Analysis (ELA)');
                  setCurrentSrc(elaSrc);
                }}
                style={{
                  ...styles.tabBtn,
                  backgroundColor: currentSrc === elaSrc ? '#2563EB' : '#10182A',
                  color: currentSrc === elaSrc ? '#FFFFFF' : '#94A3B8',
                }}
              >
                4. ELA Diff
              </button>
            )}
          </div>

          <a
            href={currentSrc}
            download={`sida_${currentTitle.toLowerCase().replace(/\s+/g, '_')}.png`}
            style={styles.downloadBtn}
          >
            Download Layer
          </a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 8, 18, 0.88)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '1.5rem',
  },
  modal: {
    width: '100%',
    maxWidth: '1100px',
    height: '85vh',
    backgroundColor: '#151F32',
    border: '1px solid #273449',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '0.85rem 1.25rem',
    backgroundColor: '#10182A',
    borderBottom: '1px solid #273449',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  modalTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#F8FAFC',
    margin: 0,
  },
  zoomBadge: {
    fontSize: '0.75rem',
    color: '#94A3B8',
    backgroundColor: '#151F32',
    border: '1px solid #273449',
    padding: '0.15rem 0.45rem',
    borderRadius: '4px',
  },
  modalControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
  },
  iconBtn: {
    width: '32px',
    height: '32px',
    backgroundColor: '#151F32',
    color: '#CBD5E1',
    border: '1px solid #273449',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    backgroundColor: 'rgba(251, 113, 133, 0.12)',
    color: '#FB7185',
    border: '1px solid rgba(251, 113, 133, 0.3)',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '0.5rem',
  },
  viewer: {
    flex: 1,
    backgroundColor: '#080D1B',
    overflow: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: '1rem',
  },
  zoomWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.15s ease',
  },
  modalImage: {
    maxWidth: '100%',
    maxHeight: '65vh',
    objectFit: 'contain',
    display: 'block',
  },
  modalFooter: {
    padding: '0.85rem 1.25rem',
    backgroundColor: '#10182A',
    borderTop: '1px solid #273449',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  switchTabs: {
    display: 'flex',
    gap: '0.45rem',
    flexWrap: 'wrap',
  },
  tabBtn: {
    padding: '0.35rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #273449',
    fontSize: '0.775rem',
    fontWeight: 600,
    transition: 'all 0.15s ease',
  },
  downloadBtn: {
    padding: '0.35rem 0.85rem',
    backgroundColor: '#151F32',
    color: '#38BDF8',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    borderRadius: '6px',
    fontSize: '0.775rem',
    fontWeight: 600,
    textDecoration: 'none',
  },
};
