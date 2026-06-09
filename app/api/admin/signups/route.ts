import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/admin/signups
 * Owner-only read of the marketing email list. The email_signups table has no
 * SELECT grant for anon/authenticated (it is write-only from the browser), so it
 * is read here through the service role. Access is gated to the single site owner
 * by matching the authenticated session email against NEXT_PUBLIC_ADMIN_EMAIL -
 * the env value is public, but security rests on the server-verified session
 * email, which a caller cannot forge.
 */
export async function GET() {
  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase();
  if (!adminEmail) {
    return NextResponse.json({ error: "Admin access is not configured." }, { status: 403 });
  }

  const supabase = await getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Auth not configured." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || (user.email || "").toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return NextResponse.json({ error: "Server misconfigured." }, { status: 503 });
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await admin
    .from("email_signups")
    .select("id, email, source, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    if (process.env.NODE_ENV !== "production") console.error("admin/signups error:", error);
    return NextResponse.json({ error: "Could not load signups." }, { status: 500 });
  }

  return NextResponse.json({ signups: data ?? [] });
}
