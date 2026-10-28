// tests/qlooClient.test.js — Qloo API Client Unit & Mocking Tests
import test from 'node:test';
import assert from 'node:assert';
import { QlooClient, SUPPORTED_INSIGHT_ENTITY_TYPES } from '../src/services/qlooClient.js';

test('QlooClient: Header construction respects X-Api-Key convention', () => {
  const client = new QlooClient({ apiKey: 'test_key_xyz_123' });
  const headers = client.getHeaders();
  
  assert.strictEqual(headers['X-Api-Key'], 'test_key_xyz_123');
  assert.strictEqual(headers['Content-Type'], 'application/json');
  assert.strictEqual(headers.Authorization, undefined, 'Must not assume Bearer auth');
});

test('QlooClient: Base URL defaults to official hackathon endpoint', () => {
  const client = new QlooClient();
  assert.strictEqual(client.baseUrl, 'https://hackathon.api.qloo.com');
});

test('QlooClient: Validates and corrects entity types according to documentation', () => {
  const client = new QlooClient();

  // Standard documented types
  for (const valid of SUPPORTED_INSIGHT_ENTITY_TYPES) {
    assert.strictEqual(client.validateEntityType(valid), valid);
  }

  // Documented common pitfalls auto-corrected
  assert.strictEqual(client.validateEntityType('urn:entity:music'), 'urn:entity:artist');
  assert.strictEqual(client.validateEntityType('urn:entity:food_and_drink'), 'urn:entity:place');
  assert.strictEqual(client.validateEntityType('urn:entity:restaurant'), 'urn:entity:place');
  assert.strictEqual(client.validateEntityType('urn:entity:cuisine'), 'urn:entity:place');
});

test('QlooClient: Fallback to authentic demo fixtures when API key is missing', async () => {
  const client = new QlooClient({ apiKey: '', forceMock: true });
  assert.strictEqual(client.isLive(), false);

  const searchRes = await client.search('indie music');
  assert.strictEqual(searchRes.success, true);
  assert.strictEqual(searchRes.sourceMode, 'demo_fixture');
  assert.ok(searchRes.results.length > 0);
  assert.ok(searchRes.results[0].id.includes('urn:entity:'));
});

test('QlooClient: Empty search query validation', async () => {
  const client = new QlooClient({ apiKey: 'any_key' });
  const result = await client.search('');
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'Query parameter is required');
});

test('QlooClient: Sanitizes error messages to protect against secret leakage', () => {
  const client = new QlooClient();
  const rawError = 'Error at https://hackathon.api.qloo.com/?key=sk-1234567890abcdef1234567890 in backend';
  const sanitized = client._sanitizeErrorMessage(rawError);
  
  assert.ok(!sanitized.includes('sk-1234567890abcdef1234567890'));
  assert.ok(sanitized.includes('[REDACTED]'));
});

test('QlooClient: Mocked Upstream /search HTTP 200 handles real schema', async () => {
  const mockFetch = async (url, options) => {
    assert.ok(url.includes('/search?query=korean+bbq'));
    assert.strictEqual(options.headers['X-Api-Key'], 'mock_key_live');

    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        duration: 0.12,
        results: [
          {
            id: 'urn:entity:place:gung-the-palace',
            name: 'Gung The Palace',
            type: 'urn:entity:place',
            popularity: 0.85,
            properties: { address: 'Green Park, New Delhi' },
            tags: ['korean', 'bbq']
          }
        ]
      })
    };
  };

  const client = new QlooClient({
    apiKey: 'mock_key_live',
    forceMock: false,
    fetchFn: mockFetch
  });

  assert.strictEqual(client.isLive(), true);
  const res = await client.search('korean bbq');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.sourceMode, 'live_qloo');
  assert.strictEqual(res.results.length, 1);
  assert.strictEqual(res.results[0].name, 'Gung The Palace');
  assert.strictEqual(res.results[0].id, 'urn:entity:place:gung-the-palace');
});

