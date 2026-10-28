// tests/apiRoutes.test.js — End-to-End API Route Tests
import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { server } from '../src/server.js';

let testPort = 0;
let baseUrl = '';

test.before(async () => {
  await new Promise((resolve) => {
    // Listen on dynamic random port (0) to guarantee no port collision
    server.listen(0, () => {
      testPort = server.address().port;
      baseUrl = `http://localhost:${testPort}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => {
    server.close(resolve);
  });
});

test('HTTP GET /api/health returns HTTP 200 OK with service metadata', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.strictEqual(res.status, 200);

  const data = await res.json();
  assert.strictEqual(data.status, 'ok');
  assert.strictEqual(data.service, 'TasteTrail AI');
  assert.ok(data.version);
});

test('HTTP GET /api/config returns safe public config without exposing secrets', async () => {
  const res = await fetch(`${baseUrl}/api/config`);
  assert.strictEqual(res.status, 200);

  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.config.appName, 'TasteTrail AI');
  assert.strictEqual(data.config.apiKey, undefined, 'Must NEVER leak apiKey in public config');
  assert.ok(Array.isArray(data.presets), 'Must return presets for 1-click test');
});

test('HTTP GET /api/qloo/search handles entity resolution query', async () => {
  const res = await fetch(`${baseUrl}/api/qloo/search?query=indie%20music`);
  assert.strictEqual(res.status, 200);

  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(Array.isArray(data.results));
});

test('HTTP POST /api/plan generates grounded experience itinerary', async () => {
  const res = await fetch(`${baseUrl}/api/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      destination: 'Delhi',
      budget: 5000,
      duration: 'Weekend (2 Days)',
      atmosphere: 'Artistic & Relaxed',
      interests: ['indie music', 'Korean food', 'art']
    })
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.plan.planId);
  assert.ok(data.plan.itinerary.length > 0);
  assert.ok(data.plan.personalizationEvidence.length > 0);
});

test('HTTP POST /api/refine applies conversational adjustment', async () => {
  // First create plan
  const planRes = await fetch(`${baseUrl}/api/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destination: 'Delhi', budget: 5000 })
  });
  const { plan } = await planRes.json();

  // Now refine
  const refineRes = await fetch(`${baseUrl}/api/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      currentPlan: plan,
      instruction: 'Make it cheaper'
    })
  });

  assert.strictEqual(refineRes.status, 200);
  const data = await refineRes.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.plan.budget < 5000);

  // Test destination switch refinement
  const switchRes = await fetch(`${baseUrl}/api/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      currentPlan: data.plan,
      instruction: 'Switch to Tokyo and budget 15000'
    })
  });
  const switchData = await switchRes.json();
  assert.strictEqual(switchData.success, true);
  assert.strictEqual(switchData.plan.destination, 'Tokyo');
  assert.strictEqual(switchData.plan.budget, 15000);
});

test('HTTP POST /api/compare returns side-by-side Qloo vs Generic baseline', async () => {
  const res = await fetch(`${baseUrl}/api/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destination: 'Delhi', budget: 5000 })
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.qlooPlan);
  assert.ok(data.genericBaseline);
  assert.ok(data.genericBaseline.recommendations.length > 0);
});

test('HTTP GET / serves static index.html', async () => {
  const res = await fetch(`${baseUrl}/`);
  assert.strictEqual(res.status, 200);
  const html = await res.text();
  assert.ok(html.includes('TasteTrail'));
  assert.ok(html.includes('Discover What You&#039;ll Actually Love') || html.includes('Discover What You'));
});
