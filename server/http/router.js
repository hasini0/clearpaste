// Minimal method + path router. Returns false when no route matched so the
// caller can fall through to static files.

export function createRouter() {
  const routes = new Map();
  const key = (method, path) => `${method} ${path}`;

  return {
    get(path, handler) { routes.set(key('GET', path), handler); },
    post(path, handler) { routes.set(key('POST', path), handler); },

    async handle(req, res) {
      const { pathname } = new URL(req.url, 'http://localhost');
      const handler = routes.get(key(req.method, pathname));
      if (!handler) return false;
      await handler(req, res);
      return true;
    },
  };
}
