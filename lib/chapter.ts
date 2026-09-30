/**
 * Chapter-related Supabase operations.
 *
 * All functions are async and return null / empty arrays on error rather
 * than throwing, so the UI can degrade gracefully when offline or when
 * the user is in preview mode (no Supabase configured).
 */

import { getSupabase } from "./supabase";
import { getCompetition, hasObjectiveTest } from "./competitions";
import { isMissingTopicColumn, parseTopicResults, type TopicResult } from "./storage";
import { judgeModeFor } from "@/components/judge/rubric";

/**
 * Marker prefix the coach writes into a practice_logs note for AI-generated
 * tests ("AI practice test - X/Y"). Assignment completion counts ONLY logs with
 * this prefix, so manually-entered tracker rows can't game an assignment. Single
 * source of truth shared by the coach, the advisor board, and the member view.
 */
export const AI_LOG_PREFIX = "AI practice test";

/**
 * Marker prefix the Judge writes into a practice_logs note for a scored role
 * play or presentation ("AI Judge: role play 72/100"). Judge rounds are rubric
 * points out of 100, not a percentage of questions right, so every score
 * average, trend and best-score in the app skips them and shows them on their
 * own. They still count as practice (streaks, weekly volume, last active).
 * They never count toward an assignment: those require AI_LOG_PREFIX.
 */
export const JUDGE_LOG_PREFIX = "AI Judge";

export type JudgeLogMode = "role-play" | "presentation";

const JUDGE_MODE_LABEL: Record<JudgeLogMode, string> = {
  "role-play": "role play",
  presentation: "presentation",
};

/** "AI Judge: role play 72/100", plus ", Q&A 55/100" once the follow-up round is scored. */
export function judgeLogNote(mode: JudgeLogMode, total: number, qaTotal?: number | null): string {
  const base = `${JUDGE_LOG_PREFIX}: ${JUDGE_MODE_LABEL[mode]} ${Math.round(total)}/100`;
  return qaTotal == null ? base : `${base}, Q&A ${Math.round(qaTotal)}/100`;
}

export function isJudgeNote(notes: string | null | undefined): boolean {
  return typeof notes === "string" && notes.startsWith(`${JUDGE_LOG_PREFIX}:`);
}

/** Recover the round type and optional Q&A score from a Judge note. */
export function parseJudgeNote(notes: string | null | undefined): { mode: JudgeLogMode; qaTotal: number | null } | null {
  if (!isJudgeNote(notes)) return null;
  const body = (notes as string).slice(JUDGE_LOG_PREFIX.length + 1).trim();
  const mode: JudgeLogMode = body.startsWith(JUDGE_MODE_LABEL["role-play"]) ? "role-play" : "presentation";
  const qa = body.match(/Q&A (\d{1,3})\/100/);
  return { mode, qaTotal: qa ? Number(qa[1]) : null };
}

/** Short label for a Judge round, for list rows and chips. */
export function judgeModeLabel(mode: JudgeLogMode): string {
  return mode === "role-play" ? "Role play" : "Presentation";
}

/** A practice test with a usable percentage (Judge rounds excluded). */
export function isScoredTest(l: { score: number | null; outOf: number | null; notes?: string | null }): boolean {
  // Judge rounds are rubric points, and a mistake review re-asks questions the
  // student already saw with the answers; neither belongs in a test average.
  return (
    !isJudgeNote(l.notes) &&
    !(l.notes ?? "").startsWith("Mistake review") &&
    l.score != null &&
    l.outOf != null &&
    l.outOf > 0
  );
}

// ── Types ──────────────────────────────────────────────────────

export type ChapterProfile = {
  id: string;
  chapter_id: string | null;
  role: "member" | "officer" | "advisor" | "admin";
  display_name: string | null;
  email: string | null;
};

export type ChapterInfo = {
  id: string;
  name: string;
  invite_code: string;
  advisor_user_id: string;
  school: string | null;
  state: string | null;
};

export type MemberRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  role: string;
  registrations: string[]; // competition slugs
};

// ── Helpers ───────────────────────────────────────────────────

function devErr(label: string, e: unknown) {
  if (process.env.NODE_ENV !== "production") console.error(label, e);
}

