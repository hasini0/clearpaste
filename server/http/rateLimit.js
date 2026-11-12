// Per-visitor rate limit (fixed window, in memory). Protects the AI budget
// once the site is public. Behind a host like Render the real visitor IP is
// the first entry of the x-forwarded-for header.

export function createRateLimiter({ limit, windowMs }) {
  const hits = new Map(); // ip → { count, resetAt }

  // Forget old visitors so memory doesn't grow forever.
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) if (entry.resetAt <= now) hits.delete(ip);
  }, windowMs).unref();

  return function check(req) {
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
    const now = Date.now();
    let entry = hits.get(ip);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(ip, entry);
    }
    entry.count += 1;
    if (entry.count > limit) {
      const minutes = Math.ceil((entry.resetAt - now) / 60_000);
      throw Object.assign(new Error(`You've made a lot of requests. Please wait about ${minutes} minute${minutes > 1 ? 's' : ''} and try again.`), { status: 429 });
    }
  };
}
