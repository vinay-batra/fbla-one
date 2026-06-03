"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Cloudflare Turnstile (lightweight inline — no npm package needed)
// ---------------------------------------------------------------------------
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement | string, opts: Record<string, unknown>) => string;
      reset: (id: string) => void;
    };
  }
}

function useTurnstile(onToken: (t: string | null) => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey || !containerRef.current) return;

    const mount = () => {
      if (!containerRef.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(null),
        theme: "auto",
        size: "normal",
      });
    };

    if (window.turnstile) {
      mount();
    } else {
      const existing = document.getElementById("cf-turnstile-script");
      if (!existing) {
        const script = document.createElement("script");
        script.id = "cf-turnstile-script";
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        script.async = true;
        script.defer = true;
        script.onload = mount;
        document.head.appendChild(script);
      } else {
        existing.addEventListener("load", mount);
      }
    }

    return () => {
      // cleanup: reset is safe to call even if widget is gone
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return containerRef;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Mode = "login" | "signup" | "magic" | "reset";

// ---------------------------------------------------------------------------
// Actual form (needs Suspense because of useSearchParams)
// ---------------------------------------------------------------------------
function AuthForm() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/app";

  const [sessionChecked, setSessionChecked] = useState(false);
  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "signup" ? "signup" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  // Watch data-theme for the bg glow colour
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const sync = () =>
      setDark(document.documentElement.getAttribute("data-theme") !== "light");
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);

  // Redirect already-authenticated users
  useEffect(() => {
    const supa = getSupabase();
    if (!supa) { setSessionChecked(true); return; }
    supa.auth.getSession().then(({ data: { session } }) => {
      if (session) { window.location.replace(nextPath); return; }
      setSessionChecked(true);
    });
  }, [nextPath]);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const turnstileRef = useTurnstile(setCaptchaToken);
  const hasTurnstile = !!siteKey;

  // A submit is ready when captcha is passed (or Turnstile isn't configured)
  const captchaReady = !hasTurnstile || !!captchaToken;
  const canSubmit = !loading && captchaReady;

  const handle = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!isSupabaseConfigured) {
      setError("Auth is not configured. Explore the dashboard in preview mode.");
      setLoading(false);
      return;
    }
    const supa = getSupabase();
    if (!supa) { setError("Auth client unavailable."); setLoading(false); return; }

    try {
      if (mode === "login") {
        const { error } = await supa.auth.signInWithPassword({
          email,
          password,
          options: captchaToken ? { captchaToken } : undefined,
        });
        if (error) throw error;
        // Full reload (not router.push) so the server picks up the fresh
        // session cookie on the very next request and renders the dashboard.
        window.location.href = nextPath;
      } else if (mode === "signup") {
        const { data, error } = await supa.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            ...(captchaToken ? { captchaToken } : {}),
          },
        });
        if (error) throw error;
        // Email confirmation is disabled, so signUp returns a live session.
        // Go straight to the dashboard. If a project ever turns confirmation
        // back on, there's no session and we fall back to the inbox message.
        if (data.session) {
          window.location.href = nextPath;
        } else {
          setSuccess("Account created. Check your inbox to confirm, then sign in.");
        }
      } else if (mode === "magic") {
        const { error } = await supa.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${nextPath}`,
            ...(captchaToken ? { captchaToken } : {}),
          },
        });
        if (error) throw error;
        setSuccess("Magic link sent. Check your inbox.");
        setMagicSent(true);
      } else {
        // reset
        const { error } = await supa.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/app`,
          ...(captchaToken ? { captchaToken } : {}),
        });
        if (error) throw error;
        setSuccess("Password reset email sent.");
      }
    } catch (err) {
      const e = err as { message?: string };
      setError(e.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!isSupabaseConfigured) { setError("OAuth not configured."); return; }
    const supa = getSupabase();
    if (!supa) return;
    const { error } = await supa.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${nextPath}` },
    });
    if (error) setError(error.message);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setSuccess(null);
    setMagicSent(false);
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    padding: "13px 15px",
    background: "var(--bg3)",
    border: `1px solid ${focused === field ? "var(--accent)" : "var(--border)"}`,
    borderRadius: 11,
    color: "var(--text)",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.18s, box-shadow 0.18s",
    boxShadow:
      focused === field
        ? "0 0 0 4px rgba(var(--accent-rgb), 0.10)"
        : "none",
    boxSizing: "border-box",
  });

  if (!sessionChecked) {
    return <div style={{ minHeight: "100vh", background: "var(--bg)" }} />;
  }

  const ctaLabel =
    mode === "login"
      ? "Log in"
      : mode === "signup"
      ? "Create account"
      : mode === "magic"
      ? "Send magic link"
      : "Send reset email";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        fontFamily: "Inter, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`@keyframes auth-spin{to{transform:rotate(360deg)}}`}</style>

      {/* Subtle grid */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `linear-gradient(rgba(var(--brand-rgb),0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(var(--brand-rgb),0.04) 1px,transparent 1px)`,
          backgroundSize: "56px 56px",
          pointerEvents: "none",
        }}
      />
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "18%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 640,
          height: 420,
          background: dark
            ? "radial-gradient(ellipse, rgba(var(--accent-rgb),0.07) 0%, transparent 68%)"
            : "radial-gradient(ellipse, rgba(var(--brand-rgb),0.08) 0%, transparent 68%)",
          pointerEvents: "none",
        }}
      />

      {/* Minimal top bar */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          padding: "18px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        <Logo size="md" />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link
            href="/"
            style={{
              fontSize: 13,
              color: "var(--text3)",
              textDecoration: "none",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text3)")}
          >
            &larr; Back to home
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* Centered card */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: 460,
            maxWidth: "calc(100vw - 32px)",
            background: "var(--card-bg)",
            border: "0.5px solid var(--border)",
            borderRadius: 20,
            padding: "44px 40px 36px",
            position: "relative",
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.04), 0 24px 60px rgba(0,0,0,0.2), 0 0 0 0.5px rgba(var(--accent-rgb),0.08)",
          }}
        >
          {/* Gold top-edge accent line */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: "12%",
              right: "12%",
              height: 1,
              background:
                "linear-gradient(90deg,transparent 0%,rgba(var(--accent-rgb),0.5) 50%,transparent 100%)",
              borderRadius: 20,
            }}
          />

          {/* Preview mode banner */}
          {!isSupabaseConfigured && (
            <div
              style={{
                marginBottom: 22,
                padding: "11px 13px",
                background: "var(--accent-dim)",
                border: "0.5px solid var(--accent-border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--accent)",
                fontWeight: 600,
                lineHeight: 1.55,
              }}
            >
              Preview mode -- explore the dashboard at{" "}
              <Link href="/app" style={{ textDecoration: "underline" }}>
                /app
              </Link>
              .
            </div>
          )}

          {/* Logo block */}
          <div style={{ textAlign: "center", marginBottom: 26 }}>
            <Link
              href="/"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "rgba(var(--accent-rgb),0.08)",
                  border: "0.5px solid rgba(var(--accent-rgb),0.28)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 22px rgba(var(--accent-rgb),0.13) inset",
                }}
              >
                {/* Shield + torch inline SVG matching the brand mark style */}
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <path d="M16 3L4 7v9c0 7 5.5 11.6 12 13 6.5-1.4 12-6 12-13V7L16 3z" fill="rgba(var(--accent-rgb),0.15)" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M16 10v7M16 10c0 0-1.5-2-1.5-3.5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="16" cy="8.5" r="1.5" fill="var(--accent)" />
                </svg>
              </div>
              <span
                className="font-mono"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.32em",
                  color: "var(--text)",
                }}
              >
                FBLA ONE
              </span>
            </Link>
          </div>

          {/* Headline */}
          <div style={{ textAlign: "center", marginBottom: 26 }}>
            <h1
              className="font-mono"
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: -0.5,
                lineHeight: 1.2,
                margin: "0 0 6px",
                color: "var(--text)",
              }}
            >
              {mode === "signup"
                ? "Get started"
                : mode === "magic"
                ? "Magic link"
                : mode === "reset"
                ? "Reset password"
                : "Welcome back"}
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "var(--text3)",
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              {mode === "signup"
                ? "Free for every FBLA member. Set up in under a minute."
                : mode === "magic"
                ? "We will email you a one-click sign-in link."
                : mode === "reset"
                ? "Enter your email to reset your password."
                : "Sign in to track your prep and access your chapter."}
            </p>
          </div>

          {/* Two-tab toggle: Log in / Sign up (hidden on magic/reset) */}
          {mode !== "magic" && mode !== "reset" && (
            <div
              style={{
                display: "flex",
                background: "var(--bg3)",
                borderRadius: 11,
                padding: 4,
                marginBottom: 22,
                border: "0.5px solid var(--border)",
              }}
            >
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: m === mode ? 700 : 500,
                    background: m === mode ? "var(--accent)" : "transparent",
                    border: "none",
                    color: m === mode ? (dark ? "#060c16" : "#060c16") : "var(--text3)",
                    cursor: "pointer",
                    transition: "background 0.2s, color 0.2s",
                    letterSpacing: 0.3,
                  }}
                >
                  {m === "login" ? "Log in" : "Sign up"}
                </button>
              ))}
            </div>
          )}

          {/* Google OAuth */}
          {(mode === "login" || mode === "signup") && isSupabaseConfigured && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 11,
                  background: "var(--bg3)",
                  border: "0.5px solid var(--border)",
                  color: "var(--text)",
                  fontSize: 13.5,
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 11,
                  transition: "border-color 0.18s, background 0.18s",
                  opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (loading) return;
                  e.currentTarget.style.borderColor = "rgba(var(--accent-rgb),0.38)";
                  e.currentTarget.style.background = "var(--bg2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.background = "var(--bg3)";
                }}
              >
                {/* Google brand icon — colour values are intentional exceptions */}
                <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  margin: "18px 0",
                }}
              >
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span
                  className="font-mono"
                  style={{
                    fontSize: 9,
                    color: "var(--text3)",
                    letterSpacing: "0.22em",
                    fontWeight: 600,
                  }}
                >
                  OR
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>
            </>
          )}

          {/* Email + Password inputs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (mode === "magic" || mode === "reset")) handle();
              }}
              placeholder="you@school.edu"
              autoComplete="email"
              aria-label="Email address"
              style={inputStyle("email")}
            />
            {(mode === "login" || mode === "signup") && (
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handle();
                }}
                placeholder="Password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                aria-label="Password"
                minLength={8}
                style={inputStyle("password")}
              />
            )}
          </div>

          {/* Trust strip on signup */}
          {mode === "signup" && (
            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 14,
                padding: "9px 12px",
                background: "rgba(var(--accent-rgb),0.04)",
                border: "0.5px solid rgba(var(--accent-rgb),0.14)",
                borderRadius: 8,
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {[
                {
                  icon: (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  ),
                  text: "Bank-grade encryption",
                },
                {
                  icon: (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                  ),
                  text: "We never sell your data",
                },
                {
                  icon: (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ),
                  text: "Always free",
                },
              ].map((item, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 10,
                    color: "var(--text3)",
                    fontWeight: 500,
                    letterSpacing: 0.2,
                  }}
                >
                  <span style={{ color: "var(--accent)" }} aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.text}
                </span>
              ))}
            </div>
          )}

          {/* Forgot / Magic link row (login only) */}
          {mode === "login" && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <button
                type="button"
                onClick={() => switchMode("magic")}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 12,
                  color: "var(--accent)",
                  cursor: "pointer",
                  opacity: 0.8,
                  padding: 0,
                }}
              >
                Magic link
              </button>
              <button
                type="button"
                onClick={() => switchMode("reset")}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 12,
                  color: "var(--text3)",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Cloudflare Turnstile */}
          {hasTurnstile && (
            <div ref={turnstileRef} style={{ marginBottom: 12 }} />
          )}

          {/* Error / success */}
          {error && (
            <div
              style={{
                padding: "10px 12px",
                background: "rgba(var(--red-rgb),0.1)",
                border: "1px solid rgba(var(--red-rgb),0.25)",
                borderRadius: 8,
                fontSize: 12.5,
                color: "var(--red)",
                marginBottom: 12,
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                padding: "10px 12px",
                background: "rgba(var(--green-rgb),0.08)",
                border: "1px solid rgba(var(--green-rgb),0.25)",
                borderRadius: 8,
                fontSize: 12.5,
                color: "var(--green)",
                marginBottom: 12,
                lineHeight: 1.5,
              }}
            >
              {success}
            </div>
          )}

          {/* Primary CTA */}
          <button
            type="button"
            onClick={handle}
            disabled={!canSubmit}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: 11,
              fontSize: 13.5,
              fontWeight: 700,
              background: canSubmit ? "var(--accent)" : "rgba(var(--accent-rgb),0.22)",
              border: "none",
              color: canSubmit ? "#060c16" : "var(--text3)",
              cursor: canSubmit ? "pointer" : "default",
              transition: "filter 0.18s, transform 0.15s, box-shadow 0.18s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              letterSpacing: 0.3,
              boxShadow: canSubmit
                ? "0 4px 14px rgba(var(--accent-rgb),0.28)"
                : "none",
            }}
            onMouseEnter={(e) => {
              if (!canSubmit) return;
              e.currentTarget.style.filter = "brightness(1.08)";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(var(--accent-rgb),0.42)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "none";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = canSubmit
                ? "0 4px 14px rgba(var(--accent-rgb),0.28)"
                : "none";
            }}
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    border: "1.5px solid rgba(6,12,22,0.3)",
                    borderTopColor: "#060c16",
                    borderRadius: "50%",
                    animation: "auth-spin 0.8s linear infinite",
                  }}
                />
                Processing...
              </>
            ) : (
              ctaLabel
            )}
          </button>

          {/* Magic link button (secondary, login mode only, before magic sent) */}
          {mode === "login" && !magicSent && isSupabaseConfigured && (
            <button
              type="button"
              onClick={() => switchMode("magic")}
              style={{
                width: "100%",
                marginTop: 10,
                padding: "11px",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 10,
                fontSize: 13,
                color: "var(--text3)",
                cursor: "pointer",
                transition: "border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border2)";
                e.currentTarget.style.color = "var(--text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text3)";
              }}
            >
              Sign in with magic link instead
            </button>
          )}

          {/* Already have an account? (signup only) */}
          {mode === "signup" && (
            <p
              style={{
                marginTop: 14,
                textAlign: "center",
                fontSize: 12,
                color: "var(--text3)",
              }}
            >
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontSize: 12,
                  textDecoration: "underline",
                }}
              >
                Log in
              </button>
            </p>
          )}

          {/* Back to log in (magic / reset) */}
          {(mode === "magic" || mode === "reset") && (
            <button
              type="button"
              onClick={() => switchMode("login")}
              style={{
                width: "100%",
                marginTop: 10,
                padding: "11px",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 10,
                fontSize: 13,
                color: "var(--text3)",
                cursor: "pointer",
                transition: "border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border2)";
                e.currentTarget.style.color = "var(--text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text3)";
              }}
            >
              Back to log in
            </button>
          )}

          {/* Terms */}
          <p
            style={{
              marginTop: 20,
              fontSize: 11.5,
              color: "var(--text-muted)",
              lineHeight: 1.55,
              textAlign: "center",
            }}
          >
            By continuing you agree to the{" "}
            <Link href="/terms" style={{ color: "var(--text2)" }}>
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" style={{ color: "var(--text2)" }}>
              Privacy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export — Suspense required for useSearchParams
// ---------------------------------------------------------------------------
export default function AuthPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)" }} />}>
      <AuthForm />
    </Suspense>
  );
}
