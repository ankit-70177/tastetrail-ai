// client/src/pages/MyTaste.jsx — Cultural Taste Profile Editor
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaste } from '../context/TasteContext.jsx';
import { Topbar } from '../components/Navbar.jsx';

const PRESET_ARCHETYPES = [
  {
    name: 'The Audiophile Flâneur',
    atmosphere: 'Artistic & Relaxed',
    music: ['Indie Rock', 'Dream Pop', 'Lo-Fi Jazz', 'Post-Punk'],
    food: ['Specialty Coffee', 'Natural Wine Bars', 'Artisanal Sourdough'],
    culture: ['Vinyl Record Shops', 'Independent Bookstores', 'Analog Photography']
  },
  {
    name: 'The Craft Culinary Explorer',
    atmosphere: 'Vibrant & Bohemian',
    music: ['Soul & Funk', 'Bossa Nova', 'Afrobeats'],
    food: ['Korean Street Food', 'Regional Micro-Bakeries', 'Craft Ramen', 'Farm-to-Table'],
    culture: ['Culinary Markets', 'Night Bazaars', 'Pottery Studios']
  },
  {
    name: 'The Minimalist Design Hunter',
    atmosphere: 'Cozy & Intellectual',
    music: ['Ambient Modern Classic', 'Minimal Techno', 'Cinematic Soundscapes'],
    food: ['Matcha Cafes', 'Nordic Brunch', 'Single-Origin Tea Rooms'],
    culture: ['Modern Architecture', 'Contemporary Art Galleries', 'Design Boutiques']
  }
];

