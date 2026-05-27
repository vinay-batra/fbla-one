import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

/**
 * OAuth callback route — required for PKCE flow (Supabase default).
 *
 * After Google/GitHub OAuth, Supabase redirects here with ?code=...
 * We exchange that code for a real session, then forward the user to /app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    const supabase = await getSupabaseServer();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Something went wrong — send back to auth with an error hint
  return NextResponse.redirect(`${origin}/auth?error=oauth_failed`);
}
