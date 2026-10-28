// src/services/qlooClient.js — Production Qloo Cultural Intelligence API Client
// Implements documented contracts for https://hackathon.api.qloo.com
import { config } from '../config.js';
import { DEMO_SEARCH_ENTITIES, DEMO_INSIGHTS_RESULTS } from '../data/demoFixtures.js';

export const SUPPORTED_INSIGHT_ENTITY_TYPES = Object.freeze([
  'urn:entity:artist',
  'urn:entity:book',
  'urn:entity:brand',
  'urn:entity:destination',
  'urn:entity:movie',
  'urn:entity:person',
  'urn:entity:place',
  'urn:entity:podcast',
  'urn:entity:tv_show',
  'urn:entity:video_game'
]);

// Map common developer mistakes to supported Qloo entity types (documented in Qloo guide)
const ENTITY_TYPE_CORRECTIONS = Object.freeze({
  'urn:entity:music': 'urn:entity:artist',
  'urn:entity:food_and_drink': 'urn:entity:place',
  'urn:entity:restaurant': 'urn:entity:place',
  'urn:entity:cuisine': 'urn:entity:place',
  'urn:entity:videogame': 'urn:entity:video_game'
});

export class QlooClient {
  constructor(customConfig = {}) {
    this.baseUrl = (customConfig.baseUrl || config.qloo.baseUrl || 'https://hackathon.api.qloo.com').replace(/\/+$/, '');
    this.apiKey = customConfig.apiKey ?? config.qloo.apiKey ?? '';
    this.timeoutMs = customConfig.timeoutMs ?? config.qloo.timeoutMs ?? 10000;
    this.forceMock = customConfig.forceMock ?? config.mockAi;
    this.fetchFn = customConfig.fetchFn || globalThis.fetch;
    this.maxRetries = customConfig.maxRetries ?? 1;
    this.retryBackoffMs = customConfig.retryBackoffMs ?? (process.env.NODE_ENV === 'test' ? 10 : 300);
  }

  /**
   * Returns true only when a non-empty API key is configured and mock mode is not forced.
   */
  isLive() {
    return Boolean(!this.forceMock && this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Documented authentication header contract: X-Api-Key
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.apiKey) {
      headers['X-Api-Key'] = this.apiKey.trim();
    }
    return headers;
  }

  /**
   * Canonicalize and validate entity type for /v2/insights
   */
  validateEntityType(type) {
    if (!type) return 'urn:entity:place';
    const corrected = ENTITY_TYPE_CORRECTIONS[type] || type;
    if (SUPPORTED_INSIGHT_ENTITY_TYPES.includes(corrected)) {
      return corrected;
    }
    // Fallback safely to place for travel/cultural itineraries
    return 'urn:entity:place';
  }

