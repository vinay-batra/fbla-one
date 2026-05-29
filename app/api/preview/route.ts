import { NextResponse } from "next/server";

/**
 * GET /api/preview?redirect=/app/coach
 *
 * Sets a short-lived fbla_preview cookie and redirects the visitor into
 * the app in localStorage-only (no-auth) mode. Used by the "Preview the
 * platform" button on the landing page and about page so advisors can
 * explore without signing up.
 */
export function GET(req: Request): Response {
  const url = new URL(req.url);
  const redirectTo = url.searchParams.get("redirect") ?? "/app";

  const response = NextResponse.redirect(new URL(redirectTo, req.url));

  response.cookies.set("fbla_preview", "1", {
    path: "/",
    maxAge: 60 * 60, // 1 hour
    sameSite: "lax",
    httpOnly: false, // readable client-side so AppShell can show "exit preview" UI
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
