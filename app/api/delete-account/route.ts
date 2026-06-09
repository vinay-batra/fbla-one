import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

/**
 * DELETE /api/delete-account
 * Deletes the authenticated user's account (auth.users cascade → profiles).
 * Requires service role key - never call this from the client directly.
 */
export async function DELETE(req: NextRequest) {
  // Same-origin guard: this is an irreversible, state-changing action, so reject
  // cross-site callers (a malicious page that tricked a logged-in user into a
  // fetch). The Supabase cookie is SameSite=lax, but belt-and-suspenders here.
  const secFetchSite = req.headers.get("sec-fetch-site");
  // Reject anything that isn't an explicit same-origin browser request. For
  // clients that omit Sec-Fetch-Site, fall back to an Origin/Host comparison so
  // the guard can't be bypassed just by dropping the header.
  if (secFetchSite !== "same-origin") {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    let sameOrigin = false;
    if (origin && host) {
      try { sameOrigin = new URL(origin).host === host; } catch { sameOrigin = false; }
    }
    if (!sameOrigin) {
      return NextResponse.json({ error: "Cross-site request rejected." }, { status: 403 });
    }
  }

  const supabase = await getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Auth not configured." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return NextResponse.json({ error: "Server misconfigured." }, { status: 503 });
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Right-to-erasure: also drop this email from the marketing list. email_signups
  // is keyed on email (no user_id), so the auth.users cascade does NOT cover it.
  // Best-effort: needs the service_role delete grant from migration 0017; if that
  // migration is not yet applied the call returns an error which we intentionally
  // ignore so account deletion itself never fails on it.
  if (user.email) {
    try { await admin.from("email_signups").delete().eq("email", user.email.toLowerCase()); }
    catch { /* ignore until 0017 grants service_role delete on email_signups */ }
  }

  // Delete the auth user (cascades profiles + registrations + practice_logs +
  // saved_resources). Retry once on a transient failure - this is irreversible
  // and compliance-relevant, so a half-failed deletion must not pass silently.
  let lastErr: { message?: string } | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (!error) {
      // Best-effort append-only audit record (migration 0017 adds audit_log).
      try { await admin.from("audit_log").insert({ actor_id: user.id, action: "account.delete", target: user.id }); }
      catch { /* ignore until 0017 adds audit_log */ }
      return NextResponse.json({ ok: true });
    }
    lastErr = error;
    if (attempt === 0) await new Promise((r) => setTimeout(r, 400));
  }

  // Log a non-PII message in production (dev keeps the full object), matching the
  // rest of the codebase's NODE_ENV-gated logging.
  if (process.env.NODE_ENV !== "production") console.error("delete-account error:", lastErr);
  else console.error(JSON.stringify({ at: "delete-account", userId: user.id, err: lastErr?.message }));
  return NextResponse.json({ error: "Could not delete account. Please try again or contact support." }, { status: 500 });
}
