/**
 * Simple in-memory rate limiter (same pattern as Corvo and Lark).
 * Sliding window - stores the timestamps of each request per key. Not shared
 * across serverless function instances, but sufficient for Vercel's single-region
 * deployment to block runaway abuse without a separate datastore.
 */

const store = new Map<string, number[]>();

/**
 * Returns true if the request is allowed, false if rate limited.
 * @param key      IP address or other identifier
 * @param limit    Max requests allowed in the window
 * @param windowMs Window size in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= limit) return false;

  timestamps.push(now);
  store.set(key, timestamps);

  // Probabilistic cleanup: avoid unbounded growth.
  if (Math.random() < 0.02) {
    for (const [k, times] of store.entries()) {
      if (times.length === 0 || times[times.length - 1] < windowStart) {
        store.delete(k);
      }
    }
  }

  return true;
}

/**
 * Extracts the verified client IP from a Vercel-deployed Next.js request.
 *
 * On Vercel, the proxy APPENDS the verified client IP as the RIGHTMOST entry in
 * X-Forwarded-For. Any IPs to the left are caller-supplied and can be spoofed
 * (e.g. `X-Forwarded-For: 1.1.1.1, 2.2.2.2` from curl). Using the full header as a
 * fingerprint would let an attacker mint a fresh rate-limit bucket per request, so
 * we use ONLY the rightmost hop. For local dev (no XFF), fall back to x-real-ip,
 * then the literal "local" so the limiter still scopes per machine.
 */
export function getClientIP(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "local";
}
