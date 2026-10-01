"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { getSupabase } from "@/lib/supabase";

/**
 * Step two of "Forgot password?": the reset email links to
 * /auth/callback?next=/auth/update-password, the callback trades the code for
 * a session, and this page sets the new password on that session.
 */
export default function UpdatePasswordPage() {
  const [state, setState] = useState<"checking" | "ready" | "expired">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) { setState("expired"); return; }
    supa.auth.getSession()
      .then(({ data }) => setState(data.session ? "ready" : "expired"))
      .catch(() => setState("expired"));
  }, []);

  const save = async () => {
    if (loading) return;
    setError(null);
    if (password.length < 8) { setError("Use at least 8 characters."); return; }
    if (password !== confirm) { setError("The two passwords do not match."); return; }
    const supa = getSupabase();
    if (!supa) return;
    setLoading(true);
    const { error } = await supa.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(
        /different from the old/i.test(error.message)
          ? "Pick a password you have not used here before."
          : error.message || "Something went wrong. Try again."
      );
      return;
    }
    document.cookie = "fbla_preview=; path=/; max-age=0";
    // Full reload so the server renders the app with the session cookie.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/app";
  };

  if (state === "checking") return <div className="au" />;

  if (state === "expired") {
    return (
      <AuthFrame>
        <h1 className="au-title">This link has expired</h1>
        <p className="au-sub">Reset links work once, for a limited time, on the device that asked for them.</p>
        <Link href="/auth?mode=reset" className="au-submit" style={{ textDecoration: "none" }}>
          Send a new link
        </Link>
        <p className="au-switch">
          <Link href="/auth" className="au-link">Back to log in</Link>
        </p>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame>
      <h1 className="au-title">Set a new password</h1>
      <p className="au-sub">Then you are straight back to practicing.</p>
      <form onSubmit={(e) => { e.preventDefault(); void save(); }} style={{ marginTop: 22 }}>
        <div className="au-field">
          <div className="au-label-row">
            <label htmlFor="new-password" className="au-label">New password</label>
          </div>
          <div className="au-input-wrap">
            <input
              id="new-password"
              className="au-input"
              type={show ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="new-password-hint"
            />
            <button type="button" className="au-show" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
          <p id="new-password-hint" className="au-hint">At least 8 characters.</p>
        </div>
        <div className="au-field">
          <div className="au-label-row">
            <label htmlFor="confirm-password" className="au-label">Type it again</label>
          </div>
          <input
            id="confirm-password"
            className="au-input"
            type={show ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {error && <div className="au-msg au-msg-error" role="alert">{error}</div>}
        <button type="submit" className="au-submit" disabled={loading}>
          {loading && <span className="au-spin" aria-hidden="true" />}
          {loading ? "Saving" : "Save and continue"}
        </button>
      </form>
    </AuthFrame>
  );
}
