// client/src/components/Footer.jsx — Global Application Footer
import React from 'react';

export function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: 'var(--space-8) var(--space-8)',
      marginTop: 'auto',
      background: 'rgba(8, 11, 22, 0.5)'
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        fontSize: '0.82rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--primary-light)', fontWeight: 700 }}>TasteTrail AI</span>
          <span>—</span>
          <span>Agentic Cultural Discovery & Personalization</span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'center' }}>
          <span>Grounded with <strong>Qloo API</strong></span>
          <span>•</span>
          <span>Deterministic Fallbacks</span>
          <span>•</span>
          <a 
            href="https://github.com/qloo" 
            target="_blank" 
            rel="noreferrer" 
            style={{ color: 'var(--text-secondary)' }}
          >
            Docs ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
