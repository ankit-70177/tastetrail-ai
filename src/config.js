// src/config.js — Central Configuration for TasteTrail AI
import fs from 'node:fs';
import path from 'node:path';

// Load .env manually if running without --env-file
function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    } catch {
      // Ignore read errors, process.env takes precedence
    }
  }
}

loadEnvFile();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  // Qloo API Configuration
  qloo: {
    baseUrl: process.env.QLOO_BASE_URL || 'https://hackathon.api.qloo.com',
    apiKey: process.env.QLOO_API_KEY || '',
    timeoutMs: parseInt(process.env.QLOO_TIMEOUT_MS || '10000', 10),
    isConfigured() {
      return Boolean(this.apiKey && this.apiKey.trim().length > 0);
    }
  },

  // Fallback / Demo Mode Toggle
  mockAi: process.env.MOCK_AI === 'true' || !process.env.QLOO_API_KEY,

  // App Metadata
  appName: 'TasteTrail AI',
  version: '1.0.0',
  tagline: "Discover What You'll Actually Love"
};

export function getPublicConfig() {
  return {
    appName: config.appName,
    version: config.version,
    tagline: config.tagline,
    qlooConfigured: config.qloo.isConfigured(),
    qlooBaseUrl: config.qloo.baseUrl,
    mode: config.qloo.isConfigured() && !config.mockAi ? 'live_qloo' : 'demo_mode'
  };
}
