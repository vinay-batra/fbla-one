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
  setChapterContext,
  syncChapterDeadlines,
  canManageDeadlines,
  isInChapter,
  type Deadline,
} from "@/lib/storage";
import { getCompetition, COMPETITIONS } from "@/lib/competitions";
import { Sparkbars } from "@/components/Sparkbars";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  getMyProfile,
  createChapter,
  joinChapter,
  getChapterById,
  getChapterMembers,
  getChapterActivity,
  getChapterStats,
  getChapterAssignments,
  getChapterAssignmentBoard,
  createAssignment,
  deleteAssignment,
  getMyChapterLeaderboard,
  type LeaderboardRow,
  type ChapterProfile,
  type ChapterInfo,
  type MemberRow,
  type ActivityItem,
  type ChapterStats,
  type Assignment,
  type AssignmentProgress,
} from "@/lib/chapter";
import { FORMAT_LABEL } from "@/lib/competitions";
import { getPracticeLogs } from "@/lib/storage";

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
  if (role === "advisor") return { background: "var(--accent-dim)", color: "var(--accent-text)" };
  if (role === "officer") return { background: "var(--brand-dim)", color: "var(--brand)" };
  return { background: "var(--bg3)", color: "var(--text3)" };
}

function scoreColor(pct: number): string {
  return pct >= 80 ? "var(--green)" : pct >= 60 ? "var(--accent)" : "var(--red)";
}

const LB_TH: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 12px",
  fontSize: 9,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  borderBottom: "0.5px solid var(--border)",
  fontWeight: 700,
};

const LB_TD: React.CSSProperties = { padding: "10px 12px", verticalAlign: "top" };

