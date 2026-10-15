import React from 'react';

export default function EvidenceSummary({ result }) {
  if (!result || !result.sida) return null;

  const { sida } = result;
  const hasMask = !!sida.mask_image;
  const hasOverlay = !!sida.overlay_image;
  const hasEla = !!sida.ela_image;
  const verdict = sida.verdict || 'Uncertain';

  // Dynamic summary text based on actual results
  let detectionStatement = '';
  let localizationStatement = '';
  let availableArtifacts = ['Original Image'];
  let unavailableMethods = [];

  if (verdict.toLowerCase().includes('real')) {
    detectionStatement = 'The classifier evaluated visual features and found characteristics consistent with authentic, unmanipulated camera photography.';
    localizationStatement = 'No localized manipulation mask was delineated, as the pipeline identified no discrete splicing or inpainting boundaries.';
  } else if (verdict.toLowerCase().includes('tamper')) {
    detectionStatement = 'The classifier detected indicators of localized digital editing, inpainting, or composite image splicing.';
    localizationStatement = hasMask
      ? 'A localized 2D segmentation mask and translucent overlay were generated to isolate suspicious boundary regions.'
      : 'Manipulation markers were detected in bitstream signatures, but no spatial SAM ViT-H pixel boundary mask was generated.';
  } else if (verdict.toLowerCase().includes('synthetic')) {
    detectionStatement = 'The classifier detected indicators of generative AI synthesis, including latent diffusion smoothing and rendering regularities.';
    localizationStatement = 'No localized tamper mask was delineated; generative synthesis patterns are distributed globally across the entire image.';
  } else {
    detectionStatement = 'The classifier output was inconclusive and did not meet high-certainty decision thresholds.';
    localizationStatement = 'Localization analysis remains unavailable pending further multi-modal review.';
  }

  if (hasMask) availableArtifacts.push('SAM ViT-H Tamper Mask');
  else unavailableMethods.push('Spatial Tamper Mask');

  if (hasOverlay) availableArtifacts.push('Projected Localization Overlay');
  else unavailableMethods.push('Localization Overlay Projection');

  if (hasEla) availableArtifacts.push('Differential Error Level Analysis (ELA)');
  else unavailableMethods.push('Server-side ELA Heatmap');

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#FBBF24' }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h4 style={styles.title}>Evidence Summary & Forensic Scope Limitations</h4>
        </div>
        <span style={styles.disclaimerBadge}>Probabilistic Indicator</span>
      </div>

      <div style={styles.contentGrid}>
        {/* Detection & Localization status */}
        <div style={styles.column}>
          <div style={styles.item}>
            <strong style={styles.itemTitle}>Primary Model Detection:</strong>
            <p style={styles.itemBody}>{detectionStatement}</p>
          </div>

          <div style={styles.item}>
            <strong style={styles.itemTitle}>Spatial Localization:</strong>
            <p style={styles.itemBody}>{localizationStatement}</p>
          </div>
        </div>

        {/* Artifacts and Unavailable Methods */}
        <div style={styles.column}>
          <div style={styles.item}>
            <strong style={styles.itemTitle}>Available Forensic Artifacts:</strong>
            <div style={styles.chipsWrap}>
              {availableArtifacts.map((art) => (
                <span key={art} style={styles.chipSuccess}>✓ {art}</span>
              ))}
            </div>
          </div>

          {unavailableMethods.length > 0 && (
            <div style={styles.item}>
              <strong style={styles.itemTitle}>Unavailable / Omitted In This Pass:</strong>
              <div style={styles.chipsWrap}>
                {unavailableMethods.map((un) => (
                  <span key={un} style={styles.chipMuted}>○ {un}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Scope Limitation Disclaimer */}
      <div style={styles.legalDisclaimerBox}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#FBBF24', flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p style={styles.disclaimerText}>
          <strong>What this analysis cannot establish:</strong> Neural network classifications and compression heuristics are assistive forensic screening tools, not standalone judicial proofs. High confidence scores reflect alignment with model training distributions and do not rule out unseen generative architectures, advanced anti-forensic attacks, or benign social-media recompression artifacts. Certified verification requires human expert verification, provenance chain-of-custody, and cryptographic validation.
        </p>
      </div>
    </div>
  );
}

const styles = {
  card: {
    width: '100%',
    maxWidth: '1240px',
    margin: '1.5rem auto 2.5rem auto',
    padding: '0 1rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#F1F5F9',
    margin: 0,
  },
  disclaimerBadge: {
    fontSize: '0.725rem',
    fontWeight: 600,
    color: '#FBBF24',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    padding: '0.2rem 0.55rem',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  contentGrid: {
    backgroundColor: '#151F32',
    border: '1px solid #273449',
    borderRadius: '12px 12px 0 0',
    padding: '1.25rem 1.5rem',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  itemTitle: {
    fontSize: '0.8rem',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  itemBody: {
    fontSize: '0.875rem',
    color: '#CBD5E1',
    lineHeight: 1.55,
    margin: 0,
  },
  chipsWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.45rem',
    marginTop: '0.25rem',
  },
  chipSuccess: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#34D399',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    border: '1px solid rgba(52, 211, 153, 0.25)',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
  },
  chipMuted: {
    fontSize: '0.75rem',
    color: '#64748B',
    backgroundColor: '#10182A',
    border: '1px solid #273449',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
  },
  legalDisclaimerBox: {
    backgroundColor: '#10182A',
    border: '1px solid #273449',
    borderTop: 'none',
    borderRadius: '0 0 12px 12px',
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  disclaimerText: {
    fontSize: '0.775rem',
    color: '#94A3B8',
    lineHeight: 1.6,
    margin: 0,
  },
};