  /**
   * Internal fetch wrapper with timeout and exponential backoff retry for transient 429/503
   */
  async _fetchWithRetry(url, options = {}) {
    const startTime = Date.now();
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await this.fetchFn(url, {
          ...options,
          headers: this.getHeaders(),
          signal: controller.signal
        });
        clearTimeout(timer);

        // Retry on 429 (rate limit) or 503 (transient service unavailable)
        if ((response.status === 429 || response.status === 503) && attempt < this.maxRetries) {
          attempt++;
          const retryHeader = response.headers?.get?.('retry-after');
          const delay = retryHeader ? Math.max(10, parseInt(retryHeader, 10) * 1000) : this.retryBackoffMs * Math.pow(2, attempt - 1);
          await new Promise(r => setTimeout(r, Math.min(delay, 1000)));
          continue;
        }

        return { response, error: null, startTime };
      } catch (err) {
        clearTimeout(timer);
        if (err.name === 'AbortError') {
          return { response: null, error: err, startTime };
        }
        if (attempt < this.maxRetries) {
          attempt++;
          await new Promise(r => setTimeout(r, this.retryBackoffMs * Math.pow(2, attempt - 1)));
          continue;
        }
        return { response: null, error: err, startTime };
      }
    }
  }

  /**
   * Search entities in Qloo Knowledge Graph
   * Contract: GET /search?query=...&types=...
   */
  async search(query, types = null, options = {}) {
    if (!query || typeof query !== 'string' || !query.trim()) {
      return { success: false, error: 'Query parameter is required', results: [], sourceMode: 'error' };
    }

    const cleanQuery = query.trim();

    // Deterministic Offline / Demo Fixture fallback
    if (!this.isLive()) {
      const matched = this._findDemoSearch(cleanQuery.toLowerCase());
      return {
        success: true,
        sourceMode: 'demo_fixture',
        query: cleanQuery,
        results: matched.map(item => ({ ...item, sourceMode: 'demo_fixture' })),
        total: matched.length
      };
    }

    const params = new URLSearchParams({ query: cleanQuery });
    if (types) {
      params.append('types', types);
    }
    if (options.take) {
      params.append('take', String(Math.min(50, Math.max(1, Number(options.take)))));
    }
    if (options['filter.location']) {
      params.append('filter.location', options['filter.location']);
    }

    const url = `${this.baseUrl}/search?${params.toString()}`;

    try {
      const { response, error, startTime } = await this._fetchWithRetry(url, { method: 'GET' });

      if (error) {
        return this._handleCatchError(error, 'Search API', startTime);
      }

      if (!response.ok) {
        return this._handleHttpError(response, 'Search API', startTime);
      }

      const data = await response.json().catch(() => ({}));
      const rawList = Array.isArray(data.results)
        ? data.results
        : (Array.isArray(data) ? data : []);

      const normalized = rawList.map(item => this._normalizeSearchEntity(item, 'live_qloo'));

      return {
        success: true,
        sourceMode: 'live_qloo',
        durationMs: Date.now() - startTime,
        query: cleanQuery,
        results: normalized,
        total: normalized.length
      };
    } catch (err) {
      return this._handleCatchError(err, 'Search API', Date.now());
    }
  }

  /**
   * Retrieve Cultural Insights & Affinity Recommendations
   * Contract: GET /v2/insights?filter.type=...&signal.interests.entities=...
   */
  async getInsights(params = {}) {
    // Deterministic Offline / Demo Fixture fallback
    if (!this.isLive()) {
      return {
        success: true,
        sourceMode: 'demo_fixture',
        durationMs: 38,
        results: DEMO_INSIGHTS_RESULTS.map(item => ({ ...item, sourceMode: 'demo_fixture' })),
        total: DEMO_INSIGHTS_RESULTS.length
      };
    }

    const url = new URL(`${this.baseUrl}/v2/insights`);

    // 1. Mandatory filter.type
    const entityType = this.validateEntityType(params['filter.type'] || params.filterType);
    url.searchParams.append('filter.type', entityType);

    // 2. Signals: Entities (official param: signal.interests.entities; alias: entity_ids)
    const entitySeeds = params['signal.interests.entities'] || params.entity_ids || params.entityIds;
    if (entitySeeds) {
      const seeds = Array.isArray(entitySeeds) ? entitySeeds.join(',') : String(entitySeeds);
      if (seeds.trim()) {
        url.searchParams.append('signal.interests.entities', seeds.trim());
      }
    }

    // 3. Signals: Tags
    const tagSeeds = params['signal.interests.tags'] || params.tags;
    if (tagSeeds) {
      const tags = Array.isArray(tagSeeds) ? tagSeeds.join(',') : String(tagSeeds);
      if (tags.trim()) {
        url.searchParams.append('signal.interests.tags', tags.trim());
      }
    }

    // 4. Signals: Demographics / Audiences
    if (params['signal.demographics.audiences']) {
      url.searchParams.append('signal.demographics.audiences', String(params['signal.demographics.audiences']));
    }

    // 5. Filters: Location
    const loc = params['filter.location'] || params.location;
    if (loc && typeof loc === 'string' && loc.trim()) {
      url.searchParams.append('filter.location', loc.trim());
    }

    // 6. Filters: Tags & Price
    if (params['filter.tags']) {
      url.searchParams.append('filter.tags', String(params['filter.tags']));
    }
    if (params['filter.price_level.max']) {
      url.searchParams.append('filter.price_level.max', String(params['filter.price_level.max']));
    }

    // 7. Explainability & Output Shaping
    url.searchParams.append('feature.explainability', 'true');
    const take = Number(params.take || 20);
    url.searchParams.append('take', String(Math.min(50, Math.max(1, take))));

    if (params.sort_by) {
      url.searchParams.append('sort_by', params.sort_by);
    }

    try {
      const { response, error, startTime } = await this._fetchWithRetry(url.toString(), { method: 'GET' });

      if (error) {
        return this._handleCatchError(error, 'Insights API', startTime);
      }

      if (!response.ok) {
        return this._handleHttpError(response, 'Insights API', startTime);
      }

      const data = await response.json().catch(() => ({}));
      
      // Normalize entities array from Qloo responses:
      // Can be in data.results.entities (standard v2 format) or data.results (flat array)
      let rawEntities = [];
      if (data?.results?.entities && Array.isArray(data.results.entities)) {
        rawEntities = data.results.entities;
      } else if (Array.isArray(data?.results)) {
        rawEntities = data.results;
      } else if (Array.isArray(data?.entities)) {
        rawEntities = data.entities;
      }

      const normalized = rawEntities.map(item => this._normalizeInsightCandidate(item, 'live_qloo'));

      return {
        success: true,
        sourceMode: 'live_qloo',
        durationMs: Date.now() - startTime,
        results: normalized,
        total: normalized.length
      };
    } catch (err) {
      return this._handleCatchError(err, 'Insights API', Date.now());
    }
  }

  /**
   * Health and connectivity check
   */
  async checkConnection() {
    if (!this.isLive()) {
      return {
        connected: true,
        live: false,
        mode: 'demo_mode',
        message: 'Running in Demo Mode with authentic Qloo schema fixtures. Set QLOO_API_KEY in .env to activate live API.'
      };
    }

    try {
      const testResult = await this.search('art', null, { take: 1 });
      if (testResult.success) {
        return {
          connected: true,
          live: true,
          mode: 'live_qloo',
          message: 'Connected to official Qloo Hackathon API successfully.'
        };
      }
      return {
        connected: false,
        live: false,
        mode: 'error',
        message: `Qloo API check failed: ${testResult.error}`
      };
    } catch (err) {
      return {
        connected: false,
        live: false,
        mode: 'error',
        message: `Failed to reach Qloo API: ${this._sanitizeErrorMessage(err.message)}`
      };
    }
  }

  // ─── Normalization Helpers ──────────────────────────────────────────────────

  _normalizeSearchEntity(item, sourceMode) {
    const urn = item.id || item.urn || `urn:entity:unknown:${Math.random().toString(36).slice(2, 8)}`;
    return {
      id: urn,
      urn,
      name: item.name || item.title || 'Unknown Entity',
      type: item.type || 'urn:entity:place',
      subtype: item.subtype || null,
      popularity: typeof item.popularity === 'number' ? item.popularity : 0.7,
      properties: item.properties || {},
      tags: Array.isArray(item.tags) ? item.tags : [],
      location: item.location || item.properties?.location || null,
      sourceMode
    };
  }

  _normalizeInsightCandidate(item, sourceMode) {
    const entityId = item.id || item.entity_id || item.urn || `urn:entity:place:${Math.random().toString(36).slice(2, 8)}`;
    const name = item.name || item.title || 'Curated Venue';
    
    // Normalize affinity score: standard 0.0 - 1.0 float
    let affinity = 0.88;
    if (typeof item.affinity === 'number') {
      affinity = item.affinity > 1 ? item.affinity / 100 : item.affinity;
    } else if (typeof item.score === 'number') {
      affinity = item.score > 1 ? item.score / 100 : item.score;
    } else if (typeof item.affinityScore === 'number') {
      affinity = item.affinityScore > 1 ? item.affinityScore / 100 : item.affinityScore;
    }

    // Category
    const category = item.category || item.subtype || (item.type ? item.type.split(':').pop() : 'Culture');

    // Extract explainability signal
    let evidenceSignal = null;
    if (item.explainability?.top_features && Array.isArray(item.explainability.top_features)) {
      evidenceSignal = item.explainability.top_features.map(f => f.name || f).join(', ');
    } else if (item.evidenceSignal) {
      evidenceSignal = item.evidenceSignal;
    } else {
      evidenceSignal = `Affinity: ${(affinity * 100).toFixed(0)}% via Qloo Cultural Graph`;
    }

    return {
      id: entityId,
      entityId,
      name,
      category,
      type: item.type || 'urn:entity:place',
      location: item.location || item.properties?.address || item.properties?.city || 'Central City',
      affinityScore: Math.round(affinity * 100) / 100,
      tags: Array.isArray(item.tags) ? item.tags : [],
      estimatedCost: item.estimatedCost || '₹500 - ₹1,500',
      recommendedSlot: item.recommendedSlot || 'Afternoon',
      explanation: item.explanation || `Grounded recommendation matching your cultural preference profile.`,
      evidenceSignal,
      properties: item.properties || {},
      sourceMode
    };
  }

  _findDemoSearch(cleanQuery) {
    for (const [key, items] of Object.entries(DEMO_SEARCH_ENTITIES)) {
      if (cleanQuery.includes(key) || key.includes(cleanQuery)) {
        return items;
      }
    }
    return [
      {
        id: `urn:entity:custom:${encodeURIComponent(cleanQuery)}`,
        name: cleanQuery.charAt(0).toUpperCase() + cleanQuery.slice(1),
        type: "urn:entity:place",
        tags: ["cultural-interest", cleanQuery],
        popularity: 0.70,
        sourceMode: 'demo_fixture'
      }
    ];
  }

  async _handleHttpError(response, context, startTime) {
    const errorText = await response.text().catch(() => '');
    const sanitized = this._sanitizeErrorMessage(errorText);

    if (response.status === 429) {
      return {
        success: false,
        status: 429,
        error: `Qloo API rate limit exceeded. Please back off request frequency.`,
        results: [],
        sourceMode: 'live_qloo',
        durationMs: Date.now() - startTime
      };
    }

    if (response.status === 401) {
      return {
        success: false,
        status: 401,
        error: `Invalid or missing Qloo API key. Verify QLOO_API_KEY in server environment. (${sanitized})`,
        results: [],
        sourceMode: 'live_qloo',
        durationMs: Date.now() - startTime
      };
    }

    if (response.status === 403) {
      return {
        success: false,
        status: 403,
        error: `Unsupported entity type or unauthorized feature in ${context}. (${sanitized})`,
        results: [],
        sourceMode: 'live_qloo',
        durationMs: Date.now() - startTime
      };
    }

    if (response.status === 404) {
      // Documented 404 means no matching entities found
      return {
        success: true,
        status: 404,
        results: [],
        total: 0,
        sourceMode: 'live_qloo',
        durationMs: Date.now() - startTime,
        warning: 'No matching entities found in Qloo for query.'
      };
    }

    return {
      success: false,
      status: response.status,
      error: `Qloo ${context} error (${response.status}): ${sanitized}`,
      results: [],
      sourceMode: 'live_qloo',
      durationMs: Date.now() - startTime
    };
  }

  _handleCatchError(err, context, startTime) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        error: `Qloo ${context} timed out after ${this.timeoutMs}ms`,
        results: [],
        sourceMode: 'live_qloo',
        durationMs: Date.now() - startTime
      };
    }
    return {
      success: false,
      error: `Network error connecting to Qloo ${context}: ${this._sanitizeErrorMessage(err.message)}`,
      results: [],
      sourceMode: 'live_qloo',
      durationMs: Date.now() - startTime
    };
  }

  _sanitizeErrorMessage(rawText) {
    if (!rawText) return 'Unknown error';
    return String(rawText).slice(0, 250).replace(/[a-zA-Z0-9_-]{20,}/g, '[REDACTED]');
  }
}

export const qlooClient = new QlooClient();
