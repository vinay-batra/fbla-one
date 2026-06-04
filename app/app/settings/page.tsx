"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/Card";
import { Avatar } from "@/components/UserMenu";
import { useTheme } from "@/components/ThemeProvider";
import { getSupabase } from "@/lib/supabase";
import { getDisplayName, setDisplayName, getChapterName, setChapterName, onStorageChange } from "@/lib/storage";

export default function Settings() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [tick, setTick] = useState(0);
  useEffect(() => onStorageChange(() => setTick((t) => t + 1)), []);
  void tick;

  const displayName = getDisplayName();
  const chapterName = getChapterName();
  const [nameDraft, setNameDraft] = useState(displayName);
  const [chapDraft, setChapDraft] = useState(chapterName);
  useEffect(() => setNameDraft(displayName), [displayName]);
  useEffect(() => setChapDraft(chapterName), [chapterName]);

  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [dbName, setDbName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [roleLabel, setRoleLabel] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Local preferences (work immediately, no server round-trip).
  const [deadlineAlerts, setDeadlineAlerts] = useState(true);
  const [defaultTestLen, setDefaultTestLen] = useState(10);
  useEffect(() => {
    try {
      setDeadlineAlerts(localStorage.getItem("fbla_deadline_alerts") !== "0");
      const n = Number(localStorage.getItem("fbla_default_test_len"));
      if ([10, 25, 50].includes(n)) setDefaultTestLen(n);
    } catch {}
  }, []);
  const toggleDeadlineAlerts = () => {
    setDeadlineAlerts((v) => {
      const next = !v;
      try { localStorage.setItem("fbla_deadline_alerts", next ? "1" : "0"); } catch {}
      return next;
    });
  };
  const pickTestLen = (n: number) => {
    setDefaultTestLen(n);
    try { localStorage.setItem("fbla_default_test_len", String(n)); } catch {}
  };
  const replayTour = () => {
    try {
      localStorage.removeItem("fbla_tour_done");
      localStorage.removeItem("fbla_onboarded");
    } catch {}
    router.push("/app?tour=1");
  };

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) return;
    supa.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setEmail(data.user.email ?? null);
      setUserId(data.user.id);
      const { data: p } = await supa.from("profiles").select("display_name,avatar_url,role").eq("id", data.user.id).single();
      if (p) {
        setAvatarUrl(p.avatar_url ?? null);
        setDbName(p.display_name ?? null);
        setRoleLabel(p.role ?? "member");
        if (p.display_name && !getDisplayName()) {
          setDisplayName(p.display_name);
          setNameDraft(p.display_name);
        }
      }
    });
  }, []);

  const uploadAvatar = async (file: File) => {
    const supa = getSupabase();
    if (!supa || !userId) return;
    setUploading(true);
    setMsg(null);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;
      const { error: upErr } = await supa.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supa.storage.from("avatars").getPublicUrl(path);
      const bust = `${publicUrl}?t=${Date.now()}`;
      await supa.from("profiles").update({ avatar_url: bust }).eq("id", userId);
      setAvatarUrl(bust);
      setMsg({ text: "Avatar updated.", ok: true });
    } catch (e) {
      const err = e as { message?: string };
      setMsg({ text: err.message || "Upload failed.", ok: false });
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    const supa = getSupabase();
    const name = nameDraft.trim();
    setDisplayName(name);
    setChapterName(chapDraft.trim());
    setSaving(true);
    setMsg(null);
    try {
      if (supa && userId) {
        await supa.from("profiles").update({ display_name: name }).eq("id", userId);
      }
      setDbName(name);
      setMsg({ text: "Saved.", ok: true });
    } catch {
      setMsg({ text: "Could not save to server.", ok: false });
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    setConfirmDelete(false);
    setDeleting(true);
    try {
      const res = await fetch("/api/delete-account", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      const supa = getSupabase();
      if (supa) await supa.auth.signOut();
      router.push("/");
    } catch {
      setMsg({ text: "Could not delete account. Email hello@fbla.one to request manual deletion.", ok: false });
      setDeleting(false);
    }
  };

  const initials = (dbName || nameDraft || email?.split("@")[0] || "?")[0]?.toUpperCase() ?? "?";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 760 }}>
      <div>
        <p className="eyebrow" style={{ marginBottom: 8 }}>Settings</p>
        <h1 style={{ fontSize: 28, letterSpacing: "-0.02em" }}>Your account</h1>
      </div>

      {/* Avatar */}
      <Card>
        <CardHeader eyebrow="Profile" title="Your identity" />
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || !userId}
            aria-label="Change profile photo"
            style={{ position: "relative", cursor: "pointer", border: "none", background: "none", padding: 0, borderRadius: "50%", display: "inline-flex" }}
          >
            <Avatar url={avatarUrl} initials={initials} size={64} />
            <div aria-hidden="true" style={{
              position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: 0, transition: "opacity 0.15s ease",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </button>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{dbName || nameDraft || "No name set"}</p>
            <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{email || "Preview mode"}</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || !userId}
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 8, fontSize: 12 }}
            >
              {uploading ? "Uploading..." : "Change photo"}
            </button>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.target.value = ""; }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <FieldLabel label="Display name" />
          <input type="text" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} className="input-field" placeholder="Your name" maxLength={60} />

          <FieldLabel label="Chapter" />
          <input type="text" value={chapDraft} onChange={(e) => setChapDraft(e.target.value)} className="input-field" placeholder="Council Rock South FBLA" maxLength={80} />

          <button
            type="button"
            onClick={saveProfile}
            disabled={saving}
            className="btn btn-accent btn-sm btn-pill cta-shimmer"
            style={{ alignSelf: "flex-start", marginTop: 4 }}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>

        {msg && (
          <p style={{ marginTop: 12, fontSize: 13, color: msg.ok ? "var(--green)" : "var(--red)" }}>
            {msg.text}
          </p>
        )}
      </Card>

      {/* Account */}
      <Card>
        <CardHeader eyebrow="Account" title="Sign-in details" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Row label="Email" value={email || "Preview mode"} />
          <Row
            label="Role"
            value={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 6, background: "var(--accent-dim)", color: "var(--accent-text)", border: "0.5px solid var(--accent-border)" }}>
                  {roleLabel === "advisor" ? "Advisor" : roleLabel ? "Student" : "Student"}
                </span>
              </span>
            }
          />
        </div>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader eyebrow="Preferences" title="How FBLA One works for you" />
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, cursor: "pointer" }}>
            <span>
              <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Deadline reminders</span>
              <span style={{ display: "block", fontSize: 12, color: "var(--text3)", marginTop: 2 }}>Show an in-app alert when a deadline is within 3 days.</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={deadlineAlerts}
              onClick={toggleDeadlineAlerts}
              style={{
                flexShrink: 0, width: 44, height: 26, borderRadius: 999,
                background: deadlineAlerts ? "var(--accent)" : "var(--bg3)",
                border: "0.5px solid var(--border2)", position: "relative", transition: "background 0.18s", cursor: "pointer",
              }}
            >
              <span style={{ position: "absolute", top: 2.5, left: deadlineAlerts ? 21 : 2.5, width: 20, height: 20, borderRadius: "50%", background: "var(--toggle-knob)", boxShadow: "var(--toggle-knob-shadow)", transition: "left 0.18s" }} />
            </button>
          </label>

          <div style={{ borderTop: "0.5px solid var(--border)", paddingTop: 18 }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Default practice length</span>
            <span style={{ display: "block", fontSize: 12, color: "var(--text3)", marginTop: 2, marginBottom: 10 }}>Pre-selected when you open the practice generator.</span>
            <div style={{ display: "flex", gap: 8 }}>
              {[10, 25, 50].map((n) => (
                <button key={n} type="button" onClick={() => pickTestLen(n)} style={{
                  padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                  border: defaultTestLen === n ? "1px solid var(--accent)" : "0.5px solid var(--border2)",
                  background: defaultTestLen === n ? "var(--accent-dim)" : "var(--bg2)",
                  color: defaultTestLen === n ? "var(--accent)" : "var(--text2)", cursor: "pointer", transition: "all 0.15s",
                }}>{n}</button>
              ))}
            </div>
          </div>

          <div style={{ borderTop: "0.5px solid var(--border)", paddingTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <span>
              <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Welcome tour</span>
              <span style={{ display: "block", fontSize: 12, color: "var(--text3)", marginTop: 2 }}>Replay the quick tour of the app.</span>
            </span>
            <button type="button" onClick={replayTour} className="btn btn-ghost btn-sm btn-pill">Replay tour</button>
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader eyebrow="Appearance" title="Theme" />
        <div style={{ display: "flex", gap: 10 }}>
          {(["light", "dark"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTheme(t)} style={{
              padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
              border: theme === t ? "1px solid var(--accent)" : "0.5px solid var(--border2)",
              background: theme === t ? "var(--accent-dim)" : "var(--bg2)",
              color: theme === t ? "var(--accent)" : "var(--text2)",
              cursor: "pointer", transition: "all 0.15s ease", textTransform: "capitalize",
            }}>
              {t}
            </button>
          ))}
        </div>
      </Card>

      {/* Danger */}
      <Card>
        <CardHeader eyebrow="Danger zone" title="Delete account" />
        <p style={{ fontSize: 13.5, color: "var(--text3)", marginBottom: 16, lineHeight: 1.55 }}>
          Permanently deletes your account, competition registrations, practice logs, and saved resources. This cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          disabled={deleting || !userId}
          className="btn btn-danger btn-sm"
        >
          {deleting ? "Deleting..." : "Delete my account"}
        </button>
      </Card>

      {confirmDelete && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(false); }}
          style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="del-title" style={{ width: "min(400px,100%)", background: "var(--card-bg)", border: "0.5px solid var(--border2)", borderRadius: 16, boxShadow: "var(--shadow-lg)", padding: "24px 24px 20px", animation: "fadeUp 0.18s ease" }}>
            <h2 id="del-title" style={{ fontSize: 18, letterSpacing: "-0.01em", marginBottom: 6, color: "var(--red)" }}>Delete your account?</h2>
            <p style={{ fontSize: 13.5, color: "var(--text3)", lineHeight: 1.6, marginBottom: 20 }}>
              This permanently deletes your account, your event, practice logs, and saved resources. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setConfirmDelete(false)} className="btn btn-ghost btn-pill btn-sm">Cancel</button>
              <button type="button" onClick={deleteAccount} className="btn btn-pill btn-sm" style={{ background: "var(--red)", color: "#fff" }}>Delete forever</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <span style={{ fontSize: 13, color: "var(--text3)" }}>{label}</span>
      <span style={{ fontSize: 13.5, color: "var(--text)", fontWeight: 500, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <label className="font-mono" style={{ display: "block", fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: -6 }}>
      {label}
    </label>
  );
}
