import React, { useEffect } from 'react';

export default function MethodologyModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTitleGroup}>
            <div style={styles.iconCircle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#38BDF8' }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div>
              <h3 style={styles.title}>Forensic Methodology, Pipeline & Limitations</h3>
              <span style={styles.subtitle}>Scientific context and architectural scope</span>
            </div>
          </div>

          <button type="button" onClick={onClose} style={styles.closeBtn}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={styles.body}>
          {/* Section 1: Overview */}
          <div style={styles.sectionBlock}>
            <h4 style={styles.sectionHeading}>1. Tri-Category Forensic Classification</h4>
            <p style={styles.paragraph}>
              The SIDA platform is designed to categorize digital imagery into three discrete classes:
            </p>
            <ul style={styles.bulletList}>
              <li>
                <strong>Likely Authentic:</strong> Images consistent with unmanipulated camera hardware captures, characterized by continuous sensor noise (Bayer filter response) and coherent illumination physics.
              </li>
              <li>
                <strong>Suspected Manipulation (Tampered):</strong> Images containing localized splicing, copy-move cloning, or deep inpainting where specific subregions have been altered post-capture.
              </li>
              <li>
                <strong>Fully Synthetic (AI-Generated):</strong> Images created entirely by generative latent diffusion or GAN architectures, exhibiting global smoothing and latent manifold regularity.
              </li>
            </ul>
          </div>

          {/* Section 2: Accurate Role of SAM ViT-H */}
          <div style={styles.sectionBlock}>
            <h4 style={styles.sectionHeading}>2. SAM ViT-H Segmentation Role (Accurate Characterization)</h4>
            <div style={styles.callout}>
              <strong style={{ color: '#F1F5F9' }}>Crucial Architectural Clarification:</strong>
              <p style={{ margin: '0.35rem 0 0 0', color: '#CBD5E1', fontSize: '0.85rem' }}>
                Segment Anything Model (SAM ViT-H) <em>does not independently detect image manipulation or deepfakes</em>. SAM is a promptable visual segmentation foundation model.
              </p>
            </div>
            <p style={styles.paragraph}>
              In the SIDA architecture, the multimodal Large Language Model evaluates visual tokens through its CLIP vision encoder to predict whether an image is tampered. When tampering is detected, the model outputs special <code>[SEG]</code> embeddings that prompt SAM ViT-H&apos;s mask decoder to delineate the spatial pixel boundary of the suspect region. SAM provides the spatial boundary delineation; the multimodal model supplies the tampering classification.
            </p>
          </div>

          {/* Section 3: Error Level Analysis */}
          <div style={styles.sectionBlock}>
            <h4 style={styles.sectionHeading}>3. Error Level Analysis (ELA) Scientific Principles</h4>
            <p style={styles.paragraph}>
              Error Level Analysis (ELA) operates by storing an image at a known uniform JPEG compression level (typically 90%) and evaluating the absolute mathematical difference between the original and recompressed pixel values.
            </p>
            <ul style={styles.bulletList}>
              <li>
                In authentic JPEG images, areas of similar texture should exhibit roughly uniform error levels across compression cycles.
              </li>
              <li>
                Spliced elements inserted from a different source or saved at a different compression level often display pronounced differential error levels along boundary contours.
              </li>
              <li>
                <strong>Important Caveat:</strong> High-frequency textures, natural edges, saturated surfaces, and successive re-saves on social media platforms naturally generate compression variance. ELA alone cannot prove fraud and must be evaluated alongside contextual evidence.
              </li>
            </ul>
          </div>

          {/* Section 4: Forensic Scope & Limitations */}
          <div style={styles.sectionBlock}>
            <h4 style={styles.sectionHeading}>4. Evaluation Boundaries & Disclaimers</h4>
            <p style={styles.paragraph}>
              Model confidence scores reflect softmax certainty on benchmark training distributions and should not be misconstrued as legal proofs of fact. This application is a research-grade forensic inspection tool intended to assist analysts, not to serve as an autonomous arbiter of authenticity.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button type="button" onClick={onClose} style={styles.primaryBtn}>
            Understood & Return to Inspection
          </button>
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
    backgroundColor: 'rgba(5, 8, 18, 0.85)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 110,
    padding: '1.5rem',
  },
  modal: {
    width: '100%',
    maxWidth: '780px',
    maxHeight: '85vh',
    backgroundColor: '#151F32',
    border: '1px solid #273449',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
    overflow: 'hidden',
  },
  header: {
    padding: '1rem 1.5rem',
    backgroundColor: '#10182A',
    borderBottom: '1px solid #273449',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  iconCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#F8FAFC',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.75rem',
    color: '#94A3B8',
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    backgroundColor: '#151F32',
    color: '#94A3B8',
    border: '1px solid #273449',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: 700,
  },
  body: {
    padding: '1.5rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  sectionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  sectionHeading: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#38BDF8',
    margin: 0,
  },
  paragraph: {
    fontSize: '0.875rem',
    lineHeight: 1.6,
    color: '#CBD5E1',
    margin: 0,
  },
  bulletList: {
    paddingLeft: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
    fontSize: '0.85rem',
    color: '#CBD5E1',
    lineHeight: 1.55,
  },
  callout: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderLeft: '3px solid #3B82F6',
    padding: '0.75rem 1rem',
    borderRadius: '0 8px 8px 0',
  },
  footer: {
    padding: '1rem 1.5rem',
    backgroundColor: '#10182A',
    borderTop: '1px solid #273449',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  primaryBtn: {
    padding: '0.55rem 1.25rem',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
};
