import type { NextConfig } from "next";

// Content-Security-Policy. Shipped in REPORT-ONLY mode first: enforcing a strict
// script-src would block Next's inline hydration/bootstrap scripts and the
// inline theme-init script in app/layout.tsx, which needs nonce wiring to do
// safely. Report-only surfaces violations (browser console / report-uri)
// without breaking the live site; once the console is clean, switch the key to
// "Content-Security-Policy" to enforce.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https://api.qrserver.com https://*.supabase.co https://lh3.googleusercontent.com",
  "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "microphone=(), camera=(), geolocation=()",
  },
  { key: "Content-Security-Policy-Report-Only", value: CSP },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
