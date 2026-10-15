import React from 'react';

export default function Hero() {
  return (
    <section style={styles.hero}>
      <div style={styles.content}>
        <div style={styles.badgeRow}>
          <span style={styles.statusDot}></span>
          <span style={styles.badgeText}>Multimodal AI Forensic Inspection Platform</span>
        </div>
        
        <h2 style={styles.headline}>
          Tri-Category Image Authenticity & Pixel Localization
        </h2>
        
        <p style={styles.subtext}>
          Evaluates digital imagery across <strong>Likely Authentic</strong>, <strong>Suspected Manipulation (Splicing/Inpainting)</strong>, and <strong>Fully Synthetic AI Generation</strong>. Integrates SAM ViT-H pixel delineation, differential Error Level Analysis (ELA), and bitstream metadata verification.
        </p>

        {/* Quick capability chips */}
        <div style={styles.chipsRow}>
          <div style={styles.chip}>
            <span style={{ color: '#34D399', fontWeight: 700 }}>●</span>
            <span>Real / Authentic Camera Media</span>
          </div>
          <div style={styles.chip}>
            <span style={{ color: '#FB7185', fontWeight: 700 }}>●</span>
            <span>Tampered Splicing with SAM ViT-H Localization</span>
          </div>
          <div style={styles.chip}>
            <span style={{ color: '#A78BFA', fontWeight: 700 }}>●</span>
            <span>Diffusion & GAN Generative Synthesis</span>
          </div>
          <div style={styles.chip}>
            <span style={{ color: '#38BDF8', fontWeight: 700 }}>●</span>
            <span>Differential Error Level Analysis (ELA)</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const styles = {
  hero: {
    maxWidth: '1000px',
    margin: '1.25rem auto 1.5rem auto',
    textAlign: 'center',
    padding: '0 1rem',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  badgeRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#10182A',
    border: '1px solid #273449',
    padding: '0.3rem 0.85rem',
    borderRadius: '9999px',
    marginBottom: '0.85rem',
  },
  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#34D399',
    boxShadow: '0 0 8px #34D399',
  },
  badgeText: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#94A3B8',
    letterSpacing: '0.02em',
  },
  headline: {
    fontSize: '1.95rem',
    fontWeight: 800,
    letterSpacing: '-0.025em',
    color: '#F8FAFC',
    margin: '0 0 0.65rem 0',
    lineHeight: 1.25,
  },
  subtext: {
    fontSize: '0.975rem',
    color: '#94A3B8',
    maxWidth: '780px',
    lineHeight: 1.6,
    margin: '0 0 1.25rem 0',
  },
  chipsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    justifyContent: 'center',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    backgroundColor: '#151F32',
    border: '1px solid #273449',
    padding: '0.35rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.775rem',
    color: '#CBD5E1',
  },
};
