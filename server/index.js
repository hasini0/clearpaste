// Entry point: `npm start` (or `node server/index.js`).

import http from 'node:http';
import { config, isAIEnabled } from './config.js';
import { createApp } from './app.js';

const server = http.createServer(createApp());

server.listen(config.port, () => {
  const mode = isAIEnabled() ? `Claude AI (${config.model})` : 'offline engine (set ANTHROPIC_API_KEY for AI mode)';
  console.log(`\n  ClearPaste is running → http://localhost:${config.port}`);
  console.log(`  Mode: ${mode}\n`);
});
