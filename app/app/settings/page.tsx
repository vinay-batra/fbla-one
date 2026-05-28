"use client";

import { useEffect, useRef, useState } from "react";
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
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) return;
    supa.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setEmail(data.user.email ?? null);
      setUserId(data.user.id);
      const { data: p } = await supa.from("profiles").select("display_name,avatar_url").eq("id", data.user.id).single();
      if (p) {
        setAvatarUrl(p.avatar_url ?? null);
        setDbName(p.display_name ?? null);
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
    if (!confirm("This permanently deletes your account and all your data. Are you sure?")) return;
    if (!confirm("Last chance — this cannot be undone.")) return;
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
          <div style={{ position: "relative", cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
            <Avatar url={avatarUrl} initials={initials} size={64} />
            <div style={{
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
          </div>
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
          onClick={deleteAccount}
          disabled={deleting || !userId}
          className="btn btn-danger btn-sm"
        >
          {deleting ? "Deleting..." : "Delete my account"}
        </button>
      </Card>
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
