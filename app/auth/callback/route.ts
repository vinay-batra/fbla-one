import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { safeNextPath } from "@/lib/url";

/**
 * OAuth callback route - required for PKCE flow (Supabase default).
 *
 * After Google/GitHub OAuth, Supabase redirects here with ?code=...
 * We exchange that code for a real session, then forward the user to /app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Origin-validated, backslash-safe same-origin redirect (no open redirect).
  const next = safeNextPath(searchParams.get("next"), "/app");

  if (code) {
    const supabase = await getSupabaseServer();
    if (supabase) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // Advisors land on their chapter unless a link asked for somewhere else.
        if (next === "/app" && data.user) {
          const { data: prof } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
          if (prof?.role === "advisor") return NextResponse.redirect(`${origin}/app/chapter`);
        }
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Something went wrong - send back to auth with an error hint
  return NextResponse.redirect(`${origin}/auth?error=oauth_failed`);
}
