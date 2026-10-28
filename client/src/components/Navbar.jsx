// client/src/components/Navbar.jsx — Sidebar Navigation & Header Bar
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTaste } from '../context/TasteContext.jsx';

export function Navbar() {
  const { savedItems, systemStatus } = useTaste();

  const isLive = systemStatus.mode === 'live_qloo';

  return (
    <aside className="sidebar">
      <NavLink to="/" className="sidebar-logo">
        <div className="sidebar-logo-icon">✦</div>
        <div className="sidebar-logo-text">
          Taste<span>Trail</span>
        </div>
      </NavLink>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        
        <NavLink 
          to="/" 
          end
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <span className="nav-link-icon">✦</span>
          <span>Discover</span>
        </NavLink>

        <NavLink 
          to="/plan" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <span className="nav-link-icon">🗺️</span>
          <span>Plan Experience</span>
        </NavLink>

        <NavLink 
          to="/my-taste" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <span className="nav-link-icon">🧬</span>
          <span>My Taste</span>
        </NavLink>

        <NavLink 
          to="/saved" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <span className="nav-link-icon">🔖</span>
          <span>Saved</span>
          {savedItems.length > 0 && (
            <span 
              style={{
                marginLeft: 'auto',
                background: 'var(--primary)',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '1px 7px',
                borderRadius: '9999px'
              }}
            >
              {savedItems.length}
            </span>
          )}
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ENGINE STATUS</span>
            <span className={`badge ${isLive ? 'badge-live' : 'badge-demo'}`}>
              {isLive ? '● Live Qloo' : '● Demo Fixture'}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Powered by Qloo Cultural Intelligence Graph
          </div>
        </div>
      </div>
    </aside>
  );
}

export function Topbar({ title, subtitle }) {
  const { systemStatus } = useTaste();
  const isLive = systemStatus.mode === 'live_qloo';

  return (
    <header className="topbar">
      <div>
        <h2 className="topbar-title">{title || 'TasteTrail AI'}</h2>
        {subtitle && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="topbar-actions">
        <span className={`badge ${isLive ? 'badge-live' : 'badge-demo'}`}>
          {isLive ? 'Qloo API Connected' : 'Offline Mode (Deterministic)'}
        </span>
        <a 
          href="https://qloo.com" 
          target="_blank" 
          rel="noreferrer"
          className="btn btn-secondary btn-sm"
          style={{ textDecoration: 'none' }}
        >
          Qloo API ↗
        </a>
      </div>
    </header>
  );
}
