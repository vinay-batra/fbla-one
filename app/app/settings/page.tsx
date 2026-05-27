"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/Card";
import { useTheme } from "@/components/ThemeProvider";
import { getSupabase } from "@/lib/supabase";
import {
  getDisplayName,
  setDisplayName,
  getChapterName,
  setChapterName,
  onStorageChange,
} from "@/lib/storage";

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
  useEffect(() => {
    const supa = getSupabase();
    if (!supa) return;
    supa.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const signOut = async () => {
    const supa = getSupabase();
    if (supa) await supa.auth.signOut();
    router.push("/");
  };

  const clearLocalData = () => {
    if (!confirm("Clear all locally-stored prep data? This deletes practice logs, saved resources, and registered competitions on this device.")) return;
    ["fbla_registered_competitions", "fbla_practice_logs", "fbla_saved_resources", "fbla_display_name", "fbla_chapter_name"].forEach((k) => {
      try { window.localStorage.removeItem(k); } catch { /* ignore */ }
    });
    window.dispatchEvent(new CustomEvent("fbla:storage-change", { detail: { key: "*" } }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 760 }}>
      <div>
        <p className="eyebrow" style={{ marginBottom: 8 }}>Settings</p>
        <h1 style={{ fontSize: 28, letterSpacing: "-0.02em" }}>Your account</h1>
      </div>

      <Card>
        <CardHeader eyebrow="Profile" title="How you appear" />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setDisplayName(nameDraft.trim());
            setChapterName(chapDraft.trim());
          }}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <FieldLabel label="Display name" />
          <input
            type="text"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            className="input-field"
            placeholder="Vinay"
            maxLength={60}
          />

          <FieldLabel label="Chapter" />
          <input
            type="text"
            value={chapDraft}
            onChange={(e) => setChapDraft(e.target.value)}
            className="input-field"
            placeholder="Council Rock South FBLA"
            maxLength={80}
          />

          <button type="submit" className="btn btn-accent btn-sm btn-pill" style={{ alignSelf: "flex-start", marginTop: 4 }}>
            Save changes
          </button>
        </form>
      </Card>

      <Card>
        <CardHeader eyebrow="Appearance" title="Theme" />
        <div style={{ display: "flex", gap: 10 }}>
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                border: theme === t ? "1px solid var(--accent)" : "0.5px solid var(--border2)",
                background: theme === t ? "var(--accent-dim)" : "var(--bg2)",
                color: theme === t ? "var(--accent)" : "var(--text2)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                textTransform: "capitalize",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader eyebrow="Account" title={email ? "Signed in" : "Not signed in"} />
        {email ? (
          <>
            <p style={{ fontSize: 14, color: "var(--text2)" }}>
              You're signed in as <strong style={{ color: "var(--text)" }}>{email}</strong>.
            </p>
            <button type="button" onClick={signOut} className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>
              Sign out
            </button>
          </>
        ) : (
          <p style={{ fontSize: 14, color: "var(--text2)" }}>
            You're running in preview mode (no Supabase auth). Local data persists in this browser only.
          </p>
        )}
      </Card>

      <Card>
        <CardHeader eyebrow="Danger zone" title="Reset local data" />
        <p style={{ fontSize: 13.5, color: "var(--text3)", marginBottom: 12, lineHeight: 1.55 }}>
          Clears practice logs, saved resources, registered competitions, and profile fields stored in this browser.
          Doesn't delete server-side data when Supabase is connected.
        </p>
        <button type="button" onClick={clearLocalData} className="btn btn-danger btn-sm">
          Clear local data
        </button>
      </Card>
    </div>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <label
      className="font-mono"
      style={{
        display: "block",
        fontSize: 9,
        letterSpacing: "0.18em",
        color: "var(--text-muted)",
        textTransform: "uppercase",
        fontWeight: 700,
        marginBottom: -6,
      }}
    >
      {label}
    </label>
  );
}
