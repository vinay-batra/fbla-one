/**
 * Mock Regionals: a live, timed, chapter-wide test an advisor runs at a meeting.
 *
 * Data lives in migration 0018 (mock_sessions + mock_participants). The answer
 * key never reaches a student's browser while the test is running: students get
 * the paper through the mock_get_paper RPC (no `correct` field), turn it in
 * through mock_submit (graded server-side), and the key is released by
 * mock_review only once time is called. Columns are always named explicitly
 * because the `questions` and `answers` columns carry no select grant.
 *
 * Question generation shares the coach's pipeline (components/coach/engine):
 * the same parsing, calculator re-key, second-model answer check and shuffle.
 */

import { getSupabase } from "./supabase";
import { getMyProfile, getChapterById, type ChapterInfo, type ChapterProfile } from "./chapter";
import { buildPaper } from "@/components/coach/engine";

// ── Types ──────────────────────────────────────────────────────

export type Option = "A" | "B" | "C" | "D";
export const OPTION_KEYS: Option[] = ["A", "B", "C", "D"];

/** A question as generated and stored (host side, includes the key). */
export type MockQuestion = {
  question: string;
  options: Record<Option, string>;
  correct: Option;
  explanation: string;
  topic?: string;
  calc?: string;
};

/** A question as a student sees it during the test (no key). */
export type PaperQuestion = { question: string; options: Record<Option, string> };

/** Answers keyed by zero-based question index, as the DB stores them. */
export type AnswerMap = Record<string, Option>;

export type MockStatus = "lobby" | "live" | "ended";

export type MockSession = {
  id: string;
  chapter_id: string;
  host_id: string;
  code: string;
  event_slug: string;
  question_count: number;
  duration_sec: number;
  status: MockStatus;
  created_at: string;
  started_at: string | null;
  ends_at: string | null;
  ended_at: string | null;
};

export type MockParticipant = {
  id: string;
  session_id: string;
  user_id: string;
  display_name: string;
  score: number | null;
  submitted_at: string | null;
  joined_at: string;
};

export type Paper = {
  status: MockStatus;
  endsAt: string | null;
  serverNow: string;
  questions: PaperQuestion[];
  joined: boolean;
  myAnswers: AnswerMap;
  submitted: boolean;
};

export type Review = {
  questions: MockQuestion[];
  myAnswers: AnswerMap;
  myScore: number | null;
  submitted: boolean;
};

export type QuestionStat = { index: number; correct: number; answered: number; graded: number };

export type RankedParticipant = MockParticipant & { rank: number };

export type MockContext = {
  userId: string;
  profile: ChapterProfile | null;
  chapter: ChapterInfo | null;
  isHost: boolean; // advisor who owns this chapter
};

// Column lists. Never use select("*"): questions / answers are not granted.
const SESSION_COLS =
  "id, chapter_id, host_id, code, event_slug, question_count, duration_sec, status, created_at, started_at, ends_at, ended_at";
const PARTICIPANT_COLS = "id, session_id, user_id, display_name, score, submitted_at, joined_at";

export const QUESTION_COUNTS = [10, 20, 30] as const;
export const TIME_LIMITS_MIN = [5, 10, 15, 20, 30, 45] as const;
export const CODE_LENGTH = 6;
const CODE_ALPHABET = /[^ABCDEFGHJKMNPQRSTVWXYZ23456789]/g;

// ── Small helpers ─────────────────────────────────────────────

function devErr(label: string, e: unknown) {
  if (process.env.NODE_ENV !== "production") console.error(label, e);
}

function errMessage(e: { message?: string } | null | undefined, fallback: string): string {
  const m = e?.message ?? "";
  if (!m) return fallback;
  if (/could not find the function|schema cache|does not exist/i.test(m)) {
    return "Mock Regionals is not set up on the server yet (migration 0018).";
  }
  return m.charAt(0).toUpperCase() + m.slice(1);
}

/** Uppercase and strip anything outside the join-code alphabet (no I, O, 0 or 1). */
export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(CODE_ALPHABET, "").slice(0, CODE_LENGTH);
}

/** The QR and share link: the public /mock/CODE route, which survives sign-in. */
export function joinUrl(code: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://chapterprep.com";
  return `${origin}/mock/${code}`;
}

