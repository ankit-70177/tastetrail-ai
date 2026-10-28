// client/src/pages/Discover.jsx — Landing and Discovery Dashboard
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useTaste } from '../context/TasteContext.jsx';
import { Topbar } from '../components/Navbar.jsx';

const CURATED_PRESETS = [
  {
    id: 'delhi-indie',
    title: 'Delhi Indie Art & Korean Food Weekend',
    description: 'An intimate 2-day cultural trail through Hauz Khas Village and Shahpur Jat pairing indie rock venues with authentic Korean street food.',
    destination: 'Delhi',
    budget: 5000,
    atmosphere: 'Artistic & Relaxed',
    duration: 'Weekend (2 Days)',
    interests: ['indie music', 'Korean food', 'contemporary art', 'specialty cafes'],
    badge: 'Popular Preset',
    icon: '🎨'
  },
  {
    id: 'mumbai-vinyl',
    title: 'Mumbai Vinyl Records & Artisanal Cocktails',
    description: 'Explore Bandra and Fort heritage architecture, vintage record hunts, craft speakeasies, and coastal indie listening rooms.',
    destination: 'Mumbai',
    budget: 8000,
    atmosphere: 'Vibrant & Bohemian',
    duration: 'Weekend (2 Days)',
    interests: ['vinyl records', 'jazz music', 'cocktail lounges', 'heritage walks'],
    badge: 'Nightlife & Music',
    icon: '🎷'
  },
  {
    id: 'bangalore-coffee',
    title: 'Bangalore Specialty Coffee & Bookstores',
    description: 'Indirangar and Church Street micro-roasteries, quiet independent literature nooks, and craft microbreweries.',
    destination: 'Bangalore',
    budget: 4000,
    atmosphere: 'Cozy & Intellectual',
    duration: 'Weekend (2 Days)',
    interests: ['specialty coffee', 'bookstores', 'microbreweries', 'live acoustics'],
    badge: 'Weekend Chill',
    icon: '☕'
  }
];

