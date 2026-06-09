"use client";

// Controller hook for the Chapter page. Owns every piece of state, the
// Supabase load/auto-join effect, all handlers, and the derived flags that the
// presentational sub-components render. Lifted verbatim from the former
// monolithic app/app/chapter/page.tsx (issue #47) - no behavior change.

import { useEffect, useState, useCallback } from "react";
import {
  onStorageChange,
  getDeadlines,
  getRegistered,
  setChapterContext,
  syncChapterDeadlines,
  canManageDeadlines,
  isInChapter,
  getPracticeLogs,
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
  getChapterStats,
  getChapterAssignments,
  getChapterAssignmentBoard,
  createAssignment,
  deleteAssignment,
  AI_LOG_PREFIX,
  type LeaderboardRow,
  type ChapterProfile,
  type ChapterInfo,
  type MemberRow,
  type ActivityItem,
  type ChapterStats,
  type Assignment,
  type AssignmentProgress,
} from "@/lib/chapter";
import { getLeaderboardCached, invalidateLeaderboard } from "@/lib/leaderboard-cache";
import { ALL_COMP_OPTIONS } from "./chapterHelpers";

export function useChapterData() {
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
  const [autoJoinMsg, setAutoJoinMsg] = useState<{ kind: "error" | "info"; text: string } | null>(null);

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
    // Count only AI-generated practice tests (same rule as the advisor board) so
    // manual tracker entries don't complete an assignment.
    return myLogs.filter(
      (l) =>
        l.notes?.startsWith(AI_LOG_PREFIX) &&
        new Date(l.loggedAt).getTime() >= since &&
        (!a.event_slug || l.competitionSlug === a.event_slug)
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
        const [asg, lb] = await Promise.all([getChapterAssignments(ch.id), getLeaderboardCached()]);
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
      if (pendingJoin && prof) {
        const code = pendingJoin.trim();
        if (prof.chapter_id) {
          // Already in a chapter - an invite link can't silently switch them.
          try { localStorage.removeItem("fbla_pending_join"); } catch {}
          setAutoJoinMsg({ kind: "info", text: "You're already in a chapter, so this invite link was ignored." });
        } else {
          const r = await joinChapter(data.user.id, code);
          if (r.data) {
            try { localStorage.removeItem("fbla_pending_join"); } catch {}
            await loadChapterData(data.user.id);
          } else {
            // Surface the failure and prefill the join form so the code can be retried.
            try { localStorage.removeItem("fbla_pending_join"); } catch {}
            setJoinCode(code);
            setAutoJoinMsg({ kind: "error", text: r.error || "That invite code is not valid. Enter it below to try again." });
          }
        }
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
      invalidateLeaderboard(); // standings changed - drop the dashboard chip's cache
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

  // ── Derived ─────────────────────────────────────────────────
  const isAdvisor = profile?.role === "advisor";
  const hasChapter = Boolean(profile?.chapter_id && chapter);
  const signedIn = Boolean(userId);
  const inChapter = isInChapter();
  const canManage = canManageDeadlines();
  const compOptions: { slug: string; name: string }[] = inChapter
    ? ALL_COMP_OPTIONS
    : registered.map((slug) => ({ slug, name: getCompetition(slug)?.name ?? slug }));
  const deadlineTagline = inChapter
    ? canManage
      ? "Shared across your chapter - every member sees these."
      : "Set by your advisor - shared across your chapter."
    : "Track sign-up dates, test days, and submission windows.";

  return {
    // identity / loaded data
    userId, profile, chapter, members, activity, stats, assignments, board, leaderboard, supaLoading,
    // setup forms
    createName, setCreateName, createError, createLoading, handleCreateChapter,
    joinCode, setJoinCode, joinError, joinLoading, handleJoinChapter,
    autoJoinMsg,
    // invite / share
    copiedCode, copyInviteCode, joinLink, copiedLink, copyJoinLink, shareJoinLink,
    // assignments (advisor)
    showAsgForm, setShowAsgForm,
    asgTitle, setAsgTitle, asgEvent, setAsgEvent, asgTarget, setAsgTarget, asgDue, setAsgDue,
    asgError, asgLoading, handleCreateAssignment, handleDeleteAssignment,
    // assignments (member)
    myAssignmentProgress,
    // deadlines
    deadlines, showDlForm, setShowDlForm,
    dlTitle, setDlTitle, dlDate, setDlDate, dlSlug, setDlSlug, dlNote, setDlNote,
    // my events
    registered,
    // derived flags
    isAdvisor, hasChapter, signedIn, inChapter, canManage, compOptions, deadlineTagline,
    // config
    isSupabaseConfigured,
  };
}

export type ChapterController = ReturnType<typeof useChapterData>;
