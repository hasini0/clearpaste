// Wires routes to handlers. Kept tiny on purpose: every real piece of
// logic lives in services/, engine/, ai/ or privacy/.

import { config, isAIEnabled } from './config.js';
import { createRouter } from './http/router.js';
import { readJson, sendJson } from './http/json.js';
import { serveStatic } from './http/static.js';
import { analyzeDocument } from './services/analyzer.js';
import { answerQuestion } from './services/asker.js';
import { ValidationError } from './services/validate.js';

export function createApp() {
  const router = createRouter();

  router.get('/api/health', (req, res) => {
    sendJson(res, 200, { ok: true, ai: isAIEnabled(), model: isAIEnabled() ? config.model : null });
  });

  router.post('/api/analyze', async (req, res) => {
    const body = await readJson(req, config.maxBodyBytes);
    sendJson(res, 200, await analyzeDocument(body));
  });

  router.post('/api/ask', async (req, res) => {
    const body = await readJson(req, config.maxBodyBytes);
    sendJson(res, 200, await answerQuestion(body));
  });

  return async (req, res) => {
    try {
      const handled = await router.handle(req, res);
      if (!handled) await serveStatic(req, res, config.publicDir);
    } catch (err) {
      const status = err instanceof ValidationError ? 400 : err.status || 500;
      if (status === 500) console.error(err);
      if (!res.headersSent) sendJson(res, status, { error: status === 500 ? 'Something went wrong.' : err.message });
    }
  };
}
