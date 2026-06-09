import { NextResponse } from "next/server";

// Lightweight health/readiness probe so a monitor (Vercel, UptimeRobot, etc.)
// can detect a misconfiguration or outage before a user reports it. Reports
// only presence of required config + a live Supabase reachability check - never
// any secret values. Returns 503 when a required dependency is missing.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, boolean> = {
    anthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };

  // Best-effort Supabase reachability (HEAD on the REST root). Bounded so a slow
  // dependency can't hang the probe.
  let supabaseReachable = false;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (base && anon) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 3000);
      const r = await fetch(`${base}/rest/v1/`, {
        method: "HEAD",
        headers: { apikey: anon },
        signal: ctrl.signal,
        cache: "no-store",
      });
      clearTimeout(t);
      supabaseReachable = r.ok || r.status === 400 || r.status === 404; // any HTTP answer = reachable
    } catch {
      supabaseReachable = false;
    }
  }

  const ok = Object.values(checks).every(Boolean) && supabaseReachable;
  return NextResponse.json(
    { ok, checks: { ...checks, supabaseReachable }, ts: new Date().toISOString() },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
