import React from 'react';

export default function Header({ onOpenMethodology, onScrollToSection }) {
  return (
    <header style={styles.header}>
      <div style={styles.container}>
        {/* Branding & Logo */}
        <div style={styles.brandGroup}>
          <div style={styles.logoIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#38BDF8' }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div>
            <div style={styles.titleRow}>
              <h1 style={styles.title}>SIDA Image Deepfake Forensic Suite</h1>
              <span style={styles.prototypeBadge}>Research Prototype</span>
            </div>
            <p style={styles.tagline}>
              Image authenticity analysis, manipulation localization, and forensic evidence
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav style={styles.nav}>
          <button
            onClick={() => onScrollToSection('upload-section')}
            style={styles.navLink}
            type="button"
          >
            Overview
          </button>
          <button
            onClick={() => onScrollToSection('forensic-grid')}
            style={styles.navLink}
            type="button"
          >
            Forensic Panels
          </button>
          <button
            onClick={() => onScrollToSection('findings-section')}
            style={styles.navLink}
            type="button"
          >
            Findings
          </button>
          <button
            onClick={onOpenMethodology}
            style={styles.navBtnSecondary}
            type="button"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Methodology & Limitations
          </button>
        </nav>
      </div>
    </header>
  );
}

const styles = {
  header: {
    width: '100%',
    backgroundColor: 'rgba(8, 13, 27, 0.88)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid #273449',
    position: 'sticky',
    top: 0,
    zIndex: 40,
    transition: 'all 0.2s ease',
  },
  container: {
    maxWidth: '1240px',
    margin: '0 auto',
    padding: '0.85rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
  },
  logoIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    border: '1px solid rgba(59, 130, 246, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '1.15rem',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    color: '#F1F5F9',
    margin: 0,
  },
  prototypeBadge: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#93C5FD',
    backgroundColor: 'rgba(59, 130, 246, 0.16)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    padding: '0.15rem 0.55rem',
    borderRadius: '9999px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  tagline: {
    fontSize: '0.8rem',
    color: '#94A3B8',
    margin: '0.1rem 0 0 0',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  navLink: {
    background: 'none',
    color: '#94A3B8',
    fontSize: '0.875rem',
    fontWeight: 500,
    padding: '0.45rem 0.75rem',
    borderRadius: '6px',
    transition: 'all 0.15s ease',
  },
  navBtnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#151F32',
    color: '#E2E8F0',
    border: '1px solid #273449',
    padding: '0.45rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.825rem',
    fontWeight: 600,
    transition: 'all 0.15s ease',
  },
};
