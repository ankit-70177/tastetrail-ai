// client/src/context/TasteContext.jsx — Global State for TasteTrail AI
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';

const TasteContext = createContext(null);

const SAVED_STORAGE_KEY = 'tastetrail_saved_v1';
const PROFILE_STORAGE_KEY = 'tastetrail_profile_v1';

const DEFAULT_PROFILE = {
  music: ['Indie Rock', 'Dream Pop', 'Lo-Fi Jazz'],
  food: ['Korean Street Food', 'Specialty Coffee', 'Sourdough Bakeries'],
  culture: ['Contemporary Art', 'Independent Bookstores', 'Vinyl Record Shops'],
  atmosphere: 'Artistic & Relaxed',
  seedEntities: [
    { name: 'Peter Cat Recording Co.', type: 'urn:entity:music:artist' },
    { name: 'Korean Bibimbap', type: 'urn:entity:food:cuisine' },
    { name: 'Modern Art Gallery', type: 'urn:entity:culture:art' }
  ]
};

export function TasteProvider({ children }) {
  // Saved bookmarks state with local persistence
  const [savedItems, setSavedItems] = useState(() => {
    try {
      const stored = localStorage.getItem(SAVED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // User Taste Profile state
  const [tasteProfile, setTasteProfile] = useState(() => {
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  // Active Plan state
  const [activePlan, setActivePlan] = useState(null);

  // System Status state (mode, health, live/demo)
  const [systemStatus, setSystemStatus] = useState({
    status: 'checking',
    mode: 'demo_mode',
    service: 'TasteTrail AI',
    loading: true
  });

  // Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(prev => (prev?.id === prev?.id ? null : prev));
    }, 4000);
  }, []);

  // Sync saved items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(savedItems));
    } catch (e) {
      console.warn('Failed to save bookmarks to localStorage', e);
    }
  }, [savedItems]);

  // Sync taste profile to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(tasteProfile));
    } catch (e) {
      console.warn('Failed to save profile to localStorage', e);
    }
  }, [tasteProfile]);

  // Fetch initial health/status on mount
  useEffect(() => {
    let mounted = true;
    async function checkHealth() {
      try {
        const health = await api.getHealth();
        if (mounted) {
          setSystemStatus({
            status: health.status || 'ok',
            mode: health.mode || 'demo_mode',
            service: health.service || 'TasteTrail AI',
            version: health.version || '1.0.0',
            loading: false
          });
        }
      } catch (err) {
        if (mounted) {
          setSystemStatus({
            status: 'offline',
            mode: 'demo_mode',
            service: 'TasteTrail AI',
            loading: false,
            error: err.message
          });
        }
      }
    }
    checkHealth();
    return () => { mounted = false; };
  }, []);

  // Bookmark actions
  const isSaved = useCallback((idOrName) => {
    return savedItems.some(item => (item.id && item.id === idOrName) || item.venueName === idOrName || item.name === idOrName);
  }, [savedItems]);

  const toggleSaveItem = useCallback((item) => {
    const itemId = item.id || item.venueName || item.name;
    setSavedItems(prev => {
      const exists = prev.some(i => (i.id && i.id === itemId) || i.venueName === itemId || i.name === itemId);
      if (exists) {
        showToast(`Removed "${item.venueName || item.name}" from Saved`, 'info');
        return prev.filter(i => (i.id && i.id !== itemId) && i.venueName !== itemId && i.name !== itemId);
      } else {
        showToast(`Saved "${item.venueName || item.name}" to discoveries`, 'success');
        return [...prev, { ...item, savedAt: new Date().toISOString() }];
      }
    });
  }, [showToast]);

  const clearSaved = useCallback(() => {
    setSavedItems([]);
    showToast('Cleared all saved discoveries', 'info');
  }, [showToast]);

  const updateProfile = useCallback((newProfile) => {
    setTasteProfile(prev => ({ ...prev, ...newProfile }));
    showToast('Taste preferences updated', 'success');
  }, [showToast]);

  const value = {
    savedItems,
    toggleSaveItem,
    isSaved,
    clearSaved,
    tasteProfile,
    updateProfile,
    activePlan,
    setActivePlan,
    systemStatus,
    toast,
    showToast
  };

  return (
    <TasteContext.Provider value={value}>
      {children}
    </TasteContext.Provider>
  );
}

export function useTaste() {
  const context = useContext(TasteContext);
  if (!context) {
    throw new Error('useTaste must be used within a TasteProvider');
  }
  return context;
}
