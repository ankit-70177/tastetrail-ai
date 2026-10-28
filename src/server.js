// src/server.js — Express HTTP Server for TasteTrail AI
// Exports `server` (node:http.Server) so existing node:test suites work unchanged.
import http from 'node:http';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { config, getPublicConfig } from './config.js';
import { qlooClient } from './services/qlooClient.js';
import { tasteAgent } from './services/tasteAgent.js';
import { DEMO_PRESET_PROMPTS } from './data/demoFixtures.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Express App ─────────────────────────────────────────────────────────────
const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type', 'X-Api-Key'] }));
app.use(express.json({ limit: '1mb' }));

// ─── API Routes ───────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: config.appName,
    version: config.version,
    mode: config.qloo.isConfigured() && !config.mockAi ? 'live_qloo' : 'demo_mode',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/config', (_req, res) => {
  res.json({ success: true, config: getPublicConfig(), presets: DEMO_PRESET_PROMPTS });
});

app.get('/api/qloo/status', async (_req, res) => {
  try { res.json(await qlooClient.checkConnection()); }
  catch (err) { res.status(500).json({ connected: false, error: err.message }); }
});

app.get('/api/qloo/search', async (req, res) => {
  const { query, types } = req.query;
  if (!query) return res.status(400).json({ success: false, error: 'Query parameter is required' });
  try { res.json(await qlooClient.search(query, types)); }
  catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/plan', async (req, res) => {
  try { res.json({ success: true, plan: await tasteAgent.createExperiencePlan(req.body) }); }
  catch (err) { res.status(400).json({ success: false, error: err.message }); }
});

app.post('/api/refine', async (req, res) => {
  const { currentPlan, instruction } = req.body || {};
  if (!currentPlan || !instruction)
    return res.status(400).json({ success: false, error: 'currentPlan and instruction are required fields' });
  try { res.json({ success: true, plan: await tasteAgent.refinePlan(currentPlan, instruction) }); }
  catch (err) { res.status(400).json({ success: false, error: err.message }); }
});

app.post('/api/compare', async (req, res) => {
  try {
    const qlooPlan = await tasteAgent.createExperiencePlan(req.body);
    res.json({ success: true, qlooPlan, genericBaseline: qlooPlan.genericBaseline });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});

// ─── Static file serving ──────────────────────────────────────────────────────
// Priority: React build (client/dist) → legacy vanilla (public/)
const clientDist = path.resolve(__dirname, '../client/dist');
const publicDir  = path.resolve(__dirname, '../public');
const staticDir  = existsSync(clientDist + '/index.html') ? clientDist : publicDir;

app.use(express.static(staticDir));

// SPA catch-all for client-side routing
app.get('*', (_req, res) => {
  const idx = path.join(staticDir, 'index.html');
  existsSync(idx)
    ? res.sendFile(idx)
    : res.status(404).json({ error: 'Frontend not built. Run: npm run build' });
});

// ─── Export http.Server — required by tests/apiRoutes.test.js ────────────────
export const server = http.createServer(app);

// Auto-start when run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(config.port, () => {
    console.log(`\n  ✦ TasteTrail AI\n  ➜  http://localhost:${config.port}\n  ➜  Mode: ${config.qloo.isConfigured() && !config.mockAi ? 'LIVE QLOO' : 'Demo Mode'}\n`);
  });
}
