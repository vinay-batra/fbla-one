"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/Card";
import { HeroBadge } from "@/components/HeroBadge";
import {
  onStorageChange,
  getDeadlines,
  addDeadline,
  removeDeadline,
  getRegistered,
  type Deadline,
} from "@/lib/storage";
import { getCompetition } from "@/lib/competitions";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  getMyProfile,
  createChapter,
  joinChapter,
  getChapterById,
  getChapterMembers,
  getChapterActivity,
  type ChapterProfile,
  type ChapterInfo,
  type MemberRow,
  type ActivityItem,
} from "@/lib/chapter";
import { FORMAT_LABEL } from "@/lib/competitions";

// ── Helpers ────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m - 1]} ${d}, ${y}`;
}

function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function memberName(m: MemberRow): string {
  return m.display_name?.trim() || m.email?.split("@")[0] || "Anonymous";
}

function relativeTime(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function exportSignupsCSV(members: MemberRow[], chapterName: string) {
  const headers = ["Member Name", "Email", "Competition", "Category", "Format"];
  const rows: string[][] = [];
  for (const m of members) {
    for (const slug of m.registrations) {
      const comp = getCompetition(slug);
      rows.push([
        memberName(m),
        m.email ?? "",
        comp?.name ?? slug,
        comp?.category ?? "",
        comp ? FORMAT_LABEL[comp.format] : "",
      ]);
    }
  }
  if (rows.length === 0) {
    for (const m of members) rows.push([memberName(m), m.email ?? "", "", "", ""]);
  }
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${chapterName.replace(/\s+/g, "-").toLowerCase()}-signups-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportRosterCSV(members: MemberRow[], chapterName: string) {
  const headers = ["Name", "Email", "Role", "Events Count", "Registered Events"];
  const rows = members.map((m) => [
    memberName(m),
    m.email ?? "",
    m.role,
    String(m.registrations.length),
    m.registrations.map((slug) => getCompetition(slug)?.name ?? slug).join("; "),
  ]);
  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${chapterName.replace(/\s+/g, "-").toLowerCase()}-roster-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function roleBadgeStyle(role: string): React.CSSProperties {
  if (role === "advisor") return { background: "var(--accent-dim)", color: "var(--accent)" };
  if (role === "officer") return { background: "var(--brand-dim)", color: "var(--brand)" };
  return { background: "var(--bg3)", color: "var(--text3)" };
}

// ── Component ──────────────────────────────────────────────────

export default function ChapterPage() {
  // localStorage reactive tick
  const [tick, setTick] = useState(0);
  useEffect(() => onStorageChange(() => setTick((t) => t + 1)), []);
  void tick;

  // ── Supabase state ──────────────────────────────────────────
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ChapterProfile | null>(null);
  const [chapter, setChapter] = useState<ChapterInfo | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [supaLoading, setSupaLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Chapter setup forms
  const [createName, setCreateName] = useState("");
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  // Deadline form
  const [showDlForm, setShowDlForm] = useState(false);
  const [dlTitle, setDlTitle] = useState("");
  const [dlDate, setDlDate] = useState("");
  const [dlSlug, setDlSlug] = useState("");
  const [dlNote, setDlNote] = useState("");

  const deadlines = getDeadlines().sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const registered = getRegistered();

  // ── Load Supabase data ──────────────────────────────────────
  const loadChapterData = useCallback(async (uid: string) => {
    const prof = await getMyProfile(uid);
    setProfile(prof);
    if (prof?.chapter_id) {
      const ch = await getChapterById(prof.chapter_id);
      setChapter(ch);
      if (prof.role === "advisor" && ch) {
        const [m, act] = await Promise.all([
          getChapterMembers(ch.id),
          getChapterActivity(ch.id),
        ]);
        setMembers(m);
        setActivity(act);
      }
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) { setSupaLoading(false); return; }
    const supa = getSupabase();
    if (!supa) { setSupaLoading(false); return; }

    supa.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setSupaLoading(false); return; }
      setUserId(data.user.id);
      await loadChapterData(data.user.id);
      setSupaLoading(false);
    });
  }, [loadChapterData]);

  // ── Handlers ────────────────────────────────────────────────
  async function handleCreateChapter(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !createName.trim()) return;
    setCreateLoading(true);
    setCreateError("");
    const result = await createChapter(userId, createName.trim());
    setCreateLoading(false);
    if (result.error) {
      setCreateError(result.error);
    } else if (result.data) {
      setChapter(result.data);
      setProfile((p) => p ? { ...p, chapter_id: result.data!.id, role: "advisor" } : p);
    }
  }

  async function handleJoinChapter(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !joinCode.trim()) return;
    setJoinLoading(true);
    setJoinError("");
    const result = await joinChapter(userId, joinCode.trim());
    setJoinLoading(false);
    if (result.error) {
      setJoinError(result.error);
    } else if (result.data) {
      setChapter(result.data);
      setProfile((p) => p ? { ...p, chapter_id: result.data!.id, role: "member" } : p);
    }
  }

  function copyInviteCode() {
    if (!chapter) return;
    navigator.clipboard.writeText(chapter.invite_code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  }

  function submitDeadline(e: React.FormEvent) {
    e.preventDefault();
    if (!dlTitle.trim() || !dlDate) return;
    addDeadline({ title: dlTitle.trim(), dueAt: dlDate, competitionSlug: dlSlug || null, note: dlNote.trim() || null });
    setDlTitle(""); setDlDate(""); setDlSlug(""); setDlNote("");
    setShowDlForm(false);
  }

  // ── Derived ─────────────────────────────────────────────────
  const isAdvisor = profile?.role === "advisor";
  const hasChapter = Boolean(profile?.chapter_id && chapter);
  const signedIn = Boolean(userId);

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1240 }}>

      {/* Page header */}
      <div>
        <p className="eyebrow" style={{ marginBottom: 8 }}>Chapter</p>
        <h1 style={{ fontSize: 28, letterSpacing: "-0.02em" }}>
          {chapter?.name || (hasChapter ? "Your chapter" : "Chapter")}
        </h1>
        <p style={{ fontSize: 14, color: "var(--text3)", marginTop: 6 }}>
          {isAdvisor
            ? "Manage your chapter roster, track deadlines, and see every member's events."
            : "Track your competition deadlines and see your registered events."}
        </p>
      </div>

      {/* ── CHAPTER SETUP (signed in, no chapter yet) ── */}
      {isSupabaseConfigured && signedIn && !supaLoading && !hasChapter && (
        <div className="chapter-setup-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {/* Create */}
          <Card>
            <CardHeader eyebrow="Start fresh" title="Create a chapter" tagline="You'll be the advisor. Share the invite code with your members." />
            <form onSubmit={handleCreateChapter} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
              <label className="font-mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Chapter name
              </label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Council Rock South FBLA"
                className="input-field"
                required
              />
              {createError && <p style={{ fontSize: 12, color: "var(--red)" }}>{createError}</p>}
              <button type="submit" className="btn btn-accent btn-sm btn-pill" style={{ alignSelf: "flex-start" }} disabled={createLoading}>
                {createLoading ? "Creating..." : "Create chapter"}
              </button>
            </form>
          </Card>

          {/* Join */}
          <Card>
            <CardHeader eyebrow="Already have one" title="Join a chapter" tagline="Ask your advisor for the invite code, then enter it below." />
            <form onSubmit={handleJoinChapter} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
              <label className="font-mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Invite code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. A4K9P"
                className="input-field"
                style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.12em" }}
                required
              />
              {joinError && <p style={{ fontSize: 12, color: "var(--red)" }}>{joinError}</p>}
              <button type="submit" className="btn btn-brand btn-sm btn-pill" style={{ alignSelf: "flex-start" }} disabled={joinLoading}>
                {joinLoading ? "Joining..." : "Join chapter"}
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* Not signed in nudge */}
      {isSupabaseConfigured && !signedIn && !supaLoading && (
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
                <Link href="/auth" style={{ color: "var(--accent)" }}>Sign in</Link>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── CHAPTER INFO (has a chapter) ── */}
      {hasChapter && chapter && (
        <Card>
          <CardHeader
            eyebrow={isAdvisor ? "Advisor" : "Member"}
            title={chapter.name}
            tagline={isAdvisor ? `${members.length} member${members.length !== 1 ? "s" : ""} in your chapter` : "You are a member of this chapter."}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                background: "var(--bg2)",
                borderRadius: 8,
                border: "0.5px solid var(--border)",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--text3)" }}>Invite code</span>
              <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.12em", color: "var(--text)" }}>
                {chapter.invite_code}
              </span>
              <button
                type="button"
                onClick={copyInviteCode}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: copiedCode ? "var(--green)" : "var(--text3)",
                  padding: "2px 4px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  transition: "color 0.15s",
                }}
              >
                {copiedCode ? "Copied!" : "Copy"}
              </button>
            </div>
            <span
              className="font-mono"
              style={{
                fontSize: 10,
                padding: "4px 10px",
                borderRadius: 999,
                fontWeight: 700,
                ...roleBadgeStyle(profile?.role ?? "member"),
              }}
            >
              {profile?.role ?? "member"}
            </span>
            {isAdvisor && (
              <button
                type="button"
                onClick={() => {
                  const subj = encodeURIComponent(`Join ${chapter?.name ?? "our chapter"} on FBLA One`);
                  const body = encodeURIComponent(
                    `Hi!\n\nJoin our FBLA chapter on FBLA One to track your competition prep, access study guides for all 55 events, and generate AI practice tests.\n\nInvite code: ${chapter?.invite_code}\n\nGo to https://fbla.one/app, click "Chapter" in the sidebar, and enter the code under "Join a chapter."\n\nSee you there!`
                  );
                  window.open(`mailto:?subject=${subj}&body=${body}`, "_blank");
                }}
                className="btn btn-ghost btn-sm"
                style={{ gap: 6, display: "flex", alignItems: "center" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <path d="M22 6l-10 7L2 6" />
                </svg>
                Email invite
              </button>
            )}
          </div>
        </Card>
      )}

      {/* ── ADVISOR DASHBOARD ── */}
      {isAdvisor && hasChapter && (
        <Card>
          <CardHeader
            eyebrow="Advisor view"
            title="Member roster"
            tagline="Every member in your chapter and the events they are prepping for."
            right={
              members.length > 0 ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => exportSignupsCSV(members, chapter?.name ?? "chapter")}
                    className="btn btn-ghost btn-sm"
                    style={{ gap: 6, display: "flex", alignItems: "center" }}
                    title="One row per member per event - for regional sign-up forms"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <path d="M7 10l5 5 5-5" />
                      <path d="M12 15V3" />
                    </svg>
                    Sign-ups CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => exportRosterCSV(members, chapter?.name ?? "chapter")}
                    className="btn btn-ghost btn-sm"
                    style={{ gap: 6, display: "flex", alignItems: "center" }}
                    title="Full member roster"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <path d="M7 10l5 5 5-5" />
                      <path d="M12 15V3" />
                    </svg>
                    Roster CSV
                  </button>
                </div>
              ) : undefined
            }
          />
          {members.length === 0 ? (
            <div className="empty-state" style={{ marginTop: 12 }}>
              <div className="empty-state-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <p className="empty-state-title">No members yet</p>
              <p className="empty-state-msg">
                Share the invite code <strong>{chapter?.invite_code}</strong> with your chapter members so they can join.
              </p>
            </div>
          ) : (
            <div style={{ marginTop: 16, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["Member", "Role", "Events", "Registered for"].map((h) => (
                      <th
                        key={h}
                        className="font-mono"
                        style={{
                          textAlign: "left",
                          padding: "8px 12px",
                          fontSize: 9,
                          letterSpacing: "0.16em",
                          textTransform: "uppercase",
                          color: "var(--text-muted)",
                          borderBottom: "0.5px solid var(--border)",
                          fontWeight: 700,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, i) => (
                    <tr
                      key={m.id}
                      style={{ background: i % 2 === 0 ? "transparent" : "var(--bg2)" }}
                    >
                      <td style={{ padding: "12px 12px", verticalAlign: "top" }}>
                        <p style={{ fontWeight: 600, color: "var(--text)" }}>{memberName(m)}</p>
                        {m.email && <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{m.email}</p>}
                      </td>
                      <td style={{ padding: "12px 12px", verticalAlign: "top" }}>
                        <span
                          className="font-mono"
                          style={{
                            fontSize: 9,
                            padding: "3px 8px",
                            borderRadius: 999,
                            fontWeight: 700,
                            ...roleBadgeStyle(m.role),
                          }}
                        >
                          {m.role}
                        </span>
                      </td>
                      <td style={{ padding: "12px 12px", verticalAlign: "top" }}>
                        <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: m.registrations.length > 0 ? "var(--text)" : "var(--text-muted)" }}>
                          {m.registrations.length}
                        </span>
                      </td>
                      <td style={{ padding: "12px 12px", verticalAlign: "top", maxWidth: 340 }}>
                        {m.registrations.length === 0 ? (
                          <span style={{ fontSize: 11, color: "var(--text3)" }}>None yet</span>
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {m.registrations.slice(0, 4).map((slug) => {
                              const comp = getCompetition(slug);
                              return (
                                <span key={slug} className="chip" style={{ fontSize: 10, padding: "2px 8px" }}>
                                  {comp?.name ?? slug}
                                </span>
                              );
                            })}
                            {m.registrations.length > 4 && (
                              <span className="chip" style={{ fontSize: 10, padding: "2px 8px", color: "var(--text3)" }}>
                                +{m.registrations.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── CHAPTER ACTIVITY FEED ── */}
      {isAdvisor && hasChapter && activity.length > 0 && (
        <Card>
          <CardHeader
            eyebrow="Advisor view"
            title="Recent practice activity"
            tagline="Latest practice sessions logged by your chapter members."
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 14 }}>
            {activity.map((item) => {
              const comp = getCompetition(item.competitionSlug);
              const pct = item.score != null && item.outOf != null
                ? Math.round((item.score / item.outOf) * 100)
                : null;
              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                        {item.memberName ?? item.memberEmail?.split("@")[0] ?? "Member"}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text3)" }}>
                        practiced {comp?.name ?? item.competitionSlug}
                      </span>
                    </div>
                  </div>
                  {pct != null && (
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: pct >= 80 ? "var(--green)" : pct >= 60 ? "var(--accent)" : "var(--red)",
                        flexShrink: 0,
                      }}
                    >
                      {pct}%
                    </span>
                  )}
                  <span className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0 }}>
                    {relativeTime(item.loggedAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── DEADLINES ── */}
      <Card>
        <CardHeader
          eyebrow="Calendar"
          title="Deadlines"
          tagline="Track sign-up dates, test days, and submission windows."
          right={
            <button
              type="button"
              className="btn btn-accent btn-sm btn-pill"
              onClick={() => setShowDlForm((p) => !p)}
            >
              {showDlForm ? "Cancel" : "Add deadline"}
            </button>
          }
        />

        {showDlForm && (
          <form
            onSubmit={submitDeadline}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginTop: 16,
              padding: 16,
              background: "var(--bg2)",
              borderRadius: 10,
              border: "0.5px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="font-mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Title *</label>
              <input type="text" value={dlTitle} onChange={(e) => setDlTitle(e.target.value)} placeholder="e.g. Accounting I sign-up due" className="input-field" required />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="font-mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Due date *</label>
              <input type="date" value={dlDate} onChange={(e) => setDlDate(e.target.value)} className="input-field" required />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="font-mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Competition (optional)</label>
              <select value={dlSlug} onChange={(e) => setDlSlug(e.target.value)} className="input-field">
                <option value="">No specific event</option>
                {registered.map((slug) => {
                  const comp = getCompetition(slug);
                  return <option key={slug} value={slug}>{comp?.name ?? slug}</option>;
                })}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="font-mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Note (optional)</label>
              <input type="text" value={dlNote} onChange={(e) => setDlNote(e.target.value)} placeholder="Any extra context..." className="input-field" />
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowDlForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-accent btn-sm btn-pill">Add deadline</button>
            </div>
          </form>
        )}

        {deadlines.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 12 }}>
            <div className="empty-state-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <p className="empty-state-title">No deadlines yet</p>
            <p className="empty-state-msg">Add your first deadline to start tracking sign-up dates and test days.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
            {deadlines.map((dl: Deadline) => {
              const days = daysUntil(dl.dueAt);
              const isPast = days < 0;
              const isToday = days === 0;
              const comp = dl.competitionSlug ? getCompetition(dl.competitionSlug) : null;
              return (
                <div
                  key={dl.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    padding: "14px 16px",
                    borderRadius: 10,
                    border: "0.5px solid var(--border)",
                    background: isPast ? "transparent" : "var(--bg2)",
                    opacity: isPast ? 0.55 : 1,
                  }}
                >
                  <div style={{ flexShrink: 0, textAlign: "center", minWidth: 52 }}>
                    <p className="font-mono" style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, color: isPast ? "var(--text3)" : "var(--text)" }}>
                      {dl.dueAt.split("-")[2]}
                    </p>
                    <p className="font-mono" style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 2 }}>
                      {formatDate(dl.dueAt).split(" ")[0]}
                    </p>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: isPast ? "var(--text3)" : "var(--text)" }}>{dl.title}</p>
                      {comp && <span className="chip chip-brand" style={{ fontSize: 10 }}>{comp.name}</span>}
                      <span
                        className="font-mono"
                        style={{
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 999,
                          background: isToday ? "rgba(var(--green-rgb), 0.12)" : isPast ? "rgba(90, 107, 138, 0.1)" : "var(--accent-dim)",
                          color: isToday ? "var(--green)" : isPast ? "var(--text-muted)" : "var(--accent)",
                          fontWeight: 700,
                        }}
                      >
                        {isToday ? "Today" : isPast ? `${Math.abs(days)}d ago` : `in ${days}d`}
                      </span>
                    </div>
                    {dl.note && <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>{dl.note}</p>}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeDeadline(dl.id)}
                    aria-label="Remove deadline"
                    style={{
                      flexShrink: 0, width: 28, height: 28, borderRadius: 6,
                      border: "0.5px solid var(--border)", background: "transparent",
                      color: "var(--text3)", display: "flex", alignItems: "center",
                      justifyContent: "center", cursor: "pointer",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── MY EVENTS ── */}
      <Card>
        <CardHeader
          eyebrow="Registered"
          title="My events"
          tagline="Events you have added to your competition queue."
          right={<Link href="/competitions" className="btn btn-ghost btn-sm">Browse all</Link>}
        />
        {registered.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 8 }}>
            No events yet.{" "}
            <Link href="/competitions" style={{ color: "var(--accent)" }}>Browse competitions</Link>
            {" "}to add some.
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {registered.map((slug) => {
              const comp = getCompetition(slug);
              return (
                <Link key={slug} href={`/competitions/${slug}`} className="chip chip-brand" style={{ textDecoration: "none", fontSize: 12, padding: "5px 12px", borderRadius: 999 }}>
                  {comp?.name ?? slug}
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── COMING SOON (only for non-advisors) ── */}
      {!isAdvisor && (
        <Card variant="accent">
          <HeroBadge>Coming soon - free for every chapter</HeroBadge>
          <h2 style={{ fontSize: 20, marginTop: 12, marginBottom: 12, letterSpacing: "-0.02em" }}>
            Full advisor dashboard on the way.
          </h2>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "Advisor view - see all member sign-ups across every event",
              "Member roster with officer and member roles",
              "Export rosters for regional registration",
            ].map((line) => (
              <li key={line} style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--text2)", lineHeight: 1.55 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path d="M5 12l5 5L20 7" />
                </svg>
                {line}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <style>{`
        @media (max-width: 720px) {
          .chapter-setup-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