export function Discover() {
  const navigate = useNavigate();
  const { toggleSaveItem, isSaved, updateProfile, showToast } = useTaste();

  // Qloo Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Live Qloo entity search
  async function handleSearch(e) {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const data = await api.searchQloo(query);
      setSearchResults(data.results || []);
    } catch (err) {
      setSearchError(err.message || 'Entity search failed');
    } finally {
      setIsSearching(false);
    }
  }

  function launchPreset(preset) {
    navigate('/plan', { state: { preset } });
  }

  return (
    <div>
      <Topbar 
        title="Discover Cultural Experiences" 
        subtitle="Grounded in Qloo's Cultural Intelligence Graph"
      />

      <div className="page-container">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-eyebrow">
            <span>✦</span>
            <span>Qloo Agentic Hackathon Deliverable</span>
          </div>

          <h1 className="hero-headline">
            Discover What You’ll <span className="gradient-text">Actually Love</span>
          </h1>

          <p className="hero-sub">
            Escape generic tourist popularity lists. TasteTrail AI maps your nuanced passions in music, cuisine, and aesthetics into personalized cultural itineraries backed by mathematical entity affinity.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              className="btn btn-primary btn-lg"
              onClick={() => launchPreset(CURATED_PRESETS[0])}
            >
              Plan with Delhi Preset ➜
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/plan')}
            >
              Custom Experience Builder
            </button>
          </div>
        </section>

        {/* 1-Click Preset Itineraries */}
        <section style={{ marginBottom: 'var(--space-12)' }}>
          <div className="section-header">
            <h2>Instant 1-Click Experiences</h2>
            <p>Try verified test itineraries grounded with authentic Qloo cultural affinity scores.</p>
          </div>

          <div className="grid-3 stagger">
            {CURATED_PRESETS.map((preset) => (
              <div 
                key={preset.id}
                className="prompt-card"
                onClick={() => launchPreset(preset)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') launchPreset(preset); }}
              >
                <div className="prompt-card-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{preset.icon}</span>
                    <span className="badge badge-info">{preset.badge}</span>
                  </div>

                  <h3 className="prompt-card-title">{preset.title}</h3>
                  <p className="prompt-card-text">{preset.description}</p>

                  <div className="prompt-card-meta">
                    <span>📍 {preset.destination}</span>
                    <span>•</span>
                    <span>₹{preset.budget.toLocaleString()} Budget</span>
                  </div>

                  <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="tag-list" style={{ gap: '4px' }}>
                      {preset.interests.slice(0, 2).map((item, i) => (
                        <span key={i} className="tag" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                          {item}
                        </span>
                      ))}
                    </div>
                    <span style={{ fontSize: '0.82rem', color: 'var(--primary-light)', fontWeight: 600 }}>
                      Try Now ➜
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live Qloo Entity Search Explorer */}
        <section style={{ marginBottom: 'var(--space-12)' }}>
          <div className="card card-elevated" style={{ padding: 'var(--space-8)' }}>
            <div style={{ maxWidth: '640px', marginBottom: 'var(--space-6)' }}>
              <span className="badge badge-live" style={{ marginBottom: '8px' }}>
                Interactive Entity Resolution
              </span>
              <h2>Qloo Knowledge Graph Explorer</h2>
              <p>
                Search real cultural entities (artists, cuisines, books, venues) to inspect their structured URN identifiers and affinity vectors.
              </p>
            </div>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-3)', maxWidth: '640px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search an artist, cuisine, or vibe (e.g. Peter Cat Recording Co., Korean BBQ)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? <span className="loading-spinner" /> : 'Search Qloo'}
              </button>
            </form>

            {searchError && (
              <div className="error-message" style={{ marginTop: 'var(--space-4)' }}>
                <span className="error-message-icon">⚠️</span>
                <span>{searchError}</span>
              </div>
            )}

            {/* Results Grid */}
            {searchResults.length > 0 && (
              <div style={{ marginTop: 'var(--space-6)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                  Found {searchResults.length} entities in Qloo Cultural Graph:
                </div>

                <div className="grid-auto">
                  {searchResults.map((entity, idx) => (
                    <div 
                      key={idx}
                      className="card" 
                      style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                            {entity.type?.split(':').pop() || 'Entity'}
                          </span>
                          {entity.popularity && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Pop: {Math.round(entity.popularity * 100)}%
                            </span>
                          )}
                        </div>

                        <h4 style={{ margin: '8px 0 4px', fontSize: '0.98rem' }}>{entity.name}</h4>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {entity.id || entity.urn}
                        </div>
                      </div>

                      <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ width: '100%', fontSize: '0.78rem' }}
                          onClick={() => {
                            updateProfile({
                              seedEntities: [{ name: entity.name, type: entity.type || 'urn:entity:custom' }]
                            });
                            showToast(`Added "${entity.name}" to your Taste Profile`, 'success');
                          }}
                        >
                          + Add to My Taste
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Why Qloo Section */}
        <section style={{ marginBottom: 'var(--space-12)' }}>
          <div className="section-header">
            <h2>Why Cultural Intelligence Matters</h2>
            <p>Traditional recommendation engines optimize for mass crowds. Qloo optimizes for authentic human taste.</p>
          </div>

          <div className="grid-3">
            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>🎯</div>
              <h3>Cross-Domain Correlations</h3>
              <p style={{ fontSize: '0.88rem', marginTop: 'var(--space-2)' }}>
                Qloo discovers non-obvious affinities. Your love for indie dream pop predicts your preferences in natural wine bars, brutalist gallery spaces, and cozy artisanal cafes.
              </p>
            </div>

            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>🛡️</div>
              <h3>Anti-Tourist Trap Heuristic</h3>
              <p style={{ fontSize: '0.88rem', marginTop: 'var(--space-2)' }}>
                Traditional algorithms send everyone to the same crowded commercial monuments. TasteTrail filters out tourist traps to prioritize authentic local cultural hotspots.
              </p>
            </div>

            <div className="card" style={{ padding: 'var(--space-6)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>🔍</div>
              <h3>Mathematical Traceability</h3>
              <p style={{ fontSize: '0.88rem', marginTop: 'var(--space-2)' }}>
                No black-box hallucinated recommendations. Every single stop on your itinerary is grounded in verifiable entity identifiers and cultural affinity scores.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
