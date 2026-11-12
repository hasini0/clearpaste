// Central configuration. Reads a local .env file (no dependency needed)
// and exposes a frozen config object to the rest of the server.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadDotEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!match) continue;
    const [, key, raw] = match;
    if (process.env[key] !== undefined) continue; // real env wins
    process.env[key] = raw.replace(/^(['"])(.*)\1$/, '$2');
  }
}

loadDotEnv(path.join(ROOT, '.env'));

export const config = Object.freeze({
  root: ROOT,
  publicDir: path.join(ROOT, 'public'),
  port: Number(process.env.PORT) || 3000,
  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  model: process.env.CLAUDE_MODEL || 'claude-sonnet-5-5',
  maxInputChars: 20000,
  maxBodyBytes: 1_000_000,
  aiTimeoutMs: 60_000,
  // Requests per visitor per 10 minutes (analyze + ask together).
  rateLimit: Number(process.env.RATE_LIMIT) || 40,
});

export const isAIEnabled = () => Boolean(config.anthropicKey);
