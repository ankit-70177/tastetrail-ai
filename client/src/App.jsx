// client/src/App.jsx — Main Application Root & Router Shell
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { TasteProvider, useTaste } from './context/TasteContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Footer } from './components/Footer.jsx';
import { Discover } from './pages/Discover.jsx';
import { PlanExperience } from './pages/PlanExperience.jsx';
import { MyTaste } from './pages/MyTaste.jsx';
import { Saved } from './pages/Saved.jsx';

function ToastBanner() {
  const { toast } = useTaste();
  if (!toast) return null;

  const bg = toast.type === 'success' 
    ? 'rgba(16, 185, 129, 0.95)' 
    : toast.type === 'error' 
    ? 'rgba(239, 68, 68, 0.95)' 
    : 'rgba(99, 102, 241, 0.95)';

  return (
    <div 
      className="animate-fade-in"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: bg,
        color: '#fff',
        padding: '10px 18px',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.88rem',
        fontWeight: 600,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚠️' : 'ℹ️'}</span>
      <span>{toast.message}</span>
    </div>
  );
}

function MainLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-content">
        <main style={{ flex: 1, minHeight: 'calc(100vh - 80px)' }}>
          <Routes>
            <Route path="/" element={<Discover />} />
            <Route path="/plan" element={<PlanExperience />} />
            <Route path="/my-taste" element={<MyTaste />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <ToastBanner />
    </div>
  );
}

export default function App() {
  return (
    <TasteProvider>
      <MainLayout />
    </TasteProvider>
  );
}
