"use client";

import Link from "next/link";
import { Card, CardHeader } from "@/components/Card";
import type { ChapterController } from "./useChapterData";

// Chapter setup: create / join cards (signed in, no chapter yet) and the
// signed-out nudge. Extracted from app/app/chapter/page.tsx (issue #47).

export function ChapterSetup({ c }: { c: ChapterController }) {
  return (
    <>
      {/* ── CHAPTER SETUP (signed in, no chapter yet) ── */}
      {c.isSupabaseConfigured && c.signedIn && !c.supaLoading && !c.hasChapter && (
        <div className="chapter-setup-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {/* Create */}
          <Card>
            <CardHeader eyebrow="Start fresh" title="Create a chapter" tagline="You'll be the advisor. Share the invite code with your members." />
            <form onSubmit={c.handleCreateChapter} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
              <label className="font-mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Chapter name
              </label>
              <input
                type="text"
                value={c.createName}
                onChange={(e) => c.setCreateName(e.target.value)}
                placeholder="e.g. Council Rock South FBLA"
                className="input-field"
                required
              />
              {c.createError && <p style={{ fontSize: 12, color: "var(--red)" }}>{c.createError}</p>}
              <button type="submit" className="btn btn-accent btn-sm btn-pill" style={{ alignSelf: "flex-start" }} disabled={c.createLoading}>
                {c.createLoading ? "Creating..." : "Create chapter"}
              </button>
            </form>
          </Card>

          {/* Join */}
          <Card>
            <CardHeader eyebrow="Already have one" title="Join a chapter" tagline="Ask your advisor for the invite code, then enter it below." />
            <form onSubmit={c.handleJoinChapter} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
              <label className="font-mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Invite code
              </label>
              <input
                type="text"
                value={c.joinCode}
                onChange={(e) => c.setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. A4K9P"
                className="input-field"
                style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.12em" }}
                required
              />
              {c.joinError && <p style={{ fontSize: 12, color: "var(--red)" }}>{c.joinError}</p>}
              <button type="submit" className="btn btn-brand btn-sm btn-pill" style={{ alignSelf: "flex-start" }} disabled={c.joinLoading}>
                {c.joinLoading ? "Joining..." : "Join chapter"}
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* Not signed in nudge */}
      {c.isSupabaseConfigured && !c.signedIn && !c.supaLoading && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "4px 0" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>Sign in to use chapter features</p>
              <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                Create or join a chapter to unlock the advisor dashboard and shared deadlines.{" "}
                <Link href="/auth" style={{ color: "var(--accent-text)" }}>Sign in</Link>
              </p>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
