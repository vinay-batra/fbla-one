"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { safeNextPath } from "@/lib/url";

type Mode = "login" | "signup" | "reset";

const COPY: Record<Mode, { title: string; sub: string; cta: string }> = {
  signup: { title: "Create your account", sub: "Free, and it takes a minute.", cta: "Create account" },
  login: { title: "Welcome back", sub: "Log in to keep practicing.", cta: "Log in" },
  reset: { title: "Reset your password", sub: "We will email you a link to set a new one.", cta: "Send reset link" },
};

/** Supabase's messages, in plain words. */
function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password do not match. Try again, or reset your password.";
  if (m.includes("already registered") || m.includes("already been registered")) return "There is already an account with this email. Log in instead.";
  if (m.includes("password should be at least") || m.includes("password is too short")) return "Use at least 8 characters for your password.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many tries in a row. Wait a minute and try again.";
  if (m.includes("unable to validate email") || m.includes("invalid email") || (m.includes("email address") && m.includes("invalid"))) {
    return "We could not send to that address. Check it and try again.";
  }
  if (m.includes("email not confirmed")) return "Confirm your email first. The link is in your inbox.";
  return message || "Something went wrong. Try again.";
}

/** A leftover preview cookie must never outlive signing in. */
function clearPreview() {
  document.cookie = "fbla_preview=; path=/; max-age=0";
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      {/* Google's brand colors: an intentional exception to the token rule. */}
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function AuthForm() {
  const searchParams = useSearchParams();
  // Origin-validated, backslash-safe same-origin redirect (a crafted
  // ?next=//evil.com or ?next=/\evil.com would otherwise redirect off-site).
  const nextPath = safeNextPath(searchParams.get("next"), "/app");

  const [sessionChecked, setSessionChecked] = useState(false);
  const [mode, setMode] = useState<Mode>(() => {
    const m = searchParams.get("mode");
    return m === "signup" || m === "reset" ? m : "login";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // "For advisors" links arrive with role=advisor so the choice is already made.
  const [role, setRole] = useState<"member" | "advisor">(searchParams.get("role") === "advisor" ? "advisor" : "member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "oauth_failed"
      ? "That sign-in link did not work or has expired. Try again."
      : null
  );
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);

  // Already signed in: go straight on.
  useEffect(() => {
    const supa = getSupabase();
    if (!supa) { setSessionChecked(true); return; }
    // getUser() asks Supabase, so a stale or revoked session cookie is caught
    // here. getSession() only reads the cookie: with a dead session it sent you
    // to /app, the server bounced you back to /auth, and the two looped.
    supa.auth.getUser().then(async ({ data: { user } }) => {
      if (user) { clearPreview(); window.location.replace(nextPath); return; }
      // Clear whatever dead session is left so the form starts clean.
      await supa.auth.signOut({ scope: "local" }).catch(() => {});
      setSessionChecked(true);
    }).catch(() => setSessionChecked(true));
  }, [nextPath]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setResetSentTo(null);
  };

  const handle = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    const supa = isSupabaseConfigured ? getSupabase() : null;
    if (!supa) {
      setError("Accounts are not available right now. Try again later.");
      setLoading(false);
      return;
    }

    try {
      if (mode === "login") {
        const { data, error } = await supa.auth.signInWithPassword({ email, password });
        if (error) throw error;
        clearPreview();
        // Advisors land on their chapter unless a link asked for somewhere else.
        let dest = nextPath;
        if (nextPath === "/app" && data.user) {
          const { data: prof } = await supa.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
          if (prof?.role === "advisor") dest = "/app/chapter";
        }
        // Full reload (not router.push) so the server sees the fresh session cookie.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = dest;
        return;
      }

      if (mode === "signup") {
        // Stash the chosen role so ensureProfile() sets it on the new profile.
        try { localStorage.setItem("fbla_pending_role", role); } catch {}
        const { data, error } = await supa.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        // Supabase answers a sign-up for an existing email with a user that
        // has no identities instead of an error.
        if (data.user && data.user.identities?.length === 0) {
          throw new Error("User already registered");
        }
        if (data.session) {
          clearPreview();
          let pendingJoin = false;
          try { pendingJoin = !!localStorage.getItem("fbla_pending_join"); } catch {}
          window.location.href = role === "advisor" || pendingJoin ? "/app/chapter" : nextPath;
          return;
        }
        // Email confirmation is on: there is no session until the link is clicked.
        setResetSentTo(email);
        return;
      }

      // reset
      const { error } = await supa.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      });
      if (error) throw error;
      setResetSentTo(email);
    } catch (err) {
      setError(friendly((err as { message?: string }).message ?? ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const supa = isSupabaseConfigured ? getSupabase() : null;
    if (!supa) { setError("Google sign-in is not available right now."); return; }
    // Google skips the email form, so carry the Student/Advisor choice the same
    // way email sign-up does, and send advisors to their chapter page.
    let next = nextPath;
    if (mode === "signup") {
      try { localStorage.setItem("fbla_pending_role", role); } catch {}
      if (role === "advisor") next = "/app/chapter";
    }
    const { error } = await supa.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) setError(friendly(error.message));
  };

  if (!sessionChecked) return <div className="au" />;

  // ── "Check your email" ───────────────────────────────────────
  if (resetSentTo) {
    const isReset = mode === "reset";
    return (
      <AuthFrame>
        <div className="au-sent" role="status">
          <div className="au-sent-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>
          </div>
          <h1 className="au-title">Check your email</h1>
          <p className="au-sub">
            We sent a link to <strong>{resetSentTo}</strong>.{" "}
            {isReset ? "Open it on this device to set a new password." : "Open it to finish creating your account."}
          </p>
          <p className="au-switch">
            Nothing after a few minutes? Check spam, or{" "}
            <button type="button" className="au-link" onClick={() => setResetSentTo(null)}>try again</button>.
          </p>
          <p className="au-switch" style={{ marginTop: 8 }}>
            <button type="button" className="au-link" onClick={() => switchMode("login")}>Back to log in</button>
          </p>
        </div>
      </AuthFrame>
    );
  }

  const copy = COPY[mode];

  return (
    <AuthFrame>
      <h1 className="au-title">{copy.title}</h1>
      <p className="au-sub">{copy.sub}</p>

      {mode === "signup" && (
        <div className="au-roles" role="group" aria-label="I am a">
          <button type="button" className="au-role" aria-pressed={role === "member"} onClick={() => setRole("member")}>
            I&apos;m a student
          </button>
          <button type="button" className="au-role" aria-pressed={role === "advisor"} onClick={() => setRole("advisor")}>
            I&apos;m an advisor
          </button>
        </div>
      )}

      {mode !== "reset" && (
        <>
          <button type="button" className="au-google" onClick={handleGoogle} disabled={loading}>
            <GoogleIcon />
            Continue with Google
          </button>
          <div className="au-or">or with email</div>
        </>
      )}

      {/* A real <form> so password managers pair the fields and Enter submits. */}
      <form
        onSubmit={(e) => { e.preventDefault(); void handle(); }}
        style={mode === "reset" ? { marginTop: 22 } : undefined}
      >
        <div className="au-field">
          <div className="au-label-row">
            <label htmlFor="auth-email" className="au-label">Email</label>
          </div>
          <input
            id="auth-email"
            className="au-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu"
            autoComplete="email"
          />
        </div>

        {mode !== "reset" && (
          <div className="au-field">
            <div className="au-label-row">
              <label htmlFor="auth-password" className="au-label">Password</label>
              {mode === "login" && (
                <button type="button" className="au-link" onClick={() => switchMode("reset")}>
                  Forgot password?
                </button>
              )}
            </div>
            <div className="au-input-wrap">
              <input
                id="auth-password"
                className="au-input"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                aria-describedby={mode === "signup" ? "auth-password-hint" : undefined}
              />
              <button
                type="button"
                className="au-show"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {mode === "signup" && <p id="auth-password-hint" className="au-hint">At least 8 characters.</p>}
          </div>
        )}

        {error && <div className="au-msg au-msg-error" role="alert">{error}</div>}

        <button type="submit" className="au-submit" disabled={loading}>
          {loading && <span className="au-spin" aria-hidden="true" />}
          {loading ? "One moment" : copy.cta}
        </button>
      </form>

      <p className="au-switch">
        {mode === "signup" ? (
          <>Already have an account? <button type="button" className="au-link" onClick={() => switchMode("login")}>Log in</button></>
        ) : mode === "login" ? (
          <>New here? <button type="button" className="au-link" onClick={() => switchMode("signup")}>Create an account</button></>
        ) : (
          <button type="button" className="au-link" onClick={() => switchMode("login")}>Back to log in</button>
        )}
      </p>

      {mode === "signup" && (
        <p className="au-terms">
          By creating an account you agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.
        </p>
      )}
    </AuthFrame>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="au" />}>
      <AuthForm />
    </Suspense>
  );
}
