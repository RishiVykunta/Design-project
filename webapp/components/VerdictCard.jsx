import React from 'react';
import { getVerdictConfig, cleanModelExplanation } from '../utils/helpers';

export default function VerdictCard({ result }) {
  if (!result || !result.sida) return null;

  const { sida, blobUrl, filename } = result;
  const verdictConfig = getVerdictConfig(sida.verdict);
  const confidencePercent = sida.confidence ? Math.round(sida.confidence * 100) : null;
  const rawExplanation = cleanModelExplanation(sida.text_output);

  // Fallback timestamp
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div style={{ ...styles.card, borderColor: verdictConfig.borderColor }}>
      {/* Top Banner Row */}
      <div style={styles.topRow}>
        <div style={styles.verdictGroup}>
          <div style={{ ...styles.verdictIconBox, backgroundColor: verdictConfig.bgColor, borderColor: verdictConfig.borderColor, color: verdictConfig.accentColor }}>
            {verdictConfig.key === 'real' && (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            )}
            {verdictConfig.key === 'tampered' && (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            {verdictConfig.key === 'synthetic' && (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
            )}
            {verdictConfig.key === 'uncertain' && (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
          </div>

          <div>
            <div style={styles.verdictMetaLabel}>Authenticity Screening Verdict</div>
            <h2 style={{ ...styles.verdictTitle, color: verdictConfig.accentColor }}>
              {verdictConfig.title}
            </h2>
          </div>
        </div>

        {/* Confidence Metric Box */}
        {confidencePercent !== null && (
          <div style={styles.confidenceMetricBox}>
            <div style={styles.scoreRow}>
              <span style={styles.confidenceNumber}>{confidencePercent}%</span>
              <span style={{ ...styles.confidenceTag, color: verdictConfig.accentColor, backgroundColor: verdictConfig.bgColor, borderColor: verdictConfig.borderColor }}>
                Classifier Score
              </span>
            </div>
            <span style={styles.confidenceFootnote}>
              Uncalibrated Softmax Certainty
            </span>
          </div>
        )}
      </div>

      {/* Primary Evidence Explanation */}
      <div style={styles.explanationSection}>
        <div style={styles.explanationHeader}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#38BDF8' }}>
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span style={styles.explanationLabel}>Forensic Context & Reasoning</span>
        </div>
        <p style={styles.explanationText}>
          {rawExplanation || verdictConfig.description}
        </p>
      </div>

      {/* Metadata and Provenance Footer */}
      <div style={styles.footerRow}>
        <div style={styles.metaInfoGroup}>
          <div style={styles.metaItem}>
            <span style={styles.metaKey}>Engine:</span>
            <span style={styles.metaVal}>{sida.device || 'SIDA Multimodal Architecture (SAM ViT-H Localization)'}</span>
          </div>
          {sida.latency_sec && (
            <div style={styles.metaItem}>
              <span style={styles.metaKey}>Latency:</span>
              <span style={styles.metaVal}>{sida.latency_sec}s</span>
            </div>
          )}
          <div style={styles.metaItem}>
            <span style={styles.metaKey}>Timestamp:</span>
            <span style={styles.metaVal}>{timestamp}</span>
          </div>
        </div>

        {blobUrl && (
          <div style={styles.storageLinkBox}>
            <a
              href={blobUrl}
              target="_blank"
              rel="noreferrer"
              style={styles.storageLink}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>View Cloud File</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: {
    width: '100%',
    maxWidth: '1000px',
    margin: '1.25rem auto 0 auto',
    backgroundColor: '#151F32',
    border: '1px solid #273449',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  verdictGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  verdictIconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  verdictMetaLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#94A3B8',
  },
  verdictTitle: {
    fontSize: '1.45rem',
    fontWeight: 800,
    margin: '0.15rem 0 0 0',
    letterSpacing: '-0.01em',
  },
  confidenceMetricBox: {
    textAlign: 'right',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  confidenceNumber: {
    fontSize: '1.65rem',
    fontWeight: 800,
    color: '#F8FAFC',
    letterSpacing: '-0.02em',
  },
  confidenceTag: {
    fontSize: '0.725rem',
    fontWeight: 700,
    padding: '0.2rem 0.55rem',
    borderRadius: '6px',
    border: '1px solid',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  confidenceFootnote: {
    fontSize: '0.725rem',
    color: '#64748B',
    marginTop: '0.15rem',
  },
  explanationSection: {
    backgroundColor: '#10182A',
    border: '1px solid #273449',
    borderRadius: '10px',
    padding: '1rem 1.25rem',
  },
  explanationHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    marginBottom: '0.45rem',
  },
  explanationLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#38BDF8',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  explanationText: {
    fontSize: '0.925rem',
    lineHeight: 1.6,
    color: '#E2E8F0',
    margin: 0,
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.75rem',
    paddingTop: '0.5rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  },
  metaInfoGroup: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  metaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.775rem',
  },
  metaKey: {
    color: '#64748B',
  },
  metaVal: {
    color: '#CBD5E1',
    fontWeight: 500,
  },
  storageLinkBox: {
    display: 'flex',
    alignItems: 'center',
  },
  storageLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    padding: '0.35rem 0.65rem',
    borderRadius: '6px',
    transition: 'all 0.15s ease',
  },
};
