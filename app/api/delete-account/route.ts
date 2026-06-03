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
  if (secFetchSite && secFetchSite !== "same-origin") {
    return NextResponse.json({ error: "Cross-site request rejected." }, { status: 403 });
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
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    console.error("delete-account error:", error);
    return NextResponse.json({ error: "Could not delete account." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
