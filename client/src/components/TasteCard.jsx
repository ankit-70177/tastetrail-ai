// client/src/components/TasteCard.jsx — Reusable Card for Recommendations and Slots
import React from 'react';
import { useTaste } from '../context/TasteContext.jsx';

export function TasteCard({ slot, onSelect }) {
  const { isSaved, toggleSaveItem } = useTaste();

  const venueName = slot.venueName || slot.name || 'Curated Spot';
  const saved = isSaved(venueName);
  
  // Format score: handle 0-1 float or 0-100 integer
  const rawScore = slot.affinityScore ?? slot.score ?? 0.88;
  const scorePercent = rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);

  return (
    <div className="itinerary-slot card" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
        <div style={{ flex: 1 }}>
          {slot.period && (
            <div className="slot-time">
              {slot.period} {slot.time ? `• ${slot.time}` : ''}
            </div>
          )}
          
          <h4 className="slot-name" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>{venueName}</span>
            {slot.category && (
              <span className="tag" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                {slot.category}
              </span>
            )}
          </h4>

          {slot.activity && (
            <div className="slot-label" style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
              {slot.activity}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {slot.estimatedCost !== undefined && (
            <span className="slot-cost" style={{ fontSize: '0.85rem' }}>
              ₹{Number(slot.estimatedCost).toLocaleString()}
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSaveItem(slot);
            }}
            className={`btn ${saved ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            title={saved ? 'Remove from Saved' : 'Save discovery'}
            style={{ padding: '6px 10px', fontSize: '0.85rem' }}
          >
            {saved ? '★ Saved' : '☆ Save'}
          </button>
        </div>
      </div>

      {slot.description && (
        <p style={{ fontSize: '0.86rem', marginTop: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          {slot.description}
        </p>
      )}

      {/* Cultural Affinity Score */}
      <div style={{ marginTop: 'var(--space-3)' }}>
        <div className="affinity-bar">
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Taste Affinity
          </span>
          <div className="affinity-track">
            <div 
              className="affinity-fill" 
              style={{ width: `${Math.min(100, Math.max(10, scorePercent))}%` }}
            />
          </div>
          <span className="affinity-score">{scorePercent}%</span>
        </div>
      </div>

      {/* Grounded Cultural Rationale */}
      {slot.culturalRationale && (
        <div className="slot-evidence">
          <span>💡</span>
          <span>{slot.culturalRationale}</span>
        </div>
      )}

      {/* Qloo Entity Identifier */}
      {slot.qlooEntityUrn && (
        <div style={{ marginTop: '6px', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          Grounding: {slot.qlooEntityUrn}
        </div>
      )}
    </div>
  );
}
