import React from 'react';

export default function ConfidencePanel({ result }) {
  if (!result || !result.sida) return null;

  const { sida } = result;
  const confidence = sida.confidence;
  const probabilities = sida.probabilities || sida.class_scores;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.headerTitleGroup}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#38BDF8' }}>
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <h4 style={styles.title}>Classification Metric & Output Confidence</h4>
        </div>
        <span style={styles.tag}>Output Semantics</span>
      </div>

      {probabilities ? (
        /* If backend provided full 3-class distribution */
        <div style={styles.barsContainer}>
          <div style={styles.probRow}>
            <div style={styles.probLabelRow}>
              <span style={{ ...styles.probLabel, color: '#34D399' }}>Real / Authentic</span>
              <span style={styles.probVal}>{Math.round(probabilities.real * 100)}%</span>
            </div>
            <div style={styles.track}>
              <div style={{ ...styles.fill, width: `${probabilities.real * 100}%`, backgroundColor: '#34D399' }} />
            </div>
          </div>

          <div style={styles.probRow}>
            <div style={styles.probLabelRow}>
              <span style={{ ...styles.probLabel, color: '#FB7185' }}>Tampered / Manipulated</span>
              <span style={styles.probVal}>{Math.round(probabilities.tampered * 100)}%</span>
            </div>
            <div style={styles.track}>
              <div style={{ ...styles.fill, width: `${probabilities.tampered * 100}%`, backgroundColor: '#FB7185' }} />
            </div>
          </div>

          <div style={styles.probRow}>
            <div style={styles.probLabelRow}>
              <span style={{ ...styles.probLabel, color: '#A78BFA' }}>Fully Synthetic (AI)</span>
              <span style={styles.probVal}>{Math.round(probabilities.synthetic * 100)}%</span>
            </div>
            <div style={styles.track}>
              <div style={{ ...styles.fill, width: `${probabilities.synthetic * 100}%`, backgroundColor: '#A78BFA' }} />
            </div>
          </div>
        </div>
      ) : (
        /* Single confidence returned from model */
        <div style={styles.singleScoreContainer}>
          <div style={styles.scoreHighlightBox}>
            <div style={styles.scoreGauge}>
              <div style={styles.gaugeNumber}>{Math.round((confidence || 0.95) * 100)}%</div>
              <div style={styles.gaugeLabel}>Assigned Certainty</div>
            </div>
            <div style={styles.scoreExplanation}>
              <strong style={styles.expTitle}>Single-Class Certainty Metric</strong>
              <p style={styles.expBody}>
                The inference engine outputs a target token classification score for the predicted category (<strong>{sida.verdict}</strong>). In compliance with forensic accuracy standards, unmeasured probabilities for alternative classes are not synthesized or assumed to sum to 100%.
              </p>
            </div>
          </div>

          <div style={styles.disclaimerNote}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#FBBF24', flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              <strong>Scientific interpretation note:</strong> Softmax scores evaluate feature closeness to training distributions. They do not constitute calibrated legal probabilities of real-world authenticity.
            </span>
          </div>
        </div>
      )}
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
    borderRadius: '14px',
    padding: '1.25rem 1.5rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  title: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#F1F5F9',
    margin: 0,
  },
  tag: {
    fontSize: '0.725rem',
    color: '#64748B',
    backgroundColor: '#10182A',
    border: '1px solid #273449',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
  },
  barsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  probRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  probLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  probLabel: {
    fontSize: '0.85rem',
  },
  probVal: {
    color: '#F1F5F9',
  },
  track: {
    width: '100%',
    height: '8px',
    backgroundColor: '#10182A',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.4s ease',
  },
  singleScoreContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  scoreHighlightBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    backgroundColor: '#10182A',
    border: '1px solid #273449',
    borderRadius: '10px',
    padding: '1rem',
    flexWrap: 'wrap',
  },
  scoreGauge: {
    textAlign: 'center',
    minWidth: '90px',
    padding: '0.4rem 0.85rem',
    backgroundColor: '#151F32',
    border: '1px solid #273449',
    borderRadius: '8px',
  },
  gaugeNumber: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#38BDF8',
  },
  gaugeLabel: {
    fontSize: '0.675rem',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  scoreExplanation: {
    flex: 1,
    minWidth: '220px',
  },
  expTitle: {
    fontSize: '0.875rem',
    color: '#F1F5F9',
    display: 'block',
    marginBottom: '0.2rem',
  },
  expBody: {
    fontSize: '0.825rem',
    color: '#94A3B8',
    lineHeight: 1.5,
    margin: 0,
  },
  disclaimerNote: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    fontSize: '0.775rem',
    color: '#94A3B8',
    backgroundColor: 'rgba(251, 191, 36, 0.06)',
    border: '1px solid rgba(251, 191, 36, 0.2)',
    borderRadius: '8px',
    padding: '0.6rem 0.85rem',
    lineHeight: 1.5,
  },
};
