/**
 * Same-origin redirect validation.
 *
 * The naive guard `raw.startsWith("/") && !raw.startsWith("//")` is bypassable:
 * the WHATWG URL parser normalizes backslashes to forward slashes for http(s)
 * schemes, so `new URL("/\\evil.com", origin)` resolves to `https://evil.com/`.
 * `safeNextPath` rejects backslashes up front AND resolves the candidate against
 * our origin, requiring the result to stay on it. Returns a clean root-relative
 * path (or the fallback) - never an absolute/cross-origin URL.
 */
export function safeNextPath(raw: string | null | undefined, fallback = "/app"): string {
  if (!raw) return fallback;
  // Must be root-relative, not protocol-relative, and contain no backslashes.
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return fallback;
  try {
    const base = "https://fbla.one";
    const resolved = new URL(raw, base);
    if (resolved.origin !== base) return fallback; // resolved off-origin -> reject
    return resolved.pathname + resolved.search + resolved.hash;
  } catch {
    return fallback;
  }
}