export function qrUrl(data: string, size: number): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&data=${encodeURIComponent(data)}`;
}

/** M:SS for a remaining-time countdown. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

/** Score first, then the earlier turn-in wins. Ties on both share a rank. */
export function rankParticipants(list: MockParticipant[]): RankedParticipant[] {
  const graded = list
    .filter((p) => p.score != null && p.submitted_at)
    .sort((a, b) => {
      if ((b.score ?? 0) !== (a.score ?? 0)) return (b.score ?? 0) - (a.score ?? 0);
      return new Date(a.submitted_at!).getTime() - new Date(b.submitted_at!).getTime();
    });
  const out: RankedParticipant[] = [];
  graded.forEach((p, i) => {
    const prev = out[i - 1];
    const tied = prev && prev.score === p.score && prev.submitted_at === p.submitted_at;
    out.push({ ...p, rank: tied ? prev.rank : i + 1 });
  });
  return out;
}

export function chapterAverage(list: MockParticipant[], total: number): number | null {
  const scores = list.filter((p) => p.score != null).map((p) => p.score as number);
  if (!scores.length || !total) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length / total) * 100);
}

// ── Question generation (the coach's pipeline) ────────────────

/**
 * Write a paper through the coach's pipeline (components/coach/engine): the
 * generator streams from /api/practice-test, the calculator re-keys computed
 * answers, and a second model (/api/verify-questions, claude-sonnet-5) solves
 * each question blind and audits its key. Dropped questions are replaced by
 * top-up batches. onProgress receives the number of questions on the paper so
 * far. If the checker is unavailable, the paper falls back to the calculator
 * check alone rather than failing the advisor.
 */
export async function generateMockQuestions(
  slug: string,
  count: number,
  onProgress: (n: number) => void,
  signal?: AbortSignal
): Promise<MockQuestion[]> {
  const ctrl = new AbortController();
  const forward = () => ctrl.abort();
  if (signal?.aborted) ctrl.abort();
  signal?.addEventListener("abort", forward);
  try {
    const { questions } = await buildPaper({
      slug,
      target: count,
      // Ask for a little extra up front: the checker sets some aside.
      batches: [{ count: Math.min(50, count + Math.ceil(count * 0.2)) }],
      signal: ctrl.signal,
      onProgress: (p) => onProgress(p.kept),
    });
    return questions.slice(0, count).map((q) => ({
      question: q.question,
      options: q.options,
      correct: q.correct,
      explanation: q.explanation,
      topic: q.topic,
    }));
  } finally {
    signal?.removeEventListener("abort", forward);
  }
}

// ── Context ───────────────────────────────────────────────────

export async function getMockContext(): Promise<MockContext | null> {
  const supa = getSupabase();
  if (!supa) return null;
  try {
    const { data } = await supa.auth.getUser();
    const user = data.user;
    if (!user) return null;
    const profile = await getMyProfile(user.id);
    const chapter = profile?.chapter_id ? await getChapterById(profile.chapter_id) : null;
    const isHost = !!chapter && chapter.advisor_user_id === user.id && profile?.role === "advisor";
    return { userId: user.id, profile, chapter, isHost };
  } catch (e) {
    devErr("getMockContext:", e);
    return null;
  }
}

/** Milliseconds to add to Date.now() to get the database clock. */
export async function getServerOffset(): Promise<number> {
  const supa = getSupabase();
  if (!supa) return 0;
  try {
    const t0 = Date.now();
    const { data, error } = await supa.rpc("mock_server_time");
    const t1 = Date.now();
    if (error || !data) return 0;
    return new Date(String(data)).getTime() - (t0 + t1) / 2;
  } catch {
    return 0;
  }
}

// ── Sessions ──────────────────────────────────────────────────

export async function createMockSession(
  eventSlug: string,
  questions: MockQuestion[],
  durationSec: number
): Promise<{ id: string; code: string } | { error: string }> {
  const supa = getSupabase();
  if (!supa) return { error: "Sign in to host a session." };
  const { data, error } = await supa.rpc("mock_create_session", {
    p_event_slug: eventSlug,
    p_questions: questions,
    p_duration_sec: durationSec,
  });
  if (error || !data) {
    devErr("createMockSession:", error);
    return { error: errMessage(error, "Could not create the session.") };
  }
  const row = data as { id: string; code: string };
  return { id: String(row.id), code: String(row.code) };
}

export async function getSession(id: string): Promise<MockSession | null> {
  const supa = getSupabase();
  if (!supa) return null;
  const { data, error } = await supa.from("mock_sessions").select(SESSION_COLS).eq("id", id).maybeSingle();
  if (error) devErr("getSession:", error);
  return (data as MockSession | null) ?? null;
}

/** RLS limits this to the caller's own chapter, so a code from elsewhere finds nothing. */
export async function findSessionByCode(code: string): Promise<MockSession | null> {
  const supa = getSupabase();
  if (!supa) return null;
  const { data, error } = await supa
    .from("mock_sessions")
    .select(SESSION_COLS)
    .eq("code", normalizeCode(code))
    .maybeSingle();
  if (error) devErr("findSessionByCode:", error);
  return (data as MockSession | null) ?? null;
}

export async function listChapterSessions(chapterId: string, limit = 12): Promise<MockSession[]> {
  const supa = getSupabase();
  if (!supa) return [];
  const { data, error } = await supa
    .from("mock_sessions")
    .select(SESSION_COLS)
    .eq("chapter_id", chapterId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) devErr("listChapterSessions:", error);
  return (data as MockSession[] | null) ?? [];
}

export async function startSession(id: string): Promise<string | null> {
  const supa = getSupabase();
  if (!supa) return "Not signed in.";
  const { error } = await supa.rpc("mock_start_session", { p_session: id });
  return error ? errMessage(error, "Could not start the session.") : null;
}

export async function endSession(id: string): Promise<string | null> {
  const supa = getSupabase();
  if (!supa) return "Not signed in.";
  const { error } = await supa.rpc("mock_end_session", { p_session: id });
  return error ? errMessage(error, "Could not end the session.") : null;
}

export async function deleteSession(id: string): Promise<boolean> {
  const supa = getSupabase();
  if (!supa) return false;
  const { error } = await supa.from("mock_sessions").delete().eq("id", id);
  if (error) devErr("deleteSession:", error);
  return !error;
}

// ── Participants ──────────────────────────────────────────────

export async function listParticipants(sessionId: string): Promise<MockParticipant[]> {
  const supa = getSupabase();
  if (!supa) return [];
  const { data, error } = await supa
    .from("mock_participants")
    .select(PARTICIPANT_COLS)
    .eq("session_id", sessionId)
    .order("joined_at", { ascending: true });
  if (error) devErr("listParticipants:", error);
  return (data as MockParticipant[] | null) ?? [];
}

/** Join as the signed-in member. Joining twice is treated as success. */
export async function joinSession(sessionId: string, userId: string): Promise<string | null> {
  const supa = getSupabase();
  if (!supa) return "Not signed in.";
  const { error } = await supa.from("mock_participants").insert({ session_id: sessionId, user_id: userId });
  if (!error || error.code === "23505") return null;
  devErr("joinSession:", error);
  if (error.code === "42501" || /row-level security/i.test(error.message ?? "")) {
    return "This session is closed to new players, or it belongs to another chapter.";
  }
  return errMessage(error, "Could not join.");
}

export async function removeParticipant(participantId: string): Promise<boolean> {
  const supa = getSupabase();
  if (!supa) return false;
  const { error } = await supa.from("mock_participants").delete().eq("id", participantId);
  if (error) devErr("removeParticipant:", error);
  return !error;
}

// ── Taking the test ───────────────────────────────────────────

export async function getPaper(sessionId: string): Promise<Paper | null> {
  const supa = getSupabase();
  if (!supa) return null;
  const { data, error } = await supa.rpc("mock_get_paper", { p_session: sessionId });
  if (error || !data) {
    devErr("getPaper:", error);
    return null;
  }
  const d = data as Record<string, unknown>;
  return {
    status: d.status as MockStatus,
    endsAt: (d.ends_at as string | null) ?? null,
    serverNow: String(d.server_now),
    questions: (d.questions as PaperQuestion[]) ?? [],
    joined: Boolean(d.joined),
    myAnswers: (d.my_answers as AnswerMap) ?? {},
    submitted: Boolean(d.submitted),
  };
}

/** Autosave a draft so a dead laptop does not lose the test. Best effort. */
export async function saveDraft(sessionId: string, userId: string, answers: AnswerMap): Promise<void> {
  const supa = getSupabase();
  if (!supa) return;
  const { error } = await supa
    .from("mock_participants")
    .update({ answers })
    .eq("session_id", sessionId)
    .eq("user_id", userId);
  if (error) devErr("saveDraft:", error);
}

export async function submitAnswers(
  sessionId: string,
  answers: AnswerMap
): Promise<{ score: number; total: number } | { error: string }> {
  const supa = getSupabase();
  if (!supa) return { error: "Not signed in." };
  const { data, error } = await supa.rpc("mock_submit", { p_session: sessionId, p_answers: answers });
  if (error || !data) return { error: errMessage(error, "Could not turn in your test.") };
  const d = data as { score: number; total: number };
  return { score: Number(d.score), total: Number(d.total) };
}

// ── Results ───────────────────────────────────────────────────

export async function getReview(sessionId: string): Promise<Review | null> {
  const supa = getSupabase();
  if (!supa) return null;
  const { data, error } = await supa.rpc("mock_review", { p_session: sessionId });
  if (error || !data) {
    devErr("getReview:", error);
    return null;
  }
  const d = data as Record<string, unknown>;
  return {
    questions: (d.questions as MockQuestion[]) ?? [],
    myAnswers: (d.my_answers as AnswerMap) ?? {},
    myScore: d.my_score == null ? null : Number(d.my_score),
    submitted: Boolean(d.submitted),
  };
}

export async function getQuestionStats(sessionId: string): Promise<QuestionStat[]> {
  const supa = getSupabase();
  if (!supa) return [];
  const { data, error } = await supa.rpc("mock_question_stats", { p_session: sessionId });
  if (error) {
    devErr("getQuestionStats:", error);
    return [];
  }
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    index: Number(r.q_index),
    correct: Number(r.correct_count),
    answered: Number(r.answered_count),
    graded: Number(r.graded_count),
  }));
}

/** Lowest percent correct across everyone who turned in. */
export function hardestQuestion(stats: QuestionStat[]): (QuestionStat & { pct: number }) | null {
  const withPct = stats.filter((s) => s.graded > 0).map((s) => ({ ...s, pct: Math.round((s.correct / s.graded) * 100) }));
  if (!withPct.length) return null;
  return withPct.reduce((low, s) => (s.pct < low.pct ? s : low));
}
