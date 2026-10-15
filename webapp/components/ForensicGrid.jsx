import React, { useState, useEffect } from 'react';
import { computeClientELA, calculateMaskCoverage } from '../utils/ela';

export default function ForensicGrid({ result, onInspectImage }) {
  if (!result || !result.sida) return null;

  const { sida, filename } = result;
  const originalSrc = sida.original_image;
  const maskSrc = sida.mask_image;
  const backendOverlaySrc = sida.overlay_image;
  const backendElaSrc = sida.ela_image;

  // Mask coverage calculation
  const [maskCoverage, setMaskCoverage] = useState(null);

  // Overlay state
  const [overlayOpacity, setOverlayOpacity] = useState(75);
  const [overlayMode, setOverlayMode] = useState('blend'); // 'blend' | 'side-by-side'

  // ELA state
  const [elaQuality, setElaQuality] = useState(90);
  const [elaScale, setElaScale] = useState(20);
  const [activeElaSrc, setActiveElaSrc] = useState(backendElaSrc);
  const [isComputingEla, setIsComputingEla] = useState(false);
  const [elaCompareMode, setElaCompareMode] = useState('ela'); // 'ela' | 'compare'

  // Calculate mask pixel coverage if mask exists
  useEffect(() => {
    if (maskSrc) {
      calculateMaskCoverage(maskSrc).then((cov) => setMaskCoverage(cov));
    } else {
      setMaskCoverage(null);
    }
  }, [maskSrc]);

  // Update or compute ELA when sliders change or when new image loaded
  useEffect(() => {
    // If backend already provided ELA and settings are default, keep backend ELA
    if (backendElaSrc && elaQuality === 90 && elaScale === 20) {
      setActiveElaSrc(backendElaSrc);
      return;
    }

    if (!originalSrc) return;

    let isMounted = true;
    setIsComputingEla(true);

    const timeout = setTimeout(() => {
      computeClientELA(originalSrc, elaQuality / 100, elaScale).then((res) => {
        if (isMounted) {
          if (res) setActiveElaSrc(res);
          setIsComputingEla(false);
        }
      });
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [originalSrc, backendElaSrc, elaQuality, elaScale]);

  return (
    <section id="forensic-grid" style={styles.section}>
      <div style={styles.sectionHeader}>
        <div>
          <span style={styles.sectionTag}>Multi-Modal Computer Vision Verification</span>
          <h3 style={styles.sectionTitle}>Localization & Forensic Analysis</h3>
          <p style={styles.sectionSubtitle}>
            Quad-panel forensic inspection examining original input, SAM ViT-H pixel segmentation, spatial overlay, and differential Error Level Analysis (ELA).
          </p>
        </div>
      </div>

      <div style={styles.grid}>
        {/* ================= PANEL 1: ORIGINAL ================= */}
        <div style={styles.panelCard}>
          <div style={styles.panelHeader}>
            <div style={styles.panelTitleGroup}>
              <span style={styles.panelNumber}>1</span>
              <div>
                <h4 style={styles.panelTitle}>Original Uploaded Image</h4>
                <span style={styles.panelSub}>Source input photograph</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onInspectImage({ title: 'Original Uploaded Image', src: originalSrc })}
              style={styles.expandBtn}
              title="Fullscreen Inspection"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          </div>

          <div style={styles.viewerContainer}>
            <img
              src={originalSrc}
              alt="Original Uploaded Source"
              style={styles.imageCanvas}
            />
          </div>

          <div style={styles.panelFooter}>
            <div style={styles.footerInfoRow}>
              <span style={styles.infoPill}>Aspect Ratio Preserved</span>
              <span style={styles.infoPill}>{filename || 'Source Image'}</span>
            </div>
            <p style={styles.panelDescription}>
              Unmodified source pixels used as reference baseline for all spatial localization and compression analysis.
            </p>
          </div>
        </div>

        {/* ================= PANEL 2: TAMPER MASK ================= */}
        <div style={styles.panelCard}>
          <div style={styles.panelHeader}>
            <div style={styles.panelTitleGroup}>
              <span style={{ ...styles.panelNumber, borderColor: '#8B5CF6', color: '#A78BFA' }}>2</span>
              <div>
                <h4 style={styles.panelTitle}>Tamper Mask (SAM ViT-H Segmentation)</h4>
                <span style={styles.panelSub}>Spatial pixel delineation</span>
              </div>
            </div>
            {maskSrc && (
              <button
                type="button"
                onClick={() => onInspectImage({ title: 'Tamper Mask (SAM ViT-H)', src: maskSrc })}
                style={styles.expandBtn}
                title="Fullscreen Inspection"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </button>
            )}
          </div>

          <div style={styles.viewerContainer}>
            {maskSrc ? (
              <img
                src={maskSrc}
                alt="Tamper Mask"
                style={styles.imageCanvas}
              />
            ) : (
              <div style={styles.emptyMaskState}>
                <div style={styles.emptyIconCircle}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#64748B' }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                  </svg>
                </div>
                <strong style={styles.emptyTitle}>No Localized Mask Generated</strong>
                <p style={styles.emptyText}>
                  {sida.verdict?.toLowerCase().includes('real')
                    ? 'The image is classified as authentic; no localized boundary anomalies warrant spatial mask extraction.'
                    : sida.verdict?.toLowerCase().includes('synthetic')
                    ? 'Generative AI synthesis features operate globally across latent representations rather than localized splicing.'
                    : 'The current inference pass did not produce a discrete spatial segmentation boundary.'}
                </p>
              </div>
            )}
          </div>

          <div style={styles.panelFooter}>
            {maskSrc ? (
              <>
                <div style={styles.footerInfoRow}>
                  {maskCoverage !== null && (
                    <span style={{ ...styles.infoPill, color: '#FB7185', backgroundColor: 'rgba(251, 113, 133, 0.12)', borderColor: 'rgba(251, 113, 133, 0.3)' }}>
                      Coverage: {maskCoverage}% of total pixels
                    </span>
                  )}
                  <span style={styles.infoPill}>White: Segmented Anomaly</span>
                  <span style={styles.infoPill}>Black: Background</span>
                </div>
                <p style={styles.panelDescription}>
                  Delineated by the SAM ViT-H segmentation head prompted by multimodal cross-attention. Identifies spatial focus of predicted anomalies.
                </p>
              </>
            ) : (
              <div style={styles.disclaimerPill}>
                <span>Notice: Absence of a localization mask does not automatically verify authenticity.</span>
              </div>
            )}
          </div>
        </div>

        {/* ================= PANEL 3: LOCALIZATION OVERLAY ================= */}
        <div style={styles.panelCard}>
          <div style={styles.panelHeader}>
            <div style={styles.panelTitleGroup}>
              <span style={{ ...styles.panelNumber, borderColor: '#FB7185', color: '#FB7185' }}>3</span>
              <div>
                <h4 style={styles.panelTitle}>Localization Overlay (Red Highlight)</h4>
                <span style={styles.panelSub}>Projected suspicious boundaries</span>
              </div>
            </div>
            {maskSrc && (
              <button
                type="button"
                onClick={() => onInspectImage({ title: 'Localization Overlay', src: backendOverlaySrc || originalSrc })}
                style={styles.expandBtn}
                title="Fullscreen Inspection"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </button>
            )}
          </div>

          <div style={styles.viewerContainer}>
            {maskSrc ? (
              overlayMode === 'side-by-side' ? (
                <div style={styles.sideBySideRow}>
                  <div style={styles.sideCol}>
                    <img src={originalSrc} alt="Original" style={styles.sideImg} />
                    <span style={styles.sideLabel}>Original</span>
                  </div>
                  <div style={styles.sideCol}>
                    <img src={backendOverlaySrc || originalSrc} alt="Overlay" style={styles.sideImg} />
                    <span style={styles.sideLabel}>Overlay</span>
                  </div>
                </div>
              ) : (
                <div style={styles.overlayStack}>
                  <img
                    src={originalSrc}
                    alt="Base Original"
                    style={styles.imageCanvas}
                  />
                  {/* Layered mask highlight */}
                  <img
                    src={backendOverlaySrc || maskSrc}
                    alt="Overlay Layer"
                    style={{
                      ...styles.overlayTopLayer,
                      opacity: overlayOpacity / 100,
                      filter: !backendOverlaySrc ? 'drop-shadow(0 0 8px rgba(251, 113, 133, 0.9))' : 'none',
                    }}
                  />
                </div>
              )
            ) : (
              <div style={styles.emptyMaskState}>
                <div style={styles.emptyIconCircle}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#64748B' }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <strong style={styles.emptyTitle}>Overlay Unavailable</strong>
                <p style={styles.emptyText}>
                  A spatial tamper mask is required to project localized overlay highlights. No synthetic mask is fabricated.
                </p>
              </div>
            )}
          </div>

          <div style={styles.panelFooter}>
            {maskSrc ? (
              <>
                <div style={styles.controlsRow}>
                  <div style={styles.sliderGroup}>
                    <label style={styles.sliderLabel}>
                      <span>Overlay Opacity:</span>
                      <strong style={{ color: '#FB7185' }}>{overlayOpacity}%</strong>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={overlayOpacity}
                      onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                    />
                  </div>

                  <div style={styles.modeToggleGroup}>
                    <button
                      type="button"
                      onClick={() => setOverlayMode('blend')}
                      style={{
                        ...styles.toggleBtn,
                        backgroundColor: overlayMode === 'blend' ? '#2563EB' : '#151F32',
                        color: overlayMode === 'blend' ? '#FFFFFF' : '#94A3B8',
                      }}
                    >
                      Blend
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverlayMode('side-by-side')}
                      style={{
                        ...styles.toggleBtn,
                        backgroundColor: overlayMode === 'side-by-side' ? '#2563EB' : '#151F32',
                        color: overlayMode === 'side-by-side' ? '#FFFFFF' : '#94A3B8',
                      }}
                    >
                      Split View
                    </button>
                  </div>
                </div>
                <p style={styles.panelDescription}>
                  Translucent coral overlay projects the predicted tampering coordinates onto the original photograph.
                </p>
              </>
            ) : (
              <div style={styles.disclaimerPill}>
                <span>Overlay projection activates automatically when a spatial mask is generated.</span>
              </div>
            )}
          </div>
        </div>

        {/* ================= PANEL 4: ERROR LEVEL ANALYSIS (ELA) ================= */}
        <div style={styles.panelCard}>
          <div style={styles.panelHeader}>
            <div style={styles.panelTitleGroup}>
              <span style={{ ...styles.panelNumber, borderColor: '#38BDF8', color: '#38BDF8' }}>4</span>
              <div>
                <h4 style={styles.panelTitle}>Error Level Analysis (ELA Heatmap)</h4>
                <span style={styles.panelSub}>Compression difference spectrum</span>
              </div>
            </div>
            {activeElaSrc && (
              <button
                type="button"
                onClick={() => onInspectImage({ title: 'Error Level Analysis (ELA)', src: activeElaSrc })}
                style={styles.expandBtn}
                title="Fullscreen Inspection"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </button>
            )}
          </div>

          <div style={styles.viewerContainer}>
            {activeElaSrc ? (
              elaCompareMode === 'compare' ? (
                <div style={styles.sideBySideRow}>
                  <div style={styles.sideCol}>
                    <img src={originalSrc} alt="Original" style={styles.sideImg} />
                    <span style={styles.sideLabel}>Original</span>
                  </div>
                  <div style={styles.sideCol}>
                    <img src={activeElaSrc} alt="ELA Diff" style={styles.sideImg} />
                    <span style={styles.sideLabel}>ELA Heatmap</span>
                  </div>
                </div>
              ) : (
                <img
                  src={activeElaSrc}
                  alt="Error Level Analysis Heatmap"
                  style={styles.imageCanvas}
                />
              )
            ) : (
              <div style={styles.emptyMaskState}>
                <strong style={styles.emptyTitle}>Computing ELA Compression...</strong>
              </div>
            )}
          </div>

          <div style={styles.panelFooter}>
            <div style={styles.controlsRow}>
              <div style={styles.sliderGroup}>
                <label style={styles.sliderLabel}>
                  <span>JPEG Quality (Q):</span>
                  <strong style={{ color: '#38BDF8' }}>{elaQuality}%</strong>
                </label>
                <input
                  type="range"
                  min="60"
                  max="98"
                  value={elaQuality}
                  onChange={(e) => setElaQuality(Number(e.target.value))}
                />
              </div>

              <div style={styles.sliderGroup}>
                <label style={styles.sliderLabel}>
                  <span>Scale Factor:</span>
                  <strong style={{ color: '#38BDF8' }}>{elaScale}×</strong>
                </label>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={elaScale}
                  onChange={(e) => setElaScale(Number(e.target.value))}
                />
              </div>

              <div style={styles.modeToggleGroup}>
                <button
                  type="button"
                  onClick={() => setElaCompareMode('ela')}
                  style={{
                    ...styles.toggleBtn,
                    backgroundColor: elaCompareMode === 'ela' ? '#2563EB' : '#151F32',
                    color: elaCompareMode === 'ela' ? '#FFFFFF' : '#94A3B8',
                  }}
                >
                  ELA View
                </button>
                <button
                  type="button"
                  onClick={() => setElaCompareMode('compare')}
                  style={{
                    ...styles.toggleBtn,
                    backgroundColor: elaCompareMode === 'compare' ? '#2563EB' : '#151F32',
                    color: elaCompareMode === 'compare' ? '#FFFFFF' : '#94A3B8',
                  }}
                >
                  Compare
                </button>
              </div>
            </div>

            {/* Color Legend */}
            <div style={styles.legendBar}>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#000000', border: '1px solid #334155' }}></span>
                <span>Dark / Low Error: Consistent compression level</span>
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#F59E0B' }}></span>
                <span>Bright / High Error: Compression boundary or sharp edge</span>
              </div>
            </div>

            <p style={styles.panelDescription}>
              ELA visualizes differences between an image and a recompressed version. Local variations may help identify suspicious regions, but compression artifacts, texture, edges, and repeated JPEG saves can also produce differences. ELA alone cannot establish authenticity. Non-JPEG files (PNG, WebP) undergo standardized 90% recompression baseline cycles.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const styles = {
  section: {
    width: '100%',
    maxWidth: '1240px',
    margin: '2rem auto',
    padding: '0 1rem',
  },
  sectionHeader: {
    marginBottom: '1.25rem',
  },
  sectionTag: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#38BDF8',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  sectionTitle: {
    fontSize: '1.45rem',
    fontWeight: 800,
    color: '#F8FAFC',
    margin: '0.2rem 0 0.4rem 0',
  },
  sectionSubtitle: {
    fontSize: '0.875rem',
    color: '#94A3B8',
    lineHeight: 1.5,
    maxWidth: '850px',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
  panelCard: {
    backgroundColor: '#151F32',
    border: '1px solid #273449',
    borderRadius: '14px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
    transition: 'border-color 0.2s ease',
  },
  panelHeader: {
    padding: '0.85rem 1.15rem',
    backgroundColor: '#10182A',
    borderBottom: '1px solid #273449',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  panelNumber: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '1px solid #3B82F6',
    color: '#38BDF8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  panelTitle: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#F1F5F9',
    margin: 0,
  },
  panelSub: {
    fontSize: '0.725rem',
    color: '#64748B',
  },
  expandBtn: {
    backgroundColor: '#151F32',
    color: '#94A3B8',
    border: '1px solid #273449',
    borderRadius: '6px',
    padding: '0.35rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
  viewerContainer: {
    width: '100%',
    height: '280px',
    backgroundColor: '#080D1B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  imageCanvas: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    display: 'block',
  },
  overlayStack: {
    width: '100%',
    height: '100%',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayTopLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    pointerEvents: 'none',
    transition: 'opacity 0.1s ease',
  },
  sideBySideRow: {
    width: '100%',
    height: '100%',
    display: 'flex',
    gap: '4px',
    padding: '4px',
  },
  sideCol: {
    flex: 1,
    height: '100%',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050811',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  sideImg: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  sideLabel: {
    position: 'absolute',
    bottom: '6px',
    left: '6px',
    fontSize: '0.675rem',
    fontWeight: 700,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    color: '#F1F5F9',
    padding: '0.15rem 0.45rem',
    borderRadius: '4px',
  },
  emptyMaskState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '1.5rem',
  },
  emptyIconCircle: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    backgroundColor: '#10182A',
    border: '1px solid #273449',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.65rem',
  },
  emptyTitle: {
    fontSize: '0.875rem',
    color: '#CBD5E1',
    marginBottom: '0.35rem',
  },
  emptyText: {
    fontSize: '0.775rem',
    color: '#64748B',
    lineHeight: 1.5,
    maxWidth: '280px',
    margin: 0,
  },
  panelFooter: {
    padding: '1rem 1.15rem',
    backgroundColor: '#151F32',
    borderTop: '1px solid #273449',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
  },
  footerInfoRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.45rem',
  },
  infoPill: {
    fontSize: '0.725rem',
    fontWeight: 600,
    color: '#94A3B8',
    backgroundColor: '#10182A',
    border: '1px solid #273449',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
  },
  controlsRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.55rem',
  },
  sliderGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  sliderLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: '#94A3B8',
  },
  modeToggleGroup: {
    display: 'flex',
    gap: '0.35rem',
    marginTop: '0.2rem',
  },
  toggleBtn: {
    flex: 1,
    padding: '0.3rem 0.6rem',
    border: '1px solid #273449',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  legendBar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    backgroundColor: '#10182A',
    border: '1px solid #273449',
    borderRadius: '6px',
    padding: '0.5rem 0.65rem',
  },
  legendItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    fontSize: '0.725rem',
    color: '#94A3B8',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  panelDescription: {
    fontSize: '0.75rem',
    color: '#64748B',
    lineHeight: 1.5,
    margin: 0,
  },
  disclaimerPill: {
    fontSize: '0.725rem',
    color: '#64748B',
    fontStyle: 'italic',
  },
};