function randomInviteCode(): string {
  // CSPRNG-backed, Crockford-ish base32 (drops I/O/0/1 to avoid confusion), 8
  // chars (~30^8 space) - a chapter invite is a bearer secret, so it must not be
  // a guessable / reconstructable Math.random value. (Primary path is the
  // server-side create_chapter RPC; this is the pre-0007 fallback.)
  const ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
  const LEN = 8;
  const bytes = new Uint8Array(LEN);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < LEN; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** True when an RPC failed because the function is not in the DB yet (pre-migration 0007). */
function isMissingFunction(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  const code = err.code ?? "";
  const msg = (err.message ?? "").toLowerCase();
  return (
    code === "PGRST202" || code === "404" || code === "42883" ||
    msg.includes("could not find the function") ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  );
}

// ── Profile ───────────────────────────────────────────────────

/** Fetch the signed-in user's profile row. */
export async function getMyProfile(userId: string): Promise<ChapterProfile | null> {
  const supa = getSupabase();
  if (!supa) return null;
  try {
    const { data, error } = await supa
      .from("profiles")
      .select("id, chapter_id, role, display_name, email")
      .eq("id", userId)
      .single();
    if (error) { devErr("getMyProfile:", error); return null; }
    return data as ChapterProfile;
  } catch (e) {
    devErr("getMyProfile:", e);
    return null;
  }
}

// ── Chapter CRUD ──────────────────────────────────────────────

/** Create a new chapter and make the caller its advisor. */
export async function createChapter(
  userId: string,
  name: string
): Promise<{ data: ChapterInfo | null; error: string | null }> {
  const supa = getSupabase();
  if (!supa) return { data: null, error: "Supabase not configured" };

  try {
    // Preferred path (migration 0007): create + assign advisor server-side, where
    // the chapter_id change is permitted by the guard trigger.
    const { data: rpcData, error: rpcErr } = await supa.rpc("create_chapter", { p_name: name.trim() });
    if (!rpcErr && rpcData) {
      return { data: rpcData as ChapterInfo, error: null };
    }
    if (rpcErr && !isMissingFunction(rpcErr)) {
      devErr("createChapter rpc:", rpcErr);
      return { data: null, error: rpcErr.message ?? "Failed to create chapter" };
    }

    // Fallback for before 0007 is applied: direct insert + profile update.
    const inviteCode = randomInviteCode();
    const { data: chapter, error: chErr } = await supa
      .from("chapters")
      .insert({ name: name.trim(), invite_code: inviteCode, advisor_user_id: userId })
      .select()
      .single();

    if (chErr || !chapter) {
      devErr("createChapter insert:", chErr);
      return { data: null, error: chErr?.message ?? "Failed to create chapter" };
    }

    const { error: profErr } = await supa
      .from("profiles")
      .update({ chapter_id: chapter.id, role: "advisor" })
      .eq("id", userId);

    if (profErr) {
      // The two writes are not transactional. If the profile link fails the user
      // would be left advisor-less with an orphaned chapter, so roll the chapter
      // back and surface the failure instead of returning a false success.
      devErr("createChapter profile update:", profErr);
      await supa.from("chapters").delete().eq("id", chapter.id);
      return { data: null, error: "Could not finish creating your chapter. Please try again." };
    }

    return { data: chapter as ChapterInfo, error: null };
  } catch (e) {
    devErr("createChapter:", e);
    return { data: null, error: "Something went wrong" };
  }
}

/** Join an existing chapter by invite code. */
export async function joinChapter(
  userId: string,
  inviteCode: string
): Promise<{ data: ChapterInfo | null; error: string | null }> {
  const supa = getSupabase();
  if (!supa) return { data: null, error: "Supabase not configured" };

  const code = inviteCode.trim().toUpperCase();
  try {
    // Preferred path (migration 0007): validate the invite server-side. The client
    // no longer needs read access to other chapters.
    const { data: result, error: rpcErr } = await supa.rpc("join_chapter_by_code", { p_code: code });
    if (!rpcErr && result) {
      const row = Array.isArray(result) ? result[0] : result;
      // 0014+: the RPC returns the full chapter row, so use it directly. Pre-0014
      // it returns just the id (a string) - fall back to a fetch in that case.
      if (row && typeof row === "object") return { data: row as ChapterInfo, error: null };
      const ch = await getChapterById(String(row));
      return ch
        ? { data: ch, error: null }
        : { data: null, error: "Joined, but could not load the chapter." };
    }
    if (rpcErr && !isMissingFunction(rpcErr)) {
      if ((rpcErr.message ?? "").toLowerCase().includes("invalid invite code")) {
        return { data: null, error: "Invalid invite code. Double-check with your advisor." };
      }
      devErr("joinChapter rpc:", rpcErr);
      return { data: null, error: rpcErr.message ?? "Could not join chapter" };
    }

    // Fallback for before 0007 is applied: look up the chapter + direct profile update.
    const { data: chapter, error: lookupErr } = await supa
      .from("chapters")
      .select("id, name, invite_code, advisor_user_id, school, state")
      .eq("invite_code", code)
      .single();

    if (lookupErr || !chapter) {
      return { data: null, error: "Invalid invite code. Double-check with your advisor." };
    }

    const { error: profErr } = await supa
      .from("profiles")
      .update({ chapter_id: chapter.id, role: "member" })
      .eq("id", userId);

    if (profErr) {
      devErr("joinChapter profile update:", profErr);
      return { data: null, error: profErr.message };
    }

    return { data: chapter as ChapterInfo, error: null };
  } catch (e) {
    devErr("joinChapter:", e);
    return { data: null, error: "Something went wrong" };
  }
}

/** Fetch a chapter by its id. */
export async function getChapterById(id: string): Promise<ChapterInfo | null> {
  const supa = getSupabase();
  if (!supa) return null;
  try {
    const { data, error } = await supa
      .from("chapters")
      .select("id, name, invite_code, advisor_user_id, school, state")
      .eq("id", id)
      .single();
    if (error) { devErr("getChapterById:", error); return null; }
    return data as ChapterInfo;
  } catch (e) {
    devErr("getChapterById:", e);
    return null;
  }
}

export type ActivityItem = {
  id: string;
  memberId: string;
  memberName: string | null;
  memberEmail: string | null;
  competitionSlug: string;
  score: number | null;
  outOf: number | null;
  loggedAt: string;
  /** Set for an AI Judge round: score is rubric points out of 100, not a test percentage. */
  judgeMode: JudgeLogMode | null;
};

// ── Advisor dashboard ─────────────────────────────────────────

/**
 * Fetch all members of a chapter plus their registered competition slugs.
 * Requires the "Advisors read chapter member profiles" RLS policy from
 * migration 0004 to be in place.
 */
export async function getChapterMembers(chapterId: string): Promise<MemberRow[]> {
  const supa = getSupabase();
  if (!supa) return [];
  try {
    const { data: profiles, error: profErr } = await supa
      .from("profiles")
      .select("id, display_name, email, role")
      .eq("chapter_id", chapterId)
      .neq("role", "advisor"); // advisors run the chapter, they are not competing members

    if (profErr || !profiles?.length) {
      devErr("getChapterMembers profiles:", profErr);
      return [];
    }

    const memberIds = profiles.map((p) => p.id as string);

    const { data: regs, error: regErr } = await supa
      .from("registrations")
      .select("user_id, competition_slug")
      .in("user_id", memberIds);

    if (regErr) devErr("getChapterMembers regs:", regErr);

    const byUser = new Map<string, string[]>();
    for (const r of regs ?? []) {
      const list = byUser.get(r.user_id as string) ?? [];
      list.push(r.competition_slug as string);
      byUser.set(r.user_id as string, list);
    }

    return profiles.map((p) => ({
      id: p.id as string,
      display_name: p.display_name as string | null,
      email: p.email as string | null,
      role: p.role as string,
      registrations: byUser.get(p.id as string) ?? [],
    }));
  } catch (e) {
    devErr("getChapterMembers:", e);
    return [];
  }
}

/**
 * Fetch recent practice logs for all members of a chapter.
 * Requires the "Advisors read chapter member practice logs" RLS policy
 * (migration 0005) to be in place.
 */
export async function getChapterActivity(chapterId: string, limit = 25): Promise<ActivityItem[]> {
  const supa = getSupabase();
  if (!supa) return [];
  try {
    const { data: profiles } = await supa
      .from("profiles")
      .select("id, display_name, email")
      .eq("chapter_id", chapterId)
      .neq("role", "advisor"); // advisors are not competing members (matches roster/leaderboard/stats)

    if (!profiles?.length) return [];

    const memberMap = new Map(
      (profiles as { id: string; display_name: string | null; email: string | null }[]).map((p) => [
        p.id,
        { display_name: p.display_name, email: p.email },
      ])
    );
    const memberIds = profiles.map((p) => p.id as string);

    const { data: logs, error } = await supa
      .from("practice_logs")
      .select("id, user_id, competition_slug, score, out_of, logged_at, notes")
      .in("user_id", memberIds)
      .order("logged_at", { ascending: false })
      .limit(limit);

    if (error) { devErr("getChapterActivity logs:", error); return []; }
    if (!logs?.length) return [];

    return (logs as Record<string, unknown>[]).map((l) => ({
      id: String(l.id),
      memberId: String(l.user_id),
      memberName: memberMap.get(String(l.user_id))?.display_name ?? null,
      memberEmail: memberMap.get(String(l.user_id))?.email ?? null,
      competitionSlug: String(l.competition_slug),
      score: l.score == null ? null : Number(l.score),
      outOf: l.out_of == null ? null : Number(l.out_of),
      loggedAt: String(l.logged_at),
      judgeMode: parseJudgeNote(l.notes as string | null)?.mode ?? null,
    }));
  } catch (e) {
    devErr("getChapterActivity:", e);
    return [];
  }
}

// ── Chapter stats + leaderboard ───────────────────────────────

export type MemberStat = {
  id: string;
  name: string;
  email: string | null;
  role: string;
  tests: number; // total practice logs
  scoredTests: number; // logs with both score + outOf
  avgPct: number | null;
  bestPct: number | null;
  lastActiveAt: string | null;
  last7: number; // logs in the last 7 days
};

export type WeeklyPoint = { weekStart: string; tests: number; avgPct: number | null };

export type ChapterStats = {
  members: MemberStat[]; // leaderboard, already sorted
  totalTests: number;
  activeThisWeek: number; // members with >= 1 log in the last 7 days
  chapterAvgPct: number | null;
  weekly: WeeklyPoint[]; // last 8 weeks, oldest -> newest
  topEvents: { slug: string; tests: number }[]; // top 5 by test count
};

// ── Student-visible leaderboard (aggregates only, via RPC) ────

export type LeaderboardRow = { userId: string; name: string; tests: number; last7: number };

/** Every chapter member can call this; the RPC returns only aggregates for the
 *  caller's own chapter (no raw scores), ranked by practice volume. */
export async function getMyChapterLeaderboard(): Promise<LeaderboardRow[]> {
  const supa = getSupabase();
  if (!supa) return [];
  try {
    const { data, error } = await supa.rpc("get_chapter_leaderboard");
    if (error) { devErr("getMyChapterLeaderboard:", error); return []; }
    return (data ?? []).map((r: Record<string, unknown>) => ({
      userId: String(r.user_id),
      name: (r.display_name as string)?.trim() || "Member",
      tests: Number(r.tests) || 0,
      last7: Number(r.last7) || 0,
    }));
  } catch (e) {
    devErr("getMyChapterLeaderboard:", e);
    return [];
  }
}

// ── Assignments ───────────────────────────────────────────────

export type Assignment = {
  id: string;
  chapter_id: string;
  title: string;
  event_slug: string | null;
  target_count: number;
  due_at: string | null;
  created_at: string;
};

export type AssignmentProgress = {
  assignment: Assignment;
  perMember: { id: string; name: string; done: number; complete: boolean }[];
  completedCount: number;
  totalMembers: number;
};

export async function getChapterAssignments(chapterId: string): Promise<Assignment[]> {
  const supa = getSupabase();
  if (!supa) return [];
  try {
    const { data, error } = await supa
      .from("assignments")
      .select("id, chapter_id, title, event_slug, target_count, due_at, created_at")
      .eq("chapter_id", chapterId)
      .order("created_at", { ascending: false });
    if (error) { devErr("getChapterAssignments:", error); return []; }
    return (data ?? []) as Assignment[];
  } catch (e) {
    devErr("getChapterAssignments:", e);
    return [];
  }
}

export async function createAssignment(
  chapterId: string,
  userId: string,
  input: { title: string; eventSlug: string | null; targetCount: number; dueAt: string | null }
): Promise<{ data: Assignment | null; error: string | null }> {
  const supa = getSupabase();
  if (!supa) return { data: null, error: "Supabase not configured" };
  try {
    const { data, error } = await supa
      .from("assignments")
      .insert({
        chapter_id: chapterId,
        title: input.title.trim(),
        event_slug: input.eventSlug || null,
        target_count: Math.max(1, Math.min(100, Math.round(input.targetCount) || 1)),
        due_at: input.dueAt || null,
        created_by: userId,
      })
      .select("id, chapter_id, title, event_slug, target_count, due_at, created_at")
      .single();
    if (error) { devErr("createAssignment:", error); return { data: null, error: error.message }; }
    return { data: data as Assignment, error: null };
  } catch (e) {
    devErr("createAssignment:", e);
    return { data: null, error: "Could not create assignment" };
  }
}

export async function deleteAssignment(id: string): Promise<boolean> {
  const supa = getSupabase();
  if (!supa) return false;
  try {
    const { error } = await supa.from("assignments").delete().eq("id", id);
    if (error) { devErr("deleteAssignment:", error); return false; }
    return true;
  } catch (e) {
    devErr("deleteAssignment:", e);
    return false;
  }
}

/** Advisor view: assignments + each member's completion, computed from logs. */
export async function getChapterAssignmentBoard(chapterId: string): Promise<AssignmentProgress[]> {
  const supa = getSupabase();
  if (!supa) return [];
  try {
    const assignments = await getChapterAssignments(chapterId);
    if (!assignments.length) return [];

    const { data: profiles } = await supa
      .from("profiles")
      .select("id, display_name, email")
      .eq("chapter_id", chapterId)
      .neq("role", "advisor"); // assignment progress is for members only
    const members = (profiles ?? []).map((p) => ({
      id: p.id as string,
      name: (p.display_name as string)?.trim() || (p.email as string)?.split("@")[0] || "Member",
    }));
    const memberIds = members.map((m) => m.id);

    const { data: logs } = await supa
      .from("practice_logs")
      .select("user_id, competition_slug, logged_at, notes")
      .in("user_id", memberIds)
      .limit(5000);

    // Only AI-generated practice tests count toward an assignment (the coach
    // writes a recognizable "AI practice test - X/Y" note). Otherwise a member
    // could mark "log 3 Accounting tests" done by typing blank rows in the
    // manual tracker. Pre-bucket each member's AI logs once, parsing each
    // timestamp a single time, so the per-assignment x per-member loop does O(1)
    // lookups instead of re-scanning every log (was O(A x M x L)).
    const byUser = new Map<string, { t: number; slug: string }[]>();
    for (const l of (logs ?? []) as Record<string, unknown>[]) {
      if (!String(l.notes ?? "").startsWith(AI_LOG_PREFIX)) continue;
      const uid = String(l.user_id);
      const arr = byUser.get(uid) ?? [];
      arr.push({ t: new Date(String(l.logged_at)).getTime(), slug: String(l.competition_slug) });
      byUser.set(uid, arr);
    }

    return assignments.map((a) => {
      const since = new Date(a.created_at).getTime();
      const perMember = members.map((m) => {
        const mlogs = byUser.get(m.id) ?? [];
        const done = mlogs.filter((l) => l.t >= since && (!a.event_slug || l.slug === a.event_slug)).length;
        return { id: m.id, name: m.name, done: Math.min(done, a.target_count), complete: done >= a.target_count };
      });
      return {
        assignment: a,
        perMember,
        completedCount: perMember.filter((p) => p.complete).length,
        totalMembers: members.length,
      };
    });
  } catch (e) {
    devErr("getChapterAssignmentBoard:", e);
    return [];
  }
}

/** Test percentage for a raw log row; null for unscored rows and Judge rounds. */
function pctOf(score: unknown, outOf: unknown, notes?: unknown): number | null {
  if (isJudgeNote(notes as string | null | undefined)) return null;
  if (score == null || outOf == null) return null;
  const o = Number(outOf);
  if (!o) return null;
  return Math.round((Number(score) / o) * 100);
}

/**
 * Aggregate every chapter member's practice logs into a leaderboard + trend.
 * Relies on the "Advisors read chapter member practice logs" RLS policy
 * (migration 0005), so only an advisor will get other members' rows back.
 */
export async function getChapterStats(chapterId: string): Promise<ChapterStats | null> {
  const supa = getSupabase();
  if (!supa) return null;
  try {
    const { data: profiles, error: pErr } = await supa
      .from("profiles")
      .select("id, display_name, email, role")
      .eq("chapter_id", chapterId)
      .neq("role", "advisor"); // advisors run the chapter, they are not competing members

    if (pErr || !profiles?.length) {
      if (pErr) devErr("getChapterStats profiles:", pErr);
      return null;
    }

    const memberIds = profiles.map((p) => p.id as string);

    const { data: logs, error: lErr } = await supa
      .from("practice_logs")
      .select("user_id, competition_slug, score, out_of, logged_at, notes")
      .in("user_id", memberIds)
      .order("logged_at", { ascending: false })
      .limit(2000);

    if (lErr) devErr("getChapterStats logs:", lErr);
    const allLogs = (logs ?? []) as Record<string, unknown>[];

    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;
    const now = Date.now();
    const sevenAgo = now - weekMs;

    // Per-member aggregation.
    const statById = new Map<string, MemberStat>();
    const pctSum = new Map<string, number>();
    for (const p of profiles) {
      statById.set(p.id as string, {
        id: p.id as string,
        name: (p.display_name as string)?.trim() || (p.email as string)?.split("@")[0] || "Member",
        email: (p.email as string) ?? null,
        role: (p.role as string) ?? "member",
        tests: 0,
        scoredTests: 0,
        avgPct: null,
        bestPct: null,
        lastActiveAt: null,
        last7: 0,
      });
    }

    for (const l of allLogs) {
      const s = statById.get(String(l.user_id));
      if (!s) continue;
      s.tests += 1;
      const loggedAt = String(l.logged_at);
      if (new Date(loggedAt).getTime() >= sevenAgo) s.last7 += 1;
      if (!s.lastActiveAt || loggedAt > s.lastActiveAt) s.lastActiveAt = loggedAt;
      const pct = pctOf(l.score, l.out_of, l.notes);
      if (pct != null) {
        s.scoredTests += 1;
        pctSum.set(s.id, (pctSum.get(s.id) ?? 0) + pct);
        if (s.bestPct == null || pct > s.bestPct) s.bestPct = pct;
      }
    }
    for (const s of statById.values()) {
      if (s.scoredTests > 0) s.avgPct = Math.round((pctSum.get(s.id) ?? 0) / s.scoredTests);
    }

    // Leaderboard: effort first (test count), then accuracy, then name.
    const members = Array.from(statById.values()).sort((a, b) => {
      if (b.tests !== a.tests) return b.tests - a.tests;
      const av = a.avgPct ?? -1;
      const bv = b.avgPct ?? -1;
      if (bv !== av) return bv - av;
      return a.name.localeCompare(b.name);
    });

    // Chapter headline numbers.
    const scoredPcts = allLogs.map((l) => pctOf(l.score, l.out_of, l.notes)).filter((p): p is number => p != null);
    const chapterAvgPct = scoredPcts.length
      ? Math.round(scoredPcts.reduce((a, b) => a + b, 0) / scoredPcts.length)
      : null;
    const activeThisWeek = members.filter((m) => m.last7 > 0).length;

    // Weekly trend: 8 rolling 7-day buckets ending today, oldest -> newest.
    // One pass over the logs (was 8 filter passes, each re-parsing every timestamp).
    const todayMid = new Date();
    todayMid.setHours(0, 0, 0, 0);
    const endExclusive = todayMid.getTime() + dayMs; // include all of today
    const oldestStart = endExclusive - 8 * weekMs;
    const bTests = new Array(8).fill(0);
    const bSum = new Array(8).fill(0);
    const bCount = new Array(8).fill(0);
    for (const l of allLogs) {
      const t = new Date(String(l.logged_at)).getTime();
      if (t < oldestStart || t >= endExclusive) continue;
      const idx = Math.floor((t - oldestStart) / weekMs); // 0 = oldest bucket, 7 = newest
      if (idx < 0 || idx > 7) continue;
      bTests[idx] += 1;
      const pct = pctOf(l.score, l.out_of, l.notes);
      if (pct != null) { bSum[idx] += pct; bCount[idx] += 1; }
    }
    const weekly: WeeklyPoint[] = [];
    for (let idx = 0; idx < 8; idx++) {
      weekly.push({
        weekStart: new Date(oldestStart + idx * weekMs).toISOString().slice(0, 10),
        tests: bTests[idx],
        avgPct: bCount[idx] ? Math.round(bSum[idx] / bCount[idx]) : null,
      });
    }

    // Top events by practice volume.
    const eventCount = new Map<string, number>();
    for (const l of allLogs) {
      const slug = String(l.competition_slug);
      eventCount.set(slug, (eventCount.get(slug) ?? 0) + 1);
    }
    const topEvents = Array.from(eventCount.entries())
      .map(([slug, tests]) => ({ slug, tests }))
      .sort((a, b) => b.tests - a.tests)
      .slice(0, 5);

    return {
      members,
      totalTests: allLogs.length,
      activeThisWeek,
      chapterAvgPct,
      weekly,
      topEvents,
    };
  } catch (e) {
    devErr("getChapterStats:", e);
    return null;
  }
}

// ── Readiness report (advisor) ────────────────────────────────

/**
 * The thresholds behind each member's readiness status. The report's "How
 * status is decided" panel is generated from these same numbers, so the rule
 * the advisor reads is always the rule the code runs.
 */
export const READINESS_RULE = {
  /** Scored tests averaged for "Avg" (most recent first). */
  avgWindow: 5,
  /** Ready: at least this many practice sessions (tests plus Judge rounds) for the event. */
  readySessions: 5,
  /** Ready: practiced the event within this many days. */
  readyRecentDays: 7,
  /** Needs attention: no practice for the event in more than this many days. */
  staleDays: 14,
  /** Needs attention: fewer practice sessions than this for the event. */
  minSessions: 2,
  /** Test average (percent) needed for Ready, and the floor below which it needs attention. */
  testReadyPct: 80,
  testAttentionPct: 60,
  /** Latest Judge score (out of 100) needed for Ready, and its attention floor. */
  judgeReady: 70,
  judgeAttention: 50,
  /** Trend compares the average of the latest N scored tests with the N before them. */
  trendWindow: 3,
  /** A change smaller than this many points reads as steady. */
  trendMinDelta: 5,
  /** A topic needs at least this many questions answered before it can rank as weak. */
  weakMinSeen: 2,
  /** Weak topics shown per member. */
  weakCount: 3,
} as const;

export type ReadinessStatus = "attention" | "on-track" | "ready";

export const READINESS_LABEL: Record<ReadinessStatus, string> = {
  attention: "Needs attention",
  "on-track": "On track",
  ready: "Ready",
};

export type ReadinessWeakTopic = { topic: string; correct: number; total: number; pct: number };

export type ReadinessRow = {
  id: string;
  name: string;
  email: string | null;
  eventSlug: string | null;
  eventName: string | null;
  /** The event has an objective test part (AI practice tests apply). */
  expectsTest: boolean;
  /** The event has a judged part (role play, presentation, interview). */
  expectsJudge: boolean;
  testsTotal: number;
  testsLast7: number;
  scoredTests: number;
  /** Average of the latest READINESS_RULE.avgWindow scored tests. */
  avgTestPct: number | null;
  /** Latest-window average minus the window before it; null until there are enough tests. */
  trendDelta: number | null;
  judgeRounds: number;
  latestJudge: { score: number; mode: JudgeLogMode; qaTotal: number | null; loggedAt: string } | null;
  weakTopics: ReadinessWeakTopic[];
  lastPracticeAt: string | null;
  daysSinceLast: number | null;
  status: ReadinessStatus;
  /** Plain-language reasons for the status, in the order the rule checks them. */
  reasons: string[];
};

export type ChapterReadiness = {
  rows: ReadinessRow[];
  /** False until migration 0019 (practice_logs.topic_results) is applied. */
  topicsAvailable: boolean;
};

type ReadinessLog = {
  slug: string;
  score: number | null;
  outOf: number | null;
  notes: string;
  t: number;
  loggedAt: string;
  topics: TopicResult[] | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE = 1000; // PostgREST's default max-rows; page past it instead of silently truncating.
const MAX_LOG_ROWS = 10000;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Pure: turn one member's logs into a readiness row. Exported for tests. */
export function computeReadinessRow(
  member: { id: string; name: string; email: string | null; eventSlug: string | null },
  logs: ReadinessLog[],
  now = Date.now()
): ReadinessRow {
  const R = READINESS_RULE;
  const comp = member.eventSlug ? getCompetition(member.eventSlug) ?? null : null;
  const expectsTest = comp ? hasObjectiveTest(comp) : false;
  const expectsJudge = comp ? judgeModeFor(comp.format) !== null : false;

  // Every number is for the registered event; with no event picked, use everything.
  const scoped = (member.eventSlug ? logs.filter((l) => l.slug === member.eventSlug) : logs)
    .slice()
    .sort((a, b) => b.t - a.t);
  const tests = scoped.filter((l) => !isJudgeNote(l.notes));
  const judges = scoped.filter((l) => isJudgeNote(l.notes) && l.score != null);
  const scored = tests.filter((l) => isScoredTest(l));
  const pcts = scored.map((l) => Math.round(((l.score as number) / (l.outOf as number)) * 100));
  const mean = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

  const avgTestPct = mean(pcts.slice(0, R.avgWindow));
  let trendDelta: number | null = null;
  if (pcts.length > R.trendWindow) {
    const recent = mean(pcts.slice(0, R.trendWindow));
    const prior = mean(pcts.slice(R.trendWindow, R.trendWindow * 2));
    if (recent != null && prior != null) trendDelta = recent - prior;
  }

  const latestJudgeLog = judges[0] ?? null;
  const parsed = latestJudgeLog ? parseJudgeNote(latestJudgeLog.notes) : null;
  const latestJudge = latestJudgeLog && parsed
    ? { score: latestJudgeLog.score as number, mode: parsed.mode, qaTotal: parsed.qaTotal, loggedAt: latestJudgeLog.loggedAt }
    : null;

  // Weak topics: test tallies only (Judge criteria are points, not questions).
  const topicMap = new Map<string, { correct: number; total: number }>();
  for (const l of tests) {
    for (const r of l.topics ?? []) {
      const cur = topicMap.get(r.topic) ?? { correct: 0, total: 0 };
      cur.correct += r.correct;
      cur.total += r.total;
      topicMap.set(r.topic, cur);
    }
  }
  const weakTopics = Array.from(topicMap.entries())
    .filter(([, s]) => s.total >= R.weakMinSeen)
    .map(([topic, s]) => ({ topic, correct: s.correct, total: s.total, pct: Math.round((s.correct / s.total) * 100) }))
    .sort((a, b) => a.pct - b.pct || b.total - a.total)
    .slice(0, R.weakCount);

  const lastPracticeAt = scoped[0]?.loggedAt ?? null;
  const daysSinceLast = scoped[0] ? Math.max(0, Math.floor((now - scoped[0].t) / DAY_MS)) : null;
  const sessions = tests.length + judges.length;
  const testsLast7 = tests.filter((l) => l.t >= now - 7 * DAY_MS).length;

  // ── The rule. Any "attention" reason wins; otherwise Ready needs every bar. ──
  const attention: string[] = [];
  if (!member.eventSlug) attention.push("No event picked yet");
  if (daysSinceLast == null) attention.push(member.eventSlug ? "No practice logged for this event" : "No practice logged");
  else if (daysSinceLast > R.staleDays) attention.push(`No practice in ${plural(daysSinceLast, "day")}`);
  if (daysSinceLast != null && sessions < R.minSessions) attention.push(`Only ${plural(sessions, "practice session")}`);
  if (avgTestPct != null && avgTestPct < R.testAttentionPct) attention.push(`Test average ${avgTestPct}% is under ${R.testAttentionPct}%`);
  if (latestJudge && latestJudge.score < R.judgeAttention) attention.push(`Latest Judge score ${latestJudge.score} is under ${R.judgeAttention}`);

  let status: ReadinessStatus;
  let reasons: string[];
  if (attention.length) {
    status = "attention";
    reasons = attention;
  } else {
    const gaps: string[] = [];
    if (sessions < R.readySessions) gaps.push(`${sessions} of ${R.readySessions} practice sessions`);
    if (daysSinceLast != null && daysSinceLast > R.readyRecentDays) gaps.push(`Last practice ${plural(daysSinceLast, "day")} ago`);
    if (expectsTest || avgTestPct != null) {
      if (avgTestPct == null) gaps.push("No scored tests yet");
      else if (avgTestPct < R.testReadyPct) gaps.push(`Test average ${avgTestPct}%, Ready at ${R.testReadyPct}%`);
    }
    if (expectsJudge || latestJudge) {
      if (!latestJudge) gaps.push("No Judge round yet");
      else if (latestJudge.score < R.judgeReady) gaps.push(`Latest Judge ${latestJudge.score}, Ready at ${R.judgeReady}`);
    }
    status = gaps.length ? "on-track" : "ready";
    reasons = gaps.length ? gaps : ["Meets every Ready bar"];
  }

  return {
    id: member.id,
    name: member.name,
    email: member.email,
    eventSlug: member.eventSlug,
    eventName: comp?.name ?? member.eventSlug,
    expectsTest,
    expectsJudge,
    testsTotal: tests.length,
    testsLast7,
    scoredTests: scored.length,
    avgTestPct,
    trendDelta,
    judgeRounds: judges.length,
    latestJudge,
    weakTopics,
    lastPracticeAt,
    daysSinceLast,
    status,
    reasons,
  };
}

/**
 * Advisor readiness report: one row per chapter member (advisor excluded).
 * Reads member practice_logs under the "Advisors read chapter member practice
 * logs" policy (0006, advises_user), so only the caller's own chapter comes
 * back; the member id list is also scoped to this chapter's profiles. Works
 * before migration 0019: without topic_results it re-reads without the column
 * and reports no weak topics.
 */
export async function getChapterReadiness(chapterId: string): Promise<ChapterReadiness | null> {
  const supa = getSupabase();
  if (!supa) return null;
  try {
    const { data: profiles, error: pErr } = await supa
      .from("profiles")
      .select("id, display_name, email")
      .eq("chapter_id", chapterId)
      .neq("role", "advisor");
    if (pErr) { devErr("getChapterReadiness profiles:", pErr); return null; }
    if (!profiles?.length) return { rows: [], topicsAvailable: true };
    const memberIds = profiles.map((p) => p.id as string);

    const { data: regs, error: rErr } = await supa
      .from("registrations")
      .select("user_id, competition_slug, created_at")
      .in("user_id", memberIds)
      .order("created_at", { ascending: false });
    if (rErr) devErr("getChapterReadiness regs:", rErr);
    const eventByUser = new Map<string, string>();
    for (const r of regs ?? []) {
      const uid = String(r.user_id);
      if (!eventByUser.has(uid)) eventByUser.set(uid, String(r.competition_slug)); // newest pick wins
    }

    const base = "user_id, competition_slug, score, out_of, notes, logged_at";
    let topicsAvailable = true;
    const rows: Record<string, unknown>[] = [];
    for (let from = 0; from < MAX_LOG_ROWS; from += PAGE) {
      const fetchPage = (cols: string) =>
        supa
          .from("practice_logs")
          .select(cols)
          .in("user_id", memberIds)
          .order("logged_at", { ascending: false })
          .order("id", { ascending: true })
          .range(from, from + PAGE - 1);
      let res = await fetchPage(topicsAvailable ? `${base}, topic_results` : base);
      if (topicsAvailable && isMissingTopicColumn(res.error)) {
        topicsAvailable = false;
        res = await fetchPage(base);
      }
      if (res.error) { devErr("getChapterReadiness logs:", res.error); break; }
      const page = (res.data ?? []) as unknown as Record<string, unknown>[];
      rows.push(...page);
      if (page.length < PAGE) break;
    }

    const logsByUser = new Map<string, ReadinessLog[]>();
    for (const l of rows) {
      const uid = String(l.user_id);
      const loggedAt = String(l.logged_at);
      const arr = logsByUser.get(uid) ?? [];
      arr.push({
        slug: String(l.competition_slug),
        score: l.score == null ? null : Number(l.score),
        outOf: l.out_of == null ? null : Number(l.out_of),
        notes: (l.notes as string) ?? "",
        t: new Date(loggedAt).getTime(),
        loggedAt,
        topics: parseTopicResults(l.topic_results),
      });
      logsByUser.set(uid, arr);
    }

    const now = Date.now();
    return {
      topicsAvailable,
      rows: profiles.map((p) =>
        computeReadinessRow(
          {
            id: p.id as string,
            name: (p.display_name as string)?.trim() || (p.email as string)?.split("@")[0] || "Member",
            email: (p.email as string) ?? null,
            eventSlug: eventByUser.get(p.id as string) ?? null,
          },
          logsByUser.get(p.id as string) ?? [],
          now
        )
      ),
    };
  } catch (e) {
    devErr("getChapterReadiness:", e);
    return null;
  }
}
