// client/src/pages/PlanExperience.jsx — Experience Planner & Conversational Refinement
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api.js';
import { useTaste } from '../context/TasteContext.jsx';
import { Topbar } from '../components/Navbar.jsx';
import { TasteCard } from '../components/TasteCard.jsx';
import { ComparisonModal } from '../components/ComparisonModal.jsx';

const ATMOSPHERES = [
  'Artistic & Relaxed',
  'Vibrant & Bohemian',
  'Cozy & Intellectual',
  'Late Night & Electric',
  'Minimalist & Heritage'
];

const POPULAR_INTERESTS = [
  'indie music',
  'Korean food',
  'specialty coffee',
  'contemporary art',
  'craft cocktails',
  'vinyl records',
  'independent bookstores',
  'sourdough bakeries'
];

export function PlanExperience() {
  const location = useLocation();
  const { activePlan, setActivePlan, showToast } = useTaste();

  // Form State
  const [prompt, setPrompt] = useState('');
  const [destination, setDestination] = useState('Delhi');
  const [budget, setBudget] = useState(5000);
  const [duration, setDuration] = useState('Weekend (2 Days)');
  const [atmosphere, setAtmosphere] = useState(ATMOSPHERES[0]);
  const [interests, setInterests] = useState(['indie music', 'Korean food', 'art', 'cafes']);
  
  // Custom tag input
  const [customInterest, setCustomInterest] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refinementText, setRefinementText] = useState('');
  const [error, setError] = useState(null);

  // Comparison modal state
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [comparisonBaseline, setComparisonBaseline] = useState(null);

  // If navigated from Discover with a preset, load it automatically
  useEffect(() => {
    if (location.state?.preset) {
      const p = location.state.preset;
      setDestination(p.destination);
      setBudget(p.budget);
      setAtmosphere(p.atmosphere);
      setDuration(p.duration);
      setInterests(p.interests);
      setPrompt(`${p.duration} in ${p.destination} focusing on ${p.interests.join(', ')} under ₹${p.budget.toLocaleString()}`);
      
      // Auto-trigger plan generation for seamless 1-click experience
      handleGenerate({
        destination: p.destination,
        budget: p.budget,
        atmosphere: p.atmosphere,
        duration: p.duration,
        interests: p.interests
      });
    }
  }, [location.state]);

  async function handleGenerate(overridePayload = null) {
    setIsLoading(true);
    setError(null);
    try {
      const payload = overridePayload || {
        prompt: prompt.trim() || undefined,
        destination,
        budget: Number(budget),
        duration,
        atmosphere,
        interests
      };

      const res = await api.createPlan(payload);
      if (res.success && res.plan) {
        setActivePlan(res.plan);
        setComparisonBaseline(res.plan.genericBaseline);
        showToast('Personalized cultural plan generated!', 'success');
      } else {
        throw new Error(res.error || 'Failed to generate itinerary');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during plan generation.');
      showToast(err.message || 'Plan generation failed', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefine(instruction) {
    if (!activePlan) return;
    setIsRefining(true);
    setError(null);
    try {
      const res = await api.refinePlan(activePlan, instruction);
      if (res.success && res.plan) {
        setActivePlan(res.plan);
        setRefinementText('');
        showToast(`Plan refined: "${instruction}"`, 'success');
      } else {
        throw new Error(res.error || 'Refinement failed');
      }
    } catch (err) {
      setError(err.message || 'Refinement failed');
      showToast(err.message || 'Refinement failed', 'error');
    } finally {
      setIsRefining(false);
    }
  }

  function toggleInterest(item) {
    setInterests(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  }

  function addCustomInterest(e) {
    e.preventDefault();
    const clean = customInterest.trim();
    if (clean && !interests.includes(clean)) {
      setInterests(prev => [...prev, clean]);
      setCustomInterest('');
    }
  }

  const budgetBreakdown = activePlan?.budgetAnalysis;
  const isOverBudget = budgetBreakdown && !budgetBreakdown.isWithinBudget;

  return (
    <div>
      <Topbar 
        title="Plan an Experience" 
        subtitle="Cultural discovery engine with explainable Qloo grounding"
      />

      <div className="page-container">
        {/* Creator Panel */}
        <section className="card card-elevated" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
            <div>
              <span className="badge badge-info" style={{ marginBottom: '4px' }}>Itinerary Architect</span>
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Define Your Experience</h2>
            </div>
            {activePlan && (
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => setIsCompareOpen(true)}
              >
                ⚖️ Compare with Baseline
              </button>
            )}
          </div>

          {/* Natural Language Prompt */}
          <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
            <label className="form-label">Natural Language Prompt (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 2 days in Delhi exploring indie rock, Korean food, and art galleries under ₹5,000"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Structured Parameters */}
          <div className="grid-3" style={{ marginBottom: 'var(--space-5)' }}>
            <div className="form-group">
              <label className="form-label">Destination</label>
              <input 
                type="text" 
                className="form-input" 
                value={destination} 
                onChange={(e) => setDestination(e.target.value)} 
                placeholder="City name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Total Budget (INR)</label>
              <input 
                type="number" 
                className="form-input" 
                value={budget} 
                onChange={(e) => setBudget(Number(e.target.value))} 
                step="500" 
                min="1000"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Atmosphere & Vibe</label>
              <select 
                className="form-select" 
                value={atmosphere} 
                onChange={(e) => setAtmosphere(e.target.value)}
              >
                {ATMOSPHERES.map((atm) => (
                  <option key={atm} value={atm}>{atm}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Interests & Passions Selector */}
          <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
            <label className="form-label">Passions & Interests (Qloo Seeds)</label>
            <div className="tag-list" style={{ marginBottom: 'var(--space-3)' }}>
              {POPULAR_INTERESTS.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => toggleInterest(item)}
                  className={`tag ${interests.includes(item) ? 'selected' : ''}`}
                >
                  {interests.includes(item) ? '✓ ' : '+ '}
                  {item}
                </button>
              ))}
            </div>

            {/* Custom Tag Input */}
            <form onSubmit={addCustomInterest} style={{ display: 'flex', gap: 'var(--space-2)', maxWidth: '400px' }}>
              <input 
                type="text"
                className="form-input"
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                placeholder="Add custom interest (e.g. ramen, synthwave)"
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary btn-sm" disabled={!customInterest.trim()}>
                Add Tag
              </button>
            </form>
          </div>

          <button 
            type="button" 
            onClick={() => handleGenerate()} 
            className="btn btn-primary btn-lg" 
            disabled={isLoading || interests.length === 0}
            style={{ width: '100%' }}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner" />
                <span>Consulting Qloo Cultural Graph...</span>
              </>
            ) : (
              '✦ Generate Grounded Experience Plan'
            )}
          </button>
        </section>

        {/* Error message */}
        {error && (
          <div className="error-message" style={{ marginBottom: 'var(--space-6)' }}>
            <span className="error-message-icon">⚠️</span>
            <div style={{ flex: 1 }}>
              <strong>Planning Error: </strong>
              <span>{error}</span>
            </div>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              onClick={() => handleGenerate()}
            >
              Retry
            </button>
          </div>
        )}

        {/* Generated Plan View */}
        {activePlan && (
          <div className="animate-fade-up">
            {/* Plan Header Card */}
            <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                    <span className="badge badge-live">
                      {activePlan.sourceMode === 'live_qloo' ? '✦ Live Qloo' : '✦ Demo Fixture'}
                    </span>
                    <span className="badge badge-info">{activePlan.atmosphere}</span>
                  </div>
                  <h2 style={{ margin: '4px 0', fontSize: '1.6rem' }}>
                    {activePlan.destination} Cultural Trail
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    Curated across {activePlan.selectedInterests?.join(', ')}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setIsCompareOpen(true)}
                  >
                    ⚖️ Compare Baseline
                  </button>
                </div>
              </div>

              {/* Budget Meter */}
              {budgetBreakdown && (
                <div style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                    <span>
                      Estimated Cost: <strong>₹{budgetBreakdown.totalEstimatedCost.toLocaleString()}</strong> of ₹{budgetBreakdown.allocatedBudget.toLocaleString()}
                    </span>
                    <span style={{ color: isOverBudget ? 'var(--error)' : 'var(--success)', fontWeight: 600 }}>
                      {isOverBudget ? `Over by ₹${Math.abs(budgetBreakdown.remainingBudget).toLocaleString()}` : `₹${budgetBreakdown.remainingBudget.toLocaleString()} remaining`}
                    </span>
                  </div>

                  <div className="budget-track">
                    <div 
                      className={`budget-fill ${isOverBudget ? 'budget-over' : 'budget-ok'}`}
                      style={{ 
                        width: `${Math.min(100, (budgetBreakdown.totalEstimatedCost / budgetBreakdown.allocatedBudget) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Daily Itinerary Slots */}
            {activePlan.itinerary && activePlan.itinerary.map((dayPlan, dayIdx) => (
              <div key={dayIdx} className="itinerary-day">
                <div className="itinerary-day-header">
                  <span className="day-badge">{dayPlan.day || `Day ${dayIdx + 1}`}</span>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{dayPlan.title || 'Curated Exploration'}</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {dayPlan.slots && dayPlan.slots.map((slot, slotIdx) => (
                    <TasteCard key={slotIdx} slot={slot} />
                  ))}
                </div>
              </div>
            ))}

            {/* Conversational Refinement Controls */}
            <div className="card card-elevated" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>💬</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Refine This Experience</h3>
              </div>
              <p style={{ fontSize: '0.85rem', marginBottom: 'var(--space-4)' }}>
                Ask the agent to modify the plan dynamically based on your budget, pacing, or cultural taste shifts.
              </p>

              {/* Quick refinement action chips */}
              <div className="tag-list" style={{ marginBottom: 'var(--space-4)' }}>
                <button
                  type="button"
                  className="tag"
                  disabled={isRefining}
                  onClick={() => handleRefine('Make it cheaper and find free public art')}
                >
                  💸 Make it cheaper
                </button>
                <button
                  type="button"
                  className="tag"
                  disabled={isRefining}
                  onClick={() => handleRefine('Add more contemporary art galleries and indie design')}
                >
                  🎨 More art & indie culture
                </button>
                <button
                  type="button"
                  className="tag"
                  disabled={isRefining}
                  onClick={() => handleRefine('Skip food, focus heavily on specialty coffee and nightlife')}
                >
                  ☕ Focus on coffee & nightlife
                </button>
                <button
                  type="button"
                  className="tag"
                  disabled={isRefining}
                  onClick={() => handleRefine('Make the pacing more relaxed and walkable')}
                >
                  🌿 More relaxed & walkable
                </button>
              </div>

              {/* Custom refinement input */}
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <input
                  type="text"
                  className="refinement-input"
                  placeholder="e.g. Swap dinner for late-night jazz speakeasy"
                  value={refinementText}
                  onChange={(e) => setRefinementText(e.target.value)}
                  disabled={isRefining}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && refinementText.trim()) {
                      handleRefine(refinementText.trim());
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isRefining || !refinementText.trim()}
                  onClick={() => handleRefine(refinementText.trim())}
                >
                  {isRefining ? <span className="loading-spinner" /> : 'Refine ➜'}
                </button>
              </div>
            </div>

            {/* Personalization Evidence & Grounding Strip */}
            {activePlan.personalizationEvidence && activePlan.personalizationEvidence.length > 0 && (
              <div className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-8)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
                  <span className="badge badge-live">Verified Grounding</span>
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Personalization Evidence Strip</h4>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                  Recommendations are directly linked to the following resolved Qloo entity seeds:
                </div>
                <div className="grid-auto">
                  {activePlan.personalizationEvidence.map((ev, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        background: 'var(--bg-elevated)', 
                        padding: 'var(--space-3)', 
                        borderRadius: 'var(--radius-md)', 
                        border: '1px solid var(--border)' 
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ev.term}</div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary-light)' }}>
                        {ev.name}
                      </div>
                      <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                        {ev.entityId}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transparency Panel */}
            {activePlan.transparency && (
              <details className="transparency-panel" style={{ marginBottom: 'var(--space-8)' }}>
                <summary>
                  System Transparency & Audit Details ({activePlan.transparency.mode})
                </summary>
                
                <div className="transparency-grid">
                  <div className="transparency-stat">
                    <div className="transparency-stat-value">{activePlan.transparency.durationMs}ms</div>
                    <div className="transparency-stat-label">Execution Time</div>
                  </div>
                  <div className="transparency-stat">
                    <div className="transparency-stat-value">{activePlan.transparency.qlooCalls}</div>
                    <div className="transparency-stat-label">Qloo API Calls</div>
                  </div>
                  <div className="transparency-stat">
                    <div className="transparency-stat-value">{activePlan.transparency.resolvedCount}</div>
                    <div className="transparency-stat-label">Entities Resolved</div>
                  </div>
                </div>

                {activePlan.transparency.operations && activePlan.transparency.operations.length > 0 && (
                  <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Agentic Pipeline Execution Trace:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {activePlan.transparency.operations.map((op, idx) => (
                        <li key={idx} style={{ fontFamily: 'monospace', marginBottom: '3px' }}>{op}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ marginTop: 'var(--space-4)', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {activePlan.transparency.disclaimer}
                </div>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      <ComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        qlooPlan={activePlan}
        genericBaseline={comparisonBaseline}
      />
    </div>
  );
}
