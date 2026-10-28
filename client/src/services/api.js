// client/src/services/api.js — Frontend API client for TasteTrail AI

const API_BASE = '/api';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data?.error || `HTTP error ${res.status}: ${res.statusText}`;
    throw new Error(errorMsg);
  }
  return data;
}

export const api = {
  /**
   * Health check
   */
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  /**
   * Application configuration and demo presets
   */
  async getConfig() {
    const res = await fetch(`${API_BASE}/config`);
    return handleResponse(res);
  },

  /**
   * Qloo API connection status
   */
  async getQlooStatus() {
    const res = await fetch(`${API_BASE}/qloo/status`);
    return handleResponse(res);
  },

  /**
   * Search entities in Qloo knowledge graph
   */
  async searchQloo(query, types) {
    const params = new URLSearchParams({ query });
    if (types) params.append('types', types);
    const res = await fetch(`${API_BASE}/qloo/search?${params.toString()}`);
    return handleResponse(res);
  },

  /**
   * Generate cultural experience plan
   */
  async createPlan(payload) {
    const res = await fetch(`${API_BASE}/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  /**
   * Refine an existing experience plan
   */
  async refinePlan(currentPlan, instruction) {
    const res = await fetch(`${API_BASE}/refine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPlan, instruction })
    });
    return handleResponse(res);
  },

  /**
   * Compare Qloo plan against generic popularity baseline
   */
  async comparePlan(payload) {
    const res = await fetch(`${API_BASE}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  }
};
