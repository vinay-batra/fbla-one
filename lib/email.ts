/**
 * Resend email wrapper (server-only).
 *
 * Uses Resend's REST API via fetch so no extra dependency is required.
 * No-ops gracefully when RESEND_API_KEY isn't set, so the app never crashes
 * if email isn't configured yet.
 *
 * Setup:
 *   1. Create an account at resend.com
 *   2. Add + verify the fbla.one domain (add the DNS records Resend gives you)
 *   3. Add RESEND_API_KEY to .env.local and Vercel env vars
 *   4. (Optional) point Supabase Auth -> SMTP at Resend so confirmation /
 *      magic-link emails come from hello@fbla.one instead of supabase.io
 */

const FROM_DEFAULT = "FBLA One <hello@fbla.one>";

type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
};

export const isEmailConfigured = Boolean(process.env.RESEND_API_KEY);

export async function sendEmail(args: SendArgs): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("sendEmail skipped: RESEND_API_KEY not set");
    }
    return { ok: false, error: "Email not configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: args.from ?? FROM_DEFAULT,
        to: args.to,
        subject: args.subject,
        html: args.html,
        reply_to: args.replyTo,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