export function MyTaste() {
  const navigate = useNavigate();
  const { tasteProfile, updateProfile, showToast } = useTaste();

  const [musicInput, setMusicInput] = useState('');
  const [foodInput, setFoodInput] = useState('');
  const [cultureInput, setCultureInput] = useState('');

  function handleAddTag(category, value, setter) {
    const clean = value.trim();
    if (!clean) return;
    const currentList = tasteProfile[category] || [];
    if (!currentList.includes(clean)) {
      updateProfile({ [category]: [...currentList, clean] });
      setter('');
    }
  }

  function handleRemoveTag(category, item) {
    const currentList = tasteProfile[category] || [];
    updateProfile({ [category]: currentList.filter(i => i !== item) });
  }

  function applyArchetype(arch) {
    updateProfile({
      atmosphere: arch.atmosphere,
      music: arch.music,
      food: arch.food,
      culture: arch.culture
    });
    showToast(`Applied archetype: "${arch.name}"`, 'success');
  }

  function planWithProfile() {
    const allInterests = [
      ...(tasteProfile.music || []).slice(0, 2),
      ...(tasteProfile.food || []).slice(0, 2),
      ...(tasteProfile.culture || []).slice(0, 2)
    ];

    navigate('/plan', {
      state: {
        preset: {
          destination: 'Delhi',
          budget: 6000,
          atmosphere: tasteProfile.atmosphere || 'Artistic & Relaxed',
          duration: 'Weekend (2 Days)',
          interests: allInterests
        }
      }
    });
  }

  return (
    <div>
      <Topbar 
        title="My Cultural Taste Genome" 
        subtitle="Configure your persistent cultural affinities across music, food, and aesthetics"
      />

      <div className="page-container">
        {/* Header Action Card */}
        <section className="card card-elevated" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div>
              <span className="badge badge-live" style={{ marginBottom: '6px' }}>Persistent Taste Profile</span>
              <h2 style={{ fontSize: '1.4rem', margin: '4px 0' }}>Your Personal Affinity Vectors</h2>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                TasteTrail AI uses these cultural affinities as anchor seeds for Qloo's entity recommendation engine.
              </p>
            </div>

            <button 
              type="button" 
              className="btn btn-primary"
              onClick={planWithProfile}
            >
              Plan Experience Using My Profile ➜
            </button>
          </div>
        </section>

        {/* Quick Archetype Presets */}
        <section style={{ marginBottom: 'var(--space-8)' }}>
          <div className="section-header">
            <h2>Taste Archetypes</h2>
            <p>One-click pre-configurations matching distinct cultural lifestyles.</p>
          </div>

          <div className="grid-3">
            {PRESET_ARCHETYPES.map((arch, idx) => (
              <div 
                key={idx} 
                className="card" 
                style={{ padding: 'var(--space-5)', cursor: 'pointer', transition: 'all var(--transition-normal)' }}
                onClick={() => applyArchetype(arch)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.02rem' }}>{arch.name}</h4>
                  <span className="badge badge-info">{arch.atmosphere.split(' ')[0]}</span>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                  {arch.music.slice(0, 2).join(', ')} • {arch.food.slice(0, 2).join(', ')}
                </div>

                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', fontSize: '0.8rem' }}
                >
                  Apply Profile
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Editable Taste Dimensions */}
        <section className="grid-3" style={{ marginBottom: 'var(--space-8)' }}>
          {/* Music & Sound Dimension */}
          <div className="card" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
              <span style={{ fontSize: '1.3rem' }}>🎵</span>
              <div>
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Music & Sound</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Artists, genres, listening vibes</span>
              </div>
            </div>

            <div className="tag-list" style={{ minHeight: '80px', marginBottom: 'var(--space-4)' }}>
              {(tasteProfile.music || []).map((item) => (
                <span key={item} className="tag selected">
                  {item}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveTag('music', item)}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: '4px' }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <form 
              onSubmit={(e) => { e.preventDefault(); handleAddTag('music', musicInput, setMusicInput); }}
              style={{ display: 'flex', gap: '6px' }}
            >
              <input
                type="text"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                placeholder="+ Add artist or genre"
                value={musicInput}
                onChange={(e) => setMusicInput(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary btn-sm" disabled={!musicInput.trim()}>
                Add
              </button>
            </form>
          </div>

          {/* Food & Gastronomy Dimension */}
          <div className="card" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
              <span style={{ fontSize: '1.3rem' }}>🥢</span>
              <div>
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Food & Beverage</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cuisines, coffee, dining styles</span>
              </div>
            </div>

            <div className="tag-list" style={{ minHeight: '80px', marginBottom: 'var(--space-4)' }}>
              {(tasteProfile.food || []).map((item) => (
                <span key={item} className="tag selected">
                  {item}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveTag('food', item)}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: '4px' }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <form 
              onSubmit={(e) => { e.preventDefault(); handleAddTag('food', foodInput, setFoodInput); }}
              style={{ display: 'flex', gap: '6px' }}
            >
              <input
                type="text"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                placeholder="+ Add cuisine or coffee"
                value={foodInput}
                onChange={(e) => setFoodInput(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary btn-sm" disabled={!foodInput.trim()}>
                Add
              </button>
            </form>
          </div>

          {/* Aesthetics & Culture Dimension */}
          <div className="card" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
              <span style={{ fontSize: '1.3rem' }}>🏛️</span>
              <div>
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Aesthetics & Spaces</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Art forms, venues, literary vibes</span>
              </div>
            </div>

            <div className="tag-list" style={{ minHeight: '80px', marginBottom: 'var(--space-4)' }}>
              {(tasteProfile.culture || []).map((item) => (
                <span key={item} className="tag selected">
                  {item}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveTag('culture', item)}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: '4px' }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <form 
              onSubmit={(e) => { e.preventDefault(); handleAddTag('culture', cultureInput, setCultureInput); }}
              style={{ display: 'flex', gap: '6px' }}
            >
              <input
                type="text"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                placeholder="+ Add gallery, books, etc."
                value={cultureInput}
                onChange={(e) => setCultureInput(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary btn-sm" disabled={!cultureInput.trim()}>
                Add
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
