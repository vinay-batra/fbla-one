import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Next.js 16 renamed `middleware` to `proxy`. Same role: runs on every
 * request, refreshes the Supabase session, writes hardened cookies.
 * No-ops when Supabase env vars aren't configured.
 */
const AUTH_COOKIE_FIX = "cp_auth_fix";

export async function proxy(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next();

  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(toSet) {
        toSet.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        toSet.forEach(({ name, value, options }) => {
          res.cookies.set({
            name,
            value,
            ...options,
            // httpOnly MUST be false: @supabase/ssr's browser client restores
            // the session by reading the auth cookie from document.cookie on
            // every load. httpOnly:true makes it unreadable, so the client sees
            // no session and "sign in does nothing" (you bounce back to /auth).
            // This is the same bug + fix as Corvo. Keep sameSite=lax + secure.
            httpOnly: false,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
          });
        });
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch {
    // Supabase outage shouldn't 500 the site.
  }

  // One-time repair: Google sign-ins before Oct 2, 2026 stored the session in
  // httpOnly cookies (lib/supabase-server.ts), which the browser client cannot
  // read. Re-issue any auth cookie this response is not already rewriting,
  // readable, then mark the browser as repaired so this runs once.
  if (req.cookies.get(AUTH_COOKIE_FIX)?.value !== "1") {
    const auth = req.cookies.getAll().filter((c) => /^sb-.+-auth-token(\.\d+)?$/.test(c.name));
    if (auth.length) {
      for (const c of auth) {
        if (res.cookies.get(c.name)) continue;
        res.cookies.set({
          name: c.name,
          value: c.value,
          httpOnly: false,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 400 * 24 * 60 * 60,
        });
      }
      res.cookies.set({ name: AUTH_COOKIE_FIX, value: "1", path: "/", sameSite: "lax", maxAge: 400 * 24 * 60 * 60 });
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static, _next/image, favicon, public files
     * - api routes (handled separately if added)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