test('QlooClient: Mocked Upstream /v2/insights HTTP 200 handles nested entities', async () => {
  const mockFetch = async (url, options) => {
    assert.ok(url.includes('/v2/insights?'));
    assert.ok(url.includes('filter.type=urn%3Aentity%3Aplace'));
    assert.ok(url.includes('signal.interests.entities=urn%3Aentity%3Aplace%3Aart1'));
    assert.strictEqual(options.headers['X-Api-Key'], 'mock_key_live');

    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        results: {
          duration: 0.25,
          entities: [
            {
              id: 'urn:entity:place:ngma-delhi',
              name: 'National Gallery of Modern Art',
              type: 'urn:entity:place',
              affinity: 0.96,
              properties: { city: 'New Delhi' },
              tags: ['modern-art', 'culture']
            }
          ]
        }
      })
    };
  };

  const client = new QlooClient({
    apiKey: 'mock_key_live',
    forceMock: false,
    fetchFn: mockFetch
  });

  const res = await client.getInsights({
    'filter.type': 'urn:entity:place',
    'signal.interests.entities': ['urn:entity:place:art1'],
    'filter.location': 'Delhi'
  });

  assert.strictEqual(res.success, true);
  assert.strictEqual(res.sourceMode, 'live_qloo');
  assert.strictEqual(res.results.length, 1);
  assert.strictEqual(res.results[0].name, 'National Gallery of Modern Art');
  assert.strictEqual(res.results[0].affinityScore, 0.96);
});

test('QlooClient: Handles HTTP 429 Rate Limit Exceeded gracefully', async () => {
  const mockFetch = async () => ({
    ok: false,
    status: 429,
    text: async () => 'Rate limit exceeded: 50 requests per minute'
  });

  const client = new QlooClient({
    apiKey: 'mock_key_live',
    forceMock: false,
    fetchFn: mockFetch
  });

  const res = await client.search('anything');
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.status, 429);
  assert.ok(res.error.includes('rate limit exceeded'));
});

test('QlooClient: Handles HTTP 401 Unauthorized gracefully', async () => {
  const mockFetch = async () => ({
    ok: false,
    status: 401,
    text: async () => 'Unauthorized: Invalid key sk-secret998877665544332211'
  });

  const client = new QlooClient({
    apiKey: 'mock_key_live',
    forceMock: false,
    fetchFn: mockFetch
  });

  const res = await client.getInsights({ 'filter.type': 'urn:entity:place' });
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.status, 401);
  assert.ok(res.error.includes('Invalid or missing Qloo API key'));
  assert.ok(!res.error.includes('sk-secret998877665544332211'));
  assert.ok(res.error.includes('[REDACTED]'));
});

test('QlooClient: Handles HTTP 404 No Results as empty success', async () => {
  const mockFetch = async () => ({
    ok: false,
    status: 404,
    text: async () => 'No matching entities'
  });

  const client = new QlooClient({
    apiKey: 'mock_key_live',
    forceMock: false,
    fetchFn: mockFetch
  });

  const res = await client.search('xyznonexistent123');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.results.length, 0);
});

test('QlooClient: Handles request timeout gracefully', async () => {
  const mockFetch = async () => {
    const error = new Error('The operation was aborted');
    error.name = 'AbortError';
    throw error;
  };

  const client = new QlooClient({
    apiKey: 'mock_key_live',
    forceMock: false,
    fetchFn: mockFetch
  });

  const res = await client.search('timeout_query');
  assert.strictEqual(res.success, false);
  assert.ok(res.error.includes('timed out'));
});

test('QlooClient: Automatically retries on HTTP 429 and succeeds on subsequent attempt', async () => {
  let callCount = 0;
  const mockFetch = async () => {
    callCount++;
    if (callCount === 1) {
      return {
        ok: false,
        status: 429,
        headers: { get: () => '0' },
        text: async () => 'Rate limit exceeded'
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ results: [{ id: 'urn:place:retry-success', name: 'Retry Venue' }] })
    };
  };

  const client = new QlooClient({
    apiKey: 'mock_key_live',
    forceMock: false,
    fetchFn: mockFetch,
    retryBackoffMs: 5,
    maxRetries: 1
  });

  const res = await client.search('retry_test');
  assert.strictEqual(res.success, true);
  assert.strictEqual(callCount, 2, 'Should have retried once');
  assert.strictEqual(res.results[0].name, 'Retry Venue');
});
