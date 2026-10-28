// client/src/components/TasteCard.jsx — Reusable Card for Recommendations and Slots
import React from 'react';
import { useTaste } from '../context/TasteContext.jsx';

export function TasteCard({ slot, onSelect }) {
  const { isSaved, toggleSaveItem } = useTaste();

  // Support both flat slot properties and nested recommendation object
  const rec = slot.recommendation || slot || {};
  const venueName = slot.venueName || rec.name || slot.name || 'Curated Cultural Stop';
  const saved = isSaved(venueName);
  
  // Format score: handle 0-1 float or 0-100 integer
  const rawScore = slot.affinityScore ?? rec.affinityScore ?? slot.score ?? rec.score ?? 0.88;
  const scorePercent = rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);

  const category = slot.category || rec.category || rec.subtype;
  const period = slot.period || slot.slotTime || rec.recommendedSlot;
  const time = slot.time || slot.slotTime;
  const activity = slot.activity || slot.slotLabel || rec.activity;
  const description = slot.description || rec.explanation || rec.description;
  const cost = slot.estimatedCost ?? rec.estimatedCost;
  const rationale = slot.whyItMatches || slot.culturalRationale || rec.evidenceSignal || rec.explanation;
  const entityUrn = slot.qlooEntityUrn || rec.entityId || rec.id || rec.urn;
  const limitations = slot.limitations || rec.limitations || 'Hours and reservations subject to venue policy; verify before visiting.';

  return (
    <div className="itinerary-slot card" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
        <div style={{ flex: 1 }}>
          {period && (
            <div className="slot-time">
              {period} {time && time !== period ? `• ${time}` : ''}
            </div>
          )}
          
          <h4 className="slot-name" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
            <span>{venueName}</span>
            {category && (
              <span className="tag" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                {category}
              </span>
            )}
          </h4>

          {activity && (
            <div className="slot-label" style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              {activity}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {cost !== undefined && (
            <span className="slot-cost" style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
              {typeof cost === 'number' ? `₹${cost.toLocaleString()}` : String(cost)}
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSaveItem({
                venueName,
                name: venueName,
                category,
                period,
                time,
                activity,
                description,
                estimatedCost: cost,
                affinityScore: rawScore,
                culturalRationale: rationale,
                qlooEntityUrn: entityUrn
              });
            }}
            className={`btn ${saved ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            title={saved ? 'Remove from Saved' : 'Save discovery'}
            style={{ padding: '5px 9px', fontSize: '0.82rem' }}
          >
            {saved ? '★ Saved' : '☆ Save'}
          </button>
        </div>
      </div>

      {description && (
        <p style={{ fontSize: '0.86rem', marginTop: 'var(--space-2)', marginBottom: 'var(--space-3)', lineHeight: 1.5 }}>
          {description}
        </p>
      )}

      {/* Cultural Affinity Score */}
      <div style={{ marginTop: 'var(--space-3)' }}>
        <div className="affinity-bar">
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Qloo Taste Affinity
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

      {/* Why This Matches Your Taste */}
      {rationale && (
        <div className="slot-evidence" style={{ marginTop: 'var(--space-3)' }}>
          <span style={{ fontSize: '0.9rem' }}>💡</span>
          <div style={{ fontSize: '0.78rem', lineHeight: 1.4 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Why this matches your taste: </strong>
            <span>{rationale}</span>
          </div>
        </div>
      )}

      {/* Provenance and Limitations Meta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap', gap: '6px' }}>
        {entityUrn && (
          <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            URN: {entityUrn}
          </div>
        )}
        <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          * {limitations}
        </div>
      </div>
    </div>
  );
}
