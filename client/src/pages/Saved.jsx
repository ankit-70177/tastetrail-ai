// client/src/pages/Saved.jsx — Saved Cultural Discoveries Drawer
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaste } from '../context/TasteContext.jsx';
import { Topbar } from '../components/Navbar.jsx';
import { TasteCard } from '../components/TasteCard.jsx';

export function Saved() {
  const navigate = useNavigate();
  const { savedItems, clearSaved, showToast } = useTaste();
  const [filterCategory, setFilterCategory] = useState('All');

  // Filter items
  const filtered = filterCategory === 'All'
    ? savedItems
    : savedItems.filter(item => {
        const cat = (item.category || '').toLowerCase();
        return cat.includes(filterCategory.toLowerCase());
      });

  function exportSavedJSON() {
    if (savedItems.length === 0) return;
    const blob = new Blob([JSON.stringify(savedItems, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tastetrail-saved-discoveries-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported saved discoveries as JSON', 'success');
  }

  return (
    <div>
      <Topbar 
        title="Saved Discoveries" 
        subtitle="Your bookmarked cultural spots and affinity recommendations"
      />

      <div className="page-container">
        {/* Header Action Bar */}
        <section className="card card-elevated" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div>
              <span className="badge badge-info" style={{ marginBottom: '6px' }}>Curated Collection</span>
              <h2 style={{ fontSize: '1.4rem', margin: '4px 0' }}>
                {savedItems.length} Bookmarked {savedItems.length === 1 ? 'Discovery' : 'Discoveries'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Places and experiences saved across your planning journeys.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={exportSavedJSON}
                disabled={savedItems.length === 0}
              >
                📥 Export JSON
              </button>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm"
                onClick={clearSaved}
                disabled={savedItems.length === 0}
                style={{ color: 'var(--error)' }}
              >
                Clear All
              </button>
            </div>
          </div>
        </section>

        {/* Filter Chips */}
        {savedItems.length > 0 && (
          <div className="tag-list" style={{ marginBottom: 'var(--space-6)' }}>
            {['All', 'Food', 'Art', 'Coffee', 'Music', 'Nightlife'].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`tag ${filterCategory === cat ? 'selected' : ''}`}
                onClick={() => setFilterCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {savedItems.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">🔖</div>
            <h3 style={{ margin: '8px 0 4px' }}>No Saved Discoveries Yet</h3>
            <p style={{ maxWidth: '420px', fontSize: '0.88rem' }}>
              Whenever you generate a cultural itinerary or explore Qloo recommendations, click the <strong>☆ Save</strong> button to bookmark venues here.
            </p>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => navigate('/plan')}
              style={{ marginTop: 'var(--space-2)' }}
            >
              Plan Your First Experience ➜
            </button>
          </div>
        ) : (
          /* Cards Grid */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {filtered.map((item, idx) => (
              <TasteCard key={idx} slot={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
