// Serves files from public/ with correct MIME types and no path traversal.

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

export async function serveStatic(req, res, publicDir) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return notFound(res);

  const { pathname } = new URL(req.url, 'http://localhost');
  const relative = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const filePath = path.normalize(path.join(publicDir, relative));
  if (!filePath.startsWith(publicDir + path.sep)) return notFound(res);

  try {
    const info = await stat(filePath);
    if (!info.isFile()) return notFound(res);
    res.writeHead(200, {
      'content-type': MIME[path.extname(filePath)] || 'application/octet-stream',
      'content-length': info.size,
      'x-content-type-options': 'nosniff',
    });
    if (req.method === 'HEAD') return res.end();
    createReadStream(filePath).pipe(res);
  } catch {
    notFound(res);
  }
}

function notFound(res) {
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Not found');
}
