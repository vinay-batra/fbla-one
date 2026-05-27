"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { HeroBadge } from "@/components/HeroBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

type Mode = "signin" | "signup" | "magic";

const MODE_LABEL: Record<Mode, { title: string; tagline: string; cta: string }> = {
  signin: { title: "Welcome back.", tagline: "Sign in to track your prep and access your chapter.", cta: "Sign in" },
  signup: { title: "Get started.", tagline: "Free for FBLA students. Start tracking your prep in a minute.", cta: "Create account" },
  magic:  { title: "Magic link sign-in.", tagline: "We email you a sign-in link. No password to remember.", cta: "Send magic link" },
};

export default function Auth() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!isSupabaseConfigured) {
      setError("Auth is not yet configured. Browse competitions or try the dashboard in preview mode.");
      return;
    }
    const supa = getSupabase();
    if (!supa) {
      setError("Auth client unavailable. Refresh the page.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supa.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/app");
      } else if (mode === "signup") {
        const { error } = await supa.auth.signUp({ email, password });
        if (error) throw error;
        setInfo("Check your inbox to confirm your email, then sign in.");
      } else {
        const { error } = await supa.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/app` } });
        if (error) throw error;
        setInfo("Sign-in link sent. Check your inbox.");
      }
    } catch (err) {
      const e = err as { message?: string };
      setError(e.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const oauth = async (provider: "google" | "github") => {
    if (!isSupabaseConfigured) {
      setError("OAuth is not yet configured.");
      return;
    }
    const supa = getSupabase();
    if (!supa) return;
    setLoading(true);
    try {
      const { error } = await supa.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err) {
      const e = err as { message?: string };
      setError(e.message || "OAuth failed. Try again.");
      setLoading(false);
    }
  };

  const m = MODE_LABEL[mode];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
      }}
    >
      {/* Minimal top bar */}
      <div
        style={{
          padding: "20px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        <Logo size="md" />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link
            href="/"
            style={{
              fontSize: 13,
              color: "var(--text2)",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text2)")}
          >
            ← Back to home
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 24px",
          position: "relative",
          background: `
            radial-gradient(50% 60% at 15% 30%, rgba(var(--brand-rgb), 0.22) 0%, rgba(var(--brand-rgb), 0.06) 38%, transparent 68%),
            radial-gradient(45% 55% at 88% 78%, rgba(var(--accent-rgb), 0.18) 0%, rgba(var(--accent-rgb), 0.05) 40%, transparent 70%)
          `,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 460,
            background: "var(--card-bg)",
            border: "0.5px solid var(--border)",
            borderRadius: 18,
            padding: "44px 38px",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {!isSupabaseConfigured && (
            <div
              style={{
                marginBottom: 24,
                padding: "12px 14px",
                background: "var(--accent-dim)",
                border: "0.5px solid var(--accent-border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--accent)",
                fontWeight: 600,
                lineHeight: 1.55,
              }}
            >
              Preview mode. Auth isn't wired to Supabase yet — explore the dashboard at{" "}
              <Link href="/app" style={{ textDecoration: "underline" }}>/app</Link>.
            </div>
          )}

          <HeroBadge>{mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Magic link"}</HeroBadge>
          <h1 style={{ marginTop: 14, fontSize: 28, letterSpacing: "-0.02em", marginBottom: 6 }}>{m.title}</h1>
          <p style={{ fontSize: 14, color: "var(--text3)", lineHeight: 1.5 }}>{m.tagline}</p>

          {/* Mode tabs */}
          <div
            style={{
              marginTop: 24,
              padding: 4,
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 4,
              background: "var(--bg3)",
              borderRadius: 10,
            }}
          >
            {(["signin", "signup", "magic"] as Mode[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setMode(tab); setError(null); setInfo(null); }}
                style={{
                  padding: "8px 12px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  borderRadius: 8,
                  background: mode === tab ? "var(--card-bg)" : "transparent",
                  color: mode === tab ? "var(--text)" : "var(--text2)",
                  border: mode === tab ? "0.5px solid var(--border2)" : "0.5px solid transparent",
                  transition: "all 0.15s ease",
                }}
              >
                {tab === "magic" ? "Magic link" : tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* OAuth */}
          {isSupabaseConfigured && (
            <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <OAuthButton onClick={() => oauth("google")} disabled={loading} label="Google">
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#fbbc05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" />
                  <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </OAuthButton>
              <OAuthButton onClick={() => oauth("github")} disabled={loading} label="GitHub">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18.92-.26 1.91-.39 2.89-.4.98 0 1.97.13 2.89.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.14v3.18c0 .31.21.66.79.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
                </svg>
                GitHub
              </OAuthButton>
            </div>
          )}

          {isSupabaseConfigured && (
            <div style={{ position: "relative", margin: "24px 0", textAlign: "center" }}>
              <span style={{ position: "absolute", inset: 0, top: "50%", height: 1, background: "var(--border)" }} />
              <span
                className="font-mono"
                style={{
                  position: "relative",
                  background: "var(--card-bg)",
                  padding: "0 10px",
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--text3)",
                }}
              >
                or
              </span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              className="input-field"
              autoComplete="email"
            />
            {mode !== "magic" && (
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="input-field"
                minLength={8}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className={`btn btn-accent btn-lg cta-shimmer ${loading ? "btn-loading" : ""}`}
              style={{ marginTop: 6 }}
            >
              <span className="btn-text">{m.cta}</span>
            </button>

            {error && (
              <p style={{ fontSize: 13, color: "var(--red)", marginTop: 4, lineHeight: 1.5 }}>{error}</p>
            )}
            {info && (
              <p style={{ fontSize: 13, color: "var(--green)", marginTop: 4, lineHeight: 1.5 }}>{info}</p>
            )}
          </form>

          <p style={{ marginTop: 24, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55, textAlign: "center" }}>
            By continuing you agree to the{" "}
            <Link href="/terms" className="animated-link" style={{ color: "var(--text2)" }}>Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="animated-link" style={{ color: "var(--text2)" }}>Privacy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

function OAuthButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Continue with ${label}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "10px 14px",
        borderRadius: 8,
        border: "0.5px solid var(--border2)",
        background: "var(--bg2)",
        color: "var(--text)",
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = "var(--bg3)";
        e.currentTarget.style.borderColor = "var(--accent-border)";
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = "var(--bg2)";
        e.currentTarget.style.borderColor = "var(--border2)";
      }}
    >
      {children}
    </button>
  );
}