function MiniStat({ label, value, sub, small }: { label: string; value: string; sub?: string; small?: boolean }) {
  return (
    <div style={{ padding: "14px 14px", borderRadius: 10, border: "0.5px solid var(--border)", background: "var(--bg2)" }}>
      <p className="font-mono" style={{ fontSize: 9, letterSpacing: "0.16em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
        {label}
      </p>
      <p className="font-mono" style={{ fontSize: small ? 14 : 22, fontWeight: 700, color: "var(--text)", marginTop: 8, lineHeight: 1.15, wordBreak: "break-word" }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 10, color: "var(--text3)", marginTop: 3 }}>{sub}</p>}
    </div>
  );
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
  const [stats, setStats] = useState<ChapterStats | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]); // member view
  const [board, setBoard] = useState<AssignmentProgress[]>([]); // advisor view
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [supaLoading, setSupaLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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

  // Assignment form (advisor)
  const [showAsgForm, setShowAsgForm] = useState(false);
  const [asgTitle, setAsgTitle] = useState("");
  const [asgEvent, setAsgEvent] = useState("");
  const [asgTarget, setAsgTarget] = useState(3);
  const [asgDue, setAsgDue] = useState("");
  const [asgError, setAsgError] = useState("");
  const [asgLoading, setAsgLoading] = useState(false);

  const deadlines = getDeadlines().sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const registered = getRegistered();
  const myLogs = getPracticeLogs();
  const myAssignmentProgress = (a: Assignment): number => {
    const since = new Date(a.created_at).getTime();
    return myLogs.filter(
      (l) => new Date(l.loggedAt).getTime() >= since && (!a.event_slug || l.competitionSlug === a.event_slug)
    ).length;
  };

  // ── Load Supabase data ──────────────────────────────────────
  const loadChapterData = useCallback(async (uid: string) => {
    const prof = await getMyProfile(uid);
    setProfile(prof);
    if (prof?.chapter_id) {
      // Route deadlines through the chapter-shared mirror for every member.
      setChapterContext(prof.chapter_id, prof.role);
      syncChapterDeadlines();
      const ch = await getChapterById(prof.chapter_id);
      setChapter(ch);
      if (prof.role === "advisor" && ch) {
        const [m, act, st, bd] = await Promise.all([
          getChapterMembers(ch.id),
          getChapterActivity(ch.id),
          getChapterStats(ch.id),
          getChapterAssignmentBoard(ch.id),
        ]);
        setMembers(m);
        setActivity(act);
        setStats(st);
        setBoard(bd);
      } else if (ch) {
        const [asg, lb] = await Promise.all([getChapterAssignments(ch.id), getMyChapterLeaderboard()]);
        setAssignments(asg);
        setLeaderboard(lb);
      }
    }
    return prof;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) { setSupaLoading(false); return; }
    const supa = getSupabase();
    if (!supa) { setSupaLoading(false); return; }

    supa.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setSupaLoading(false); return; }
      setUserId(data.user.id);
      const prof = await loadChapterData(data.user.id);
      // Auto-join when arriving from a chapter invite link (/join/CODE stashes it).
      let pendingJoin: string | null = null;
      try { pendingJoin = localStorage.getItem("fbla_pending_join"); } catch {}
      if (pendingJoin && prof && !prof.chapter_id) {
        try { localStorage.removeItem("fbla_pending_join"); } catch {}
        const r = await joinChapter(data.user.id, pendingJoin.trim());
        if (r.data) await loadChapterData(data.user.id);
      }
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

  const joinLink = chapter ? `${typeof window !== "undefined" ? window.location.origin : "https://fbla.one"}/join/${chapter.invite_code}` : "";
  function copyJoinLink() {
    if (!joinLink) return;
    navigator.clipboard.writeText(joinLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  }
  function shareJoinLink() {
    if (!joinLink) return;
    const data = { title: `Join ${chapter?.name ?? "our chapter"} on FBLA One`, text: "Tap to join our FBLA chapter:", url: joinLink };
    if (typeof navigator !== "undefined" && navigator.share) navigator.share(data).catch(() => {});
    else copyJoinLink();
  }

  async function handleCreateAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!chapter || !userId || !asgTitle.trim()) return;
    setAsgLoading(true);
    setAsgError("");
    const r = await createAssignment(chapter.id, userId, {
      title: asgTitle.trim(),
      eventSlug: asgEvent || null,
      targetCount: asgTarget,
      dueAt: asgDue || null,
    });
    setAsgLoading(false);
    if (r.error) { setAsgError(r.error); return; }
    setShowAsgForm(false);
    setAsgTitle(""); setAsgEvent(""); setAsgTarget(3); setAsgDue("");
    setBoard(await getChapterAssignmentBoard(chapter.id));
  }

  async function handleDeleteAssignment(id: string) {
    if (!chapter) return;
    setBoard((b) => b.filter((x) => x.assignment.id !== id));
    await deleteAssignment(id);
    setBoard(await getChapterAssignmentBoard(chapter.id));
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
  const inChapter = isInChapter();
  const canManage = canManageDeadlines();
  const compOptions: { slug: string; name: string }[] = inChapter
    ? COMPETITIONS.map((c) => ({ slug: c.slug, name: c.name }))
    : registered.map((slug) => ({ slug, name: getCompetition(slug)?.name ?? slug }));
  const deadlineTagline = inChapter
    ? canManage
      ? "Shared across your chapter - every member sees these."
      : "Set by your advisor - shared across your chapter."
    : "Track sign-up dates, test days, and submission windows.";

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
                <Link href="/auth" style={{ color: "var(--accent-text)" }}>Sign in</Link>
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

      {/* ── ASSIGNMENTS (member) ── */}
      {hasChapter && !isAdvisor && assignments.length > 0 && (
        <Card>
          <CardHeader eyebrow="From your advisor" title="Your assignments" tagline="Practice targets your advisor set for the chapter." />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
            {assignments.map((a) => {
              const done = Math.min(myAssignmentProgress(a), a.target_count);
              const complete = done >= a.target_count;
              const ev = a.event_slug ? (COMPETITIONS.find((c) => c.slug === a.event_slug)?.name ?? a.event_slug) : "Any event";
              const pct = Math.round((done / a.target_count) * 100);
              return (
                <div key={a.id} style={{ padding: "14px 16px", border: `0.5px solid ${complete ? "rgba(var(--green-rgb),0.35)" : "var(--border)"}`, borderRadius: 12, background: complete ? "rgba(var(--green-rgb),0.06)" : "var(--bg2)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <p style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)" }}>{a.title}</p>
                      <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>{ev} · {a.target_count} test{a.target_count !== 1 ? "s" : ""}{a.due_at ? ` · due ${formatDate(a.due_at)}` : ""}</p>
                    </div>
                    {complete && (
                      <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: "rgba(var(--green-rgb),0.14)", color: "var(--green)", whiteSpace: "nowrap" }}>DONE</span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--bg3)", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: complete ? "var(--green)" : "var(--accent)", borderRadius: 999 }} />
                    </div>
                    <span className="font-mono" style={{ fontSize: 11, color: "var(--text2)", whiteSpace: "nowrap" }}>{done}/{a.target_count}</span>
                  </div>
                  {!complete && (
                    <a href={a.event_slug ? `/app/coach?slug=${a.event_slug}` : "/app/coach"} className="btn btn-ghost btn-sm btn-pill" style={{ marginTop: 12 }}>
                      Practice now
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── LEADERBOARD (member-visible) ── */}
      {hasChapter && !isAdvisor && leaderboard.length > 0 && (
        <Card>
          <CardHeader eyebrow="Chapter leaderboard" title="Who's putting in the work" tagline="Ranked by practice tests taken. Climb the board by practicing - effort, not scores." />
          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 12 }}>
            {leaderboard.map((row, i) => {
              const me = row.userId === userId;
              const rankColor = i === 0 ? "#d4af37" : i === 1 ? "#aab4c2" : i === 2 ? "#c07f3c" : "var(--text3)";
              return (
                <div key={row.userId} style={{
                  display: "grid", gridTemplateColumns: "32px 1fr auto auto", alignItems: "center", gap: 12,
                  padding: "11px 14px", borderRadius: 10,
                  background: me ? "var(--accent-dim)" : "transparent",
                  border: me ? "0.5px solid var(--accent-border)" : "0.5px solid transparent",
                }}>
                  <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: rankColor, textAlign: "center" }}>{i + 1}</span>
                  <span style={{ fontSize: 14, color: "var(--text)", fontWeight: me ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {row.name}{me && <span style={{ color: "var(--accent-text)", fontWeight: 700 }}> · You</span>}
                  </span>
                  {row.last7 > 0 && (
                    <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "rgba(var(--green-rgb),0.12)", color: "var(--green)", whiteSpace: "nowrap" }}>+{row.last7} this week</span>
                  )}
                  <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", minWidth: 60, textAlign: "right" }}>{row.tests} <span style={{ fontSize: 10, color: "var(--text3)", fontWeight: 400 }}>tests</span></span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── SHARE / INVITE (advisor) ── */}
      {isAdvisor && hasChapter && chapter && (
        <Card>
          <CardHeader eyebrow="Grow your chapter" title="Invite your members" tagline="Share one link. Members open it, sign up, and they're in your chapter automatically - no code to type." />
          <div className="invite-share" style={{ display: "flex", gap: 24, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: "1 1 280px", minWidth: 0 }}>
              <p className="font-mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: 7 }}>Invite link</p>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input readOnly value={joinLink} onFocus={(e) => e.currentTarget.select()} className="input-field" style={{ flex: 1, fontSize: 13, minWidth: 0 }} aria-label="Chapter invite link" />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button type="button" onClick={copyJoinLink} className="btn btn-accent btn-sm btn-pill" style={{ minWidth: 110 }}>
                  {copiedLink ? "Copied!" : "Copy link"}
                </button>
                <button type="button" onClick={shareJoinLink} className="btn btn-ghost btn-sm btn-pill">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>
                  Share
                </button>
              </div>
              <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 12, lineHeight: 1.5 }}>
                Prefer a code? Share <span className="font-mono" style={{ color: "var(--accent)", fontWeight: 700 }}>{chapter.invite_code}</span> and have members enter it on their Chapter page.
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ padding: 10, background: "#fff", borderRadius: 12, border: "0.5px solid var(--border)", display: "inline-block" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=${encodeURIComponent(joinLink)}`}
                  alt="Chapter invite QR code"
                  width={150}
                  height={150}
                />
              </div>
              <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 8 }}>Scan to join</p>
            </div>
          </div>
          <style>{`@media (max-width:640px){ .invite-share { flex-direction: column; align-items: stretch; } }`}</style>
        </Card>
      )}

      {/* ── ASSIGNMENTS (advisor) ── */}
      {isAdvisor && hasChapter && (
        <Card>
          <CardHeader
            eyebrow="Assignments"
            title="Set goals for your chapter"
            tagline="Assign practice targets and watch completion update as members practice."
            right={
              <button type="button" onClick={() => setShowAsgForm((v) => !v)} className="btn btn-accent btn-sm btn-pill cta-shimmer">
                {showAsgForm ? "Close" : "New assignment"}
              </button>
            }
          />

          {showAsgForm && (
            <form onSubmit={handleCreateAssignment} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14, marginBottom: 18, padding: 16, background: "var(--bg2)", border: "0.5px solid var(--border)", borderRadius: 12 }}>
              <input className="input-field" placeholder="Title, e.g. Warm up for Accounting" value={asgTitle} onChange={(e) => setAsgTitle(e.target.value)} maxLength={80} />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <select className="input-field" value={asgEvent} onChange={(e) => setAsgEvent(e.target.value)} style={{ flex: "1 1 200px", cursor: "pointer" }}>
                  <option value="">Any event</option>
                  {[...COMPETITIONS].sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
                <input className="input-field" type="number" min={1} max={100} value={asgTarget} onChange={(e) => setAsgTarget(Number(e.target.value))} style={{ width: 110 }} aria-label="Target practice tests" />
                <input className="input-field" type="date" value={asgDue} onChange={(e) => setAsgDue(e.target.value)} style={{ width: 160 }} aria-label="Due date" />
              </div>
              <p style={{ fontSize: 12, color: "var(--text3)" }}>Target = number of practice tests each member should log{asgEvent ? " for this event" : ""}.</p>
              {asgError && <p style={{ fontSize: 12, color: "var(--red)" }}>{asgError}</p>}
              <button type="submit" disabled={asgLoading || !asgTitle.trim()} className="btn btn-accent btn-sm btn-pill" style={{ alignSelf: "flex-start" }}>
                {asgLoading ? "Creating..." : "Assign to chapter"}
              </button>
            </form>
          )}

          {board.length === 0 ? (
            !showAsgForm && <p style={{ fontSize: 13.5, color: "var(--text3)", marginTop: 12 }}>No assignments yet. Create one to give your chapter a concrete weekly target.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
              {board.map((b) => {
                const ev = b.assignment.event_slug ? (COMPETITIONS.find((c) => c.slug === b.assignment.event_slug)?.name ?? b.assignment.event_slug) : "Any event";
                const pct = b.totalMembers ? Math.round((b.completedCount / b.totalMembers) * 100) : 0;
                return (
                  <div key={b.assignment.id} style={{ padding: "14px 16px", border: "0.5px solid var(--border)", borderRadius: 12, background: "var(--bg2)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)" }}>{b.assignment.title}</p>
                        <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>
                          {ev} · {b.assignment.target_count} test{b.assignment.target_count !== 1 ? "s" : ""}{b.assignment.due_at ? ` · due ${formatDate(b.assignment.due_at)}` : ""}
                        </p>
                      </div>
                      <button type="button" onClick={() => handleDeleteAssignment(b.assignment.id)} aria-label="Delete assignment" style={{ fontSize: 12, color: "var(--text3)", cursor: "pointer", flexShrink: 0 }}>Remove</button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--bg3)", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", borderRadius: 999 }} />
                      </div>
                      <span className="font-mono" style={{ fontSize: 11, color: "var(--text2)", whiteSpace: "nowrap" }}>{b.completedCount}/{b.totalMembers} done</span>
                    </div>
                    {b.perMember.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                        {b.perMember.map((m) => (
                          <span key={m.id} className="font-mono" style={{ fontSize: 10.5, padding: "3px 8px", borderRadius: 6, fontWeight: 600, background: m.complete ? "rgba(var(--green-rgb),0.12)" : "var(--bg3)", color: m.complete ? "var(--green)" : "var(--text3)", border: `0.5px solid ${m.complete ? "rgba(var(--green-rgb),0.3)" : "var(--border)"}` }}>
                            {m.name} {m.done}/{b.assignment.target_count}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ── CHAPTER STATS ── */}
      {isAdvisor && hasChapter && stats && (
        <Card>
          <CardHeader
            eyebrow="Advisor view"
            title="Chapter stats"
            tagline="Practice activity across your whole chapter."
          />
          <div
            className="chapter-stat-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}
          >
            <MiniStat label="Practice tests" value={String(stats.totalTests)} sub="all-time" />
            <MiniStat label="Active this week" value={`${stats.activeThisWeek}/${stats.members.length}`} sub="members" />
            <MiniStat label="Chapter average" value={stats.chapterAvgPct != null ? `${stats.chapterAvgPct}%` : "-"} sub="across scored tests" />
            <MiniStat
              small
              label="Top event"
              value={stats.topEvents[0] ? (getCompetition(stats.topEvents[0].slug)?.name ?? stats.topEvents[0].slug) : "-"}
              sub={stats.topEvents[0] ? `${stats.topEvents[0].tests} test${stats.topEvents[0].tests !== 1 ? "s" : ""}` : "no data yet"}
            />
          </div>

          {stats.totalTests > 0 && (
            <div style={{ marginTop: 20, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: 10 }}>Practice tests per week</p>
                <Sparkbars
                  values={stats.weekly.map((w) => w.tests)}
                  variant="volume"
                  width={260}
                  height={48}
                  color="var(--brand)"
                  ariaLabel={`Practice tests per week for the last 8 weeks: ${stats.weekly.map((w) => w.tests).join(", ")}`}
                />
              </div>
              <p style={{ fontSize: 11, color: "var(--text3)", maxWidth: 220, lineHeight: 1.5 }}>
                Last 8 weeks. Taller bars mean more practice tests logged by your chapter that week.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* ── LEADERBOARD ── */}
      {isAdvisor && hasChapter && stats && (
        <Card>
          <CardHeader
            eyebrow="Advisor view"
            title="Leaderboard"
            tagline="Ranked by practice tests logged, then average score."
          />
          {stats.members.every((m) => m.tests === 0) ? (
            <div className="empty-state" style={{ marginTop: 12 }}>
              <div className="empty-state-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <rect x="7" y="12" width="3" height="6" />
                  <rect x="12" y="8" width="3" height="10" />
                  <rect x="17" y="5" width="3" height="13" />
                </svg>
              </div>
              <p className="empty-state-title">No practice logged yet</p>
              <p className="empty-state-msg">Once members start taking AI practice tests, they will rank here automatically.</p>
            </div>
          ) : (
            <div style={{ marginTop: 16, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["#", "Member", "Tests", "Avg", "Best", "Last active"].map((h) => (
                      <th key={h} className="font-mono" style={LB_TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.members.map((m, i) => {
                    const rank = i + 1;
                    return (
                      <tr key={m.id} style={{ background: i % 2 === 0 ? "transparent" : "var(--bg2)" }}>
                        <td style={LB_TD}>
                          <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: rank === 1 ? "var(--accent)" : rank <= 3 ? "var(--text)" : "var(--text3)" }}>
                            {rank}
                          </span>
                        </td>
                        <td style={LB_TD}>
                          <span style={{ fontWeight: 600, color: "var(--text)" }}>{m.name}</span>
                          {m.role !== "member" && (
                            <span className="font-mono" style={{ marginLeft: 6, fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                              {m.role}
                            </span>
                          )}
                        </td>
                        <td style={LB_TD}>
                          <span className="font-mono" style={{ fontWeight: 700, color: m.tests > 0 ? "var(--text)" : "var(--text-muted)" }}>{m.tests}</span>
                        </td>
                        <td style={LB_TD}>
                          {m.avgPct != null
                            ? <span className="font-mono" style={{ fontWeight: 700, color: scoreColor(m.avgPct) }}>{m.avgPct}%</span>
                            : <span style={{ color: "var(--text-muted)" }}>-</span>}
                        </td>
                        <td style={LB_TD}>
                          {m.bestPct != null
                            ? <span className="font-mono">{m.bestPct}%</span>
                            : <span style={{ color: "var(--text-muted)" }}>-</span>}
                        </td>
                        <td style={LB_TD}>
                          <span style={{ fontSize: 11, color: "var(--text3)" }}>{m.lastActiveAt ? relativeTime(m.lastActiveAt) : "never"}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
              const pct = item.score != null && item.outOf != null && item.outOf > 0
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
          tagline={deadlineTagline}
          right={
            canManage ? (
              <button
                type="button"
                className="btn btn-accent btn-sm btn-pill"
                onClick={() => setShowDlForm((p) => !p)}
              >
                {showDlForm ? "Cancel" : "Add deadline"}
              </button>
            ) : undefined
          }
        />

        {showDlForm && canManage && (
          <form
            onSubmit={submitDeadline}
            className="dl-form-grid"
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
                {compOptions.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
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
            <p className="empty-state-msg">{canManage ? "Add your first deadline to start tracking sign-up dates and test days." : "Your advisor has not added any chapter deadlines yet."}</p>
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

                  {canManage && (
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
                  )}
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
            <Link href="/competitions" style={{ color: "var(--accent-text)" }}>Browse competitions</Link>
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
          .chapter-stat-grid { grid-template-columns: 1fr 1fr !important; }
          .dl-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
