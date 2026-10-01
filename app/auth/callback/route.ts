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
        let dest = next;
        if (next === "/app" && data.user) {
          const { data: prof } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
          if (prof?.role === "advisor") dest = "/app/chapter";
        }
        const res = NextResponse.redirect(`${origin}${dest}`);
        // Signed in now: a preview cookie from before must not keep the app in preview.
        res.cookies.delete("fbla_preview");
        return res;
      }
    }
  }

  // An expired or reused password reset link gets its own "send a new link" page.
  if (next === "/auth/update-password") return NextResponse.redirect(`${origin}/auth/update-password`);
  // Something went wrong - send back to auth with an error hint
  return NextResponse.redirect(`${origin}/auth?error=oauth_failed`);
}
