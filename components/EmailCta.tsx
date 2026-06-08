"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

/**
 * Landing-page final CTA. Auth-aware primary button (signed in -> dashboard,
 * signed out -> sign up) paired with an email-capture row that writes to the
 * `email_signups` table via the anon client (migration 0015). Mirrors the
 * `fbla_logged_in` cache PublicNav writes so the right button paints instantly.
 */
export function EmailCta() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) { setLoggedIn(false); return; }
    try {
      const c = localStorage.getItem("fbla_logged_in");
      if (c === "1") setLoggedIn(true);
      else if (c === "0") setLoggedIn(false);
    } catch {}
    supa.auth.getUser().then(({ data }) => {
      const li = !!data.user;
      setLoggedIn(li);
      try { localStorage.setItem("fbla_logged_in", li ? "1" : "0"); } catch {}
    });
  }, []);

  const submit = async () => {
    const value = email.trim().toLowerCase();
    if (status === "loading") return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setErrorMsg("Enter a valid email address.");
      setStatus("error");
      return;
    }
    const supa = getSupabase();
    if (!supa) { setErrorMsg("Sign-ups are temporarily unavailable."); setStatus("error"); return; }
    setStatus("loading");
    setErrorMsg("");
    try {
      const { error: dbErr } = await supa.from("email_signups").insert({ email: value, source: "landing" });
      // 23505 = unique violation -> already on the list, treat as success.
      if (dbErr && dbErr.code !== "23505") throw dbErr;
      setStatus("done");
      setEmail("");
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.error("Email signup failed:", e);
      setErrorMsg("Something went wrong. Try again.");
      setStatus("error");
    }
  };

  return (
    <div style={{ marginTop: 28 }}>
      <div
        className="email-cta-row"
        style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}
      >
        {loggedIn ? (
          <Link href="/app" className="btn btn-accent btn-lg cta-shimmer">
            Go to dashboard
          </Link>
        ) : (
          <Link href="/auth?mode=signup" className="btn btn-accent btn-lg cta-shimmer">
            Get started free
          </Link>
        )}

        {status === "done" ? (
          <div
            role="status"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "13px 18px", borderRadius: 10,
              border: "0.5px solid rgba(var(--green-rgb), 0.35)",
              background: "rgba(var(--green-rgb), 0.08)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 600 }}>You are on the list!</span>
          </div>
        ) : (
          <div
            className="email-cta-field"
            style={{
              display: "flex", borderRadius: 10, overflow: "hidden",
              border: "0.5px solid var(--border2)", background: "var(--bg2)",
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="your@email.com"
              aria-label="Email address"
              style={{
                padding: "13px 16px", background: "transparent", border: "none",
                color: "var(--text)", fontSize: 13, outline: "none", width: 200,
              }}
            />
            <button
              type="button"
              onClick={submit}
              disabled={status === "loading"}
              className="font-mono"
              style={{
                padding: "13px 18px", background: "var(--bg3)", border: "none",
                borderLeft: "0.5px solid var(--border2)", color: "var(--text2)",
                fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
                cursor: status === "loading" ? "wait" : "pointer", whiteSpace: "nowrap",
              }}
            >
              {status === "loading" ? "..." : "Notify me"}
            </button>
          </div>
        )}
      </div>

      {status === "error" && (
        <p role="alert" style={{ fontSize: 12, color: "var(--red)", marginTop: 12 }}>{errorMsg}</p>
      )}
      <p style={{ fontSize: 11.5, color: "var(--text3)", marginTop: 14 }}>
        Free for every FBLA member. No credit card. Unsubscribe anytime.
      </p>

      <style>{`@media (max-width: 520px) {
        .email-cta-field { width: 100%; }
        .email-cta-field input { flex: 1; width: auto !important; }
      }`}</style>
    </div>
  );
}
