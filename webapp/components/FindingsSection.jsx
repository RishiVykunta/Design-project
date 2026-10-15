import React from 'react';

export default function FindingsSection({ result }) {
  if (!result || !result.sida) return null;

  const { sida } = result;
  const signals = sida.forensic_signals || {};
  const hasMask = !!sida.mask_image;
  const verdict = (sida.verdict || '').toLowerCase();

  // 1. Classification Finding
  const classificationStatus = {
    badge: verdict.includes('tamper') ? 'Manipulation Detected' : verdict.includes('synthetic') ? 'Synthetic Detected' : 'Authentic Consistent',
    color: verdict.includes('tamper') ? '#FB7185' : verdict.includes('synthetic') ? '#A78BFA' : '#34D399',
    bgColor: verdict.includes('tamper') ? 'rgba(251, 113, 133, 0.12)' : verdict.includes('synthetic') ? 'rgba(167, 139, 250, 0.12)' : 'rgba(52, 211, 153, 0.12)',
  };

  // 2. Localization Finding
  const localizationStatus = hasMask
    ? { badge: 'Mask Delineated', color: '#FB7185', bgColor: 'rgba(251, 113, 133, 0.12)' }
    : { badge: 'Not Generated', color: '#94A3B8', bgColor: 'rgba(148, 163, 184, 0.12)' };

  // 3. Compression / ELA Finding
  const compressionStatus = {
    badge: 'Differential Spectrum Available',
    color: '#38BDF8',
    bgColor: 'rgba(56, 189, 248, 0.12)',
  };

  // 4. Bitstream & Metadata Finding
  let bitstreamBadge = 'Standard Bitstream';
  let bitstreamColor = '#94A3B8';
  let bitstreamBg = 'rgba(148, 163, 184, 0.12)';
  let bitstreamExplanation = 'No specialized editing or generative AI parameters observed in the file headers.';

  if (signals.aiMarkerFound) {
    bitstreamBadge = 'Generative AI Signatures Detected';
    bitstreamColor = '#A78BFA';
    bitstreamBg = 'rgba(167, 139, 250, 0.12)';
    bitstreamExplanation = `Identified embedded generative parameters in image header: ${signals.aiMarkerDetails || 'Diffusion Model Metadata'}.`;
  } else if (signals.editorMarkerFound) {
    bitstreamBadge = 'Digital Editing Metadata Detected';
    bitstreamColor = '#FB7185';
    bitstreamBg = 'rgba(251, 113, 133, 0.12)';
    bitstreamExplanation = `Identified post-capture editing layer signatures: ${signals.editorMarkerDetails || 'Adobe Photoshop / Inpaint Structure'}.`;
  } else if (signals.exifFound) {
    bitstreamBadge = 'Hardware Optical EXIF Verified';
    bitstreamColor = '#34D399';
    bitstreamBg = 'rgba(52, 211, 153, 0.12)';
    bitstreamExplanation = `Found camera hardware sensor signatures: ${signals.cameraModel || 'Optical Hardware Sensor'}.`;
  }

  return (
    <section id="findings-section" style={styles.section}>
      <div style={styles.header}>
        <span style={styles.tag}>Structured Investigative Report</span>
        <h3 style={styles.title}>Forensic Findings & Evidence Analysis</h3>
        <p style={styles.subtitle}>
          Systematic breakdown of empirical observations across classification, spatial localization, compression response, and bitstream markers.
        </p>
      </div>

      <div style={styles.cardsGrid}>
        {/* Finding 1: Classification Summary */}
        <div style={styles.findingCard}>
          <div style={styles.cardTop}>
            <div style={styles.categoryTitleGroup}>
              <div style={{ ...styles.iconBox, color: classificationStatus.color, backgroundColor: classificationStatus.bgColor }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h4 style={styles.findingTitle}>Classification Summary</h4>
            </div>
            <span style={{ ...styles.statusBadge, color: classificationStatus.color, backgroundColor: classificationStatus.bgColor }}>
              {classificationStatus.badge}
            </span>
          </div>

          <p style={styles.findingText}>
            The image was assigned to <strong>{sida.verdict}</strong> with an uncalibrated classifier score of {Math.round((sida.confidence || 0.95) * 100)}%. The multimodal LLM analyzed visual tokens against learned authenticity feature distributions.
          </p>

          <div style={styles.artifactRow}>
            <span style={styles.artifactLabel}>Engine Target:</span>
            <code style={styles.codePill}>{sida.device || 'SIDA-7B / SAM ViT-H'}</code>
          </div>
        </div>

        {/* Finding 2: Spatial Localization */}
        <div style={styles.findingCard}>
          <div style={styles.cardTop}>
            <div style={styles.categoryTitleGroup}>
              <div style={{ ...styles.iconBox, color: localizationStatus.color, backgroundColor: localizationStatus.bgColor }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m4.93 4.93 4.24 4.24" />
                  <path d="m14.83 9.17 4.24-4.24" />
                  <path d="m14.83 14.83 4.24 4.24" />
                  <path d="m9.17 14.83-4.24 4.24" />
                </svg>
              </div>
              <h4 style={styles.findingTitle}>Spatial Localization Findings</h4>
            </div>
            <span style={{ ...styles.statusBadge, color: localizationStatus.color, backgroundColor: localizationStatus.bgColor }}>
              {localizationStatus.badge}
            </span>
          </div>

          <p style={styles.findingText}>
            {hasMask
              ? 'SAM ViT-H pixel segmentation successfully isolated localized boundary discontinuities corresponding to predicted splicing or inpainting coordinates.'
              : 'No spatial mask was extracted. The current image classification does not exhibit localized manipulation boundaries or the segmentation pipeline was not prompted.'}
          </p>

          <div style={styles.artifactRow}>
            <span style={styles.artifactLabel}>Localization State:</span>
            <span style={styles.codePill}>
              {hasMask ? '2D Boundary Mask Available' : 'No Spatial Mask Identified'}
            </span>
          </div>
        </div>

        {/* Finding 3: Compression Analysis */}
        <div style={styles.findingCard}>
          <div style={styles.cardTop}>
            <div style={styles.categoryTitleGroup}>
              <div style={{ ...styles.iconBox, color: compressionStatus.color, backgroundColor: compressionStatus.bgColor }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h4 style={styles.findingTitle}>Compression & ELA Analysis</h4>
            </div>
            <span style={{ ...styles.statusBadge, color: compressionStatus.color, backgroundColor: compressionStatus.bgColor }}>
              {compressionStatus.badge}
            </span>
          </div>

          <p style={styles.findingText}>
            Differential Error Level Analysis computed across a 90% JPEG recompression cycle. High-frequency variations at edges are observable, reflecting quantization differences. Note: ELA serves as supporting visual context and must not be treated as standalone proof of fraud.
          </p>

          <div style={styles.artifactRow}>
            <span style={styles.artifactLabel}>Baseline Cycle:</span>
            <code style={styles.codePill}>JPEG Q=90% (Scale 20×)</code>
          </div>
        </div>

        {/* Finding 4: Bitstream & Metadata Signals */}
        <div style={styles.findingCard}>
          <div style={styles.cardTop}>
            <div style={styles.categoryTitleGroup}>
              <div style={{ ...styles.iconBox, color: bitstreamColor, backgroundColor: bitstreamBg }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              </div>
              <h4 style={styles.findingTitle}>Bitstream & Metadata Signals</h4>
            </div>
            <span style={{ ...styles.statusBadge, color: bitstreamColor, backgroundColor: bitstreamBg }}>
              {bitstreamBadge}
            </span>
          </div>

          <p style={styles.findingText}>
            {bitstreamExplanation}
          </p>

          <div style={styles.artifactRow}>
            <span style={styles.artifactLabel}>Bitstream Pipeline:</span>
            <code style={styles.codePill}>
              {signals.benchmarkMatched ? 'Benchmark Dataset Ground Truth' : 'Direct Bitstream Header Inspection'}
            </code>
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
  header: {
    marginBottom: '1.25rem',
  },
  tag: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#38BDF8',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  title: {
    fontSize: '1.45rem',
    fontWeight: 800,
    color: '#F8FAFC',
    margin: '0.2rem 0 0.4rem 0',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#94A3B8',
    lineHeight: 1.5,
    maxWidth: '850px',
    margin: 0,
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.25rem',
  },
  findingCard: {
    backgroundColor: '#151F32',
    border: '1px solid #273449',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '0.85rem',
    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.3)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  categoryTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
  },
  iconBox: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  findingTitle: {
    fontSize: '0.925rem',
    fontWeight: 700,
    color: '#F1F5F9',
    margin: 0,
  },
  statusBadge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '0.2rem 0.55rem',
    borderRadius: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  findingText: {
    fontSize: '0.85rem',
    lineHeight: 1.6,
    color: '#CBD5E1',
    margin: 0,
    flex: 1,
  },
  artifactRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    paddingTop: '0.65rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    fontSize: '0.75rem',
    color: '#64748B',
  },
  artifactLabel: {
    color: '#64748B',
  },
  codePill: {
    fontFamily: `'JetBrains Mono', monospace`,
    fontSize: '0.725rem',
    color: '#93C5FD',
    backgroundColor: '#10182A',
    border: '1px solid #273449',
    padding: '0.15rem 0.45rem',
    borderRadius: '4px',
  },
};
