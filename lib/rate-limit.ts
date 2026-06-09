// Cross-instance rate limiter (issue #20).
//
// When Upstash Redis REST credentials are present the counter lives in Redis, so
// the cap holds across every serverless instance. Without them it falls back to a
// per-instance in-memory fixed window (the prior behavior). If the shared store
// is configured but unreachable, it DEGRADES to the in-memory limiter rather than
// either lifting the cap entirely or denying every request - so a Redis blip can
// never silently remove protection AND can never take the AI features fully down.
//
// To enable the durable limiter, create a free Upstash Redis database and set:
//   UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
// Vercel KV exposes the identical REST API as KV_REST_API_URL / KV_REST_API_TOKEN;
// either pair is picked up automatically.

export type RateResult = { allowed: boolean; remaining: number; limit: number };

const REST_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";

export const rateLimitBackend: "redis" | "memory" = REST_URL && REST_TOKEN ? "redis" : "memory";

// ── In-memory fixed window (per serverless instance) ──
const mem = new Map<string, { n: number; reset: number }>();
function memLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  const e = mem.get(key);
  if (!e || now > e.reset) {
    mem.set(key, { n: 1, reset: now + windowMs });
    // Bound memory: drop the oldest entry once the map grows large.
    if (mem.size > 5000) mem.delete(mem.keys().next().value as string);
    return { allowed: true, remaining: limit - 1, limit };
  }
  e.n += 1;
  return { allowed: e.n <= limit, remaining: Math.max(0, limit - e.n), limit };
}

// ── Upstash / Vercel KV Redis over REST (shared across all instances) ──
async function redisLimit(key: string, limit: number, windowMs: number): Promise<RateResult> {
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  // One round trip: INCR the counter, then set the TTL only on the first hit (NX)
  // so the window starts at the first request and is never slid forward by later
  // ones (which would let constant traffic keep a key alive and block forever).
  const res = await fetch(`${REST_URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REST_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, String(windowSec), "NX"],
    ]),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  const data = (await res.json()) as Array<{ result?: number; error?: string }>;
  if (!Array.isArray(data) || data[0]?.error) throw new Error(data?.[0]?.error || "upstash bad response");
  const n = Number(data[0]?.result ?? 0);
  return { allowed: n <= limit, remaining: Math.max(0, limit - n), limit };
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateResult> {
  if (rateLimitBackend === "redis") {
    try {
      return await redisLimit(key, limit, windowMs);
    } catch {
      // Shared store unreachable: degrade to the per-instance limiter so the cap
      // still applies (best effort) and the product keeps working through a blip.
      return memLimit(key, limit, windowMs);
    }
  }
  return memLimit(key, limit, windowMs);
}
