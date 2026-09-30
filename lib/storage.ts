/**
 * Local-first storage with Supabase sync.
 *
 * Reads are always synchronous from localStorage (fast, works offline + in
 * preview mode). When a signed-in user is registered via setSyncUser(), every
 * mutation also fire-and-forgets to Supabase, and pullFromSupabase() merges the
 * server state down on sign-in (migrating any preview-mode data up first).
 */

import { getSupabase } from "./supabase";
import { getCompetition } from "./competitions";

export type PracticeLog = {
  id: string;
  competitionSlug: string;
  score: number | null;
  outOf: number | null;
  durationMin: number | null;
  notes: string;
  loggedAt: string;
};

export type SavedResource = {
  id: string;
  competitionSlug: string | null;
  title: string;
  url: string;
  note: string | null;
  createdAt: string;
};

export type Deadline = {
  id: string;
  title: string;
  competitionSlug: string | null;
  dueAt: string; // "YYYY-MM-DD"
  note: string | null;
  createdAt: string;
};

const KEYS = {
  registered: "fbla_registered_competitions",
  practice: "fbla_practice_logs",
  saved: "fbla_saved_resources",
  displayName: "fbla_display_name",
  chapterName: "fbla_chapter_name",
  deadlines: "fbla_deadlines",
  chapterDeadlines: "fbla_chapter_deadlines",
  topicStats: "fbla_topic_stats",
  milestones: "fbla_milestones",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("fbla:storage-change", { detail: { key } }));
  } catch {
    /* quota or private-mode failure - ignore */
  }
}

/** Subscribe to storage changes across the same tab + cross-tab. */
export function onStorageChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const local = () => cb();
  const remote = (e: StorageEvent) => {
    if (e.key && (Object.values(KEYS) as string[]).includes(e.key)) cb();
  };
  window.addEventListener("fbla:storage-change", local);
  window.addEventListener("storage", remote);
  return () => {
    window.removeEventListener("fbla:storage-change", local);
    window.removeEventListener("storage", remote);
  };
}

/* ───── Supabase sync plumbing ───────────────────────────── */

let syncUserId: string | null = null;

/** Chapter context: when set to a chapter, deadlines become chapter-shared. */
let chapterCtx: { chapterId: string | null; role: string | null } = { chapterId: null, role: null };

export function setSyncUser(id: string | null): void {
  syncUserId = id;
}

export function setChapterContext(chapterId: string | null, role: string | null): void {
  chapterCtx = { chapterId, role };
}

export function isInChapter(): boolean {
  return Boolean(chapterCtx.chapterId);
}

/** Solo / preview users manage their own local deadlines; in a chapter only the advisor can. */
export function canManageDeadlines(): boolean {
  return !chapterCtx.chapterId || chapterCtx.role === "advisor";
}

function devError(label: string, e: unknown): void {
  if (process.env.NODE_ENV !== "production") console.error(label, e);
}

/** Pull server state, merge with any local (preview) data, push local-only up. */
export async function pullFromSupabase(userId: string): Promise<void> {
  const supa = getSupabase();
  if (!supa) return;
  setSyncUser(userId);

  // Chapter context + shared deadlines (set early so writes this session route correctly).
  try {
    const { data: prof } = await supa
      .from("profiles")
      .select("chapter_id, role")
      .eq("id", userId)
      .single();
    if (prof?.chapter_id) {
      setChapterContext(prof.chapter_id as string, (prof.role as string) ?? null);
      await syncChapterDeadlines();
    } else {
      setChapterContext(null, null);
    }
  } catch (e) {
    devError("pullFromSupabase chapter context:", e);
  }

  try {
    const [
      { data: regs, error: regsErr },
      { data: logs, error: logsErr },
      { data: saved, error: savedErr },
    ] = await Promise.all([
      supa.from("registrations").select("competition_slug").eq("user_id", userId),
      supa.from("practice_logs").select("id, competition_slug, score, out_of, duration_min, notes, logged_at").eq("user_id", userId).order("logged_at", { ascending: false }),
      supa.from("saved_resources").select("id, competition_slug, title, url, note, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);
    if (regsErr || logsErr || savedErr) devError("pullFromSupabase queries:", regsErr || logsErr || savedErr);

    // ── Registrations: single-event model. The server is the source of truth
    // when it has a pick; otherwise migrate the one local pick up. NEVER union -
    // a union resurrects a replaced/deleted event and breaks "one event".
    const remoteSlugs = (regs ?? []).map((r) => r.competition_slug as string);
    const localSlugs = getRegistered();
    if (remoteSlugs.length > 0) {
      write(KEYS.registered, [remoteSlugs[0]]);
    } else if (localSlugs.length > 0) {
      const slug = localSlugs[0];
      await supa.from("registrations").upsert(
        { user_id: userId, competition_slug: slug },
        { onConflict: "user_id,competition_slug" }
      );
      write(KEYS.registered, [slug]);
    } else {
      write(KEYS.registered, []);
    }

    // ── Practice logs: union by id, push local-only up ──
    const remoteLogs: PracticeLog[] = (logs ?? []).map(dbToLog);
    const remoteLogIds = new Set(remoteLogs.map((l) => l.id));
    const localLogs = getPracticeLogs();
    const onlyLocalLogs = localLogs.filter((l) => !remoteLogIds.has(l.id));
    if (onlyLocalLogs.length) {
      // upsert (not insert) so an id already present remotely - e.g. a just-added
      // log whose async insert raced this pull, or a concurrent DataSync run -
      // is a no-op instead of failing the whole batch (23505) and dropping the
      // genuinely-new rows with it.
      await supa.from("practice_logs").upsert(
        onlyLocalLogs.map((l) => logToDb(l, userId)),
        { onConflict: "id", ignoreDuplicates: true }
      );
    }
    const mergedLogs = [...remoteLogs, ...onlyLocalLogs].sort(
      (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
    );
    write(KEYS.practice, mergedLogs);

    // ── Saved resources: union by id, push local-only up ──
    const remoteSaved: SavedResource[] = (saved ?? []).map(dbToSaved);
    const remoteSavedIds = new Set(remoteSaved.map((r) => r.id));
    const localSaved = getSavedResources();
    const onlyLocalSaved = localSaved.filter((r) => !remoteSavedIds.has(r.id));
    if (onlyLocalSaved.length) {
      await supa.from("saved_resources").upsert(
        onlyLocalSaved.map((r) => savedToDb(r, userId)),
        { onConflict: "id", ignoreDuplicates: true }
      );
    }
    write(KEYS.saved, [...remoteSaved, ...onlyLocalSaved]);
  } catch (e) {
    devError("pullFromSupabase failed:", e);
  }
}

/**
 * Ensure the user's profile row exists (insert-only, never clobbers edits).
 * App-side fallback because a DB trigger on auth.users can't be reliably
 * created from the SQL editor (postgres doesn't own auth.users).
 */
export async function ensureProfile(userId: string, email: string | null, name: string | null): Promise<void> {
  const supa = getSupabase();
  if (!supa) return;
  // The signup form stashes the chosen role here. It's only applied on the
  // first insert (ignoreDuplicates), so it sets the role exactly once at
  // account creation and never clobbers an existing profile.
  let role: "advisor" | "member" | undefined;
  try {
    const r = localStorage.getItem("fbla_pending_role");
    if (r === "advisor" || r === "member") role = r;
  } catch {}
  try {
    const row: Record<string, unknown> = { id: userId, email, display_name: name };
    if (role) row.role = role;
    await supa.from("profiles").upsert(row, { onConflict: "id", ignoreDuplicates: true });
    try {
      localStorage.removeItem("fbla_pending_role");
    } catch {}
  } catch (e) {
    devError("ensureProfile:", e);
  }
}

/** Clear sync user + wipe local app data (on sign-out). */
export function clearSyncedData(): void {
  setSyncUser(null);
  setChapterContext(null, null);
  write(KEYS.registered, []);
  write(KEYS.practice, []);
  write(KEYS.saved, []);
  write(KEYS.deadlines, []);
  write(KEYS.chapterDeadlines, []);
  // Personal profile fields are device-local; clear them so the next user on a
  // shared computer never sees the previous user's name / chapter / deadlines.
  write(KEYS.displayName, "");
  write(KEYS.chapterName, "");
}

function dbToLog(r: Record<string, unknown>): PracticeLog {
  return {
    id: String(r.id),
    competitionSlug: String(r.competition_slug),
    score: r.score == null ? null : Number(r.score),
    outOf: r.out_of == null ? null : Number(r.out_of),
    durationMin: r.duration_min == null ? null : Number(r.duration_min),
    notes: (r.notes as string) ?? "",
    loggedAt: String(r.logged_at),
  };
}

function logToDb(l: PracticeLog, userId: string) {
  return {
    id: l.id,
    user_id: userId,
    competition_slug: l.competitionSlug,
    score: l.score,
    out_of: l.outOf,
    duration_min: l.durationMin,
    notes: l.notes,
    logged_at: l.loggedAt,
  };
}

function dbToSaved(r: Record<string, unknown>): SavedResource {
  return {
    id: String(r.id),
    competitionSlug: (r.competition_slug as string) ?? null,
    title: String(r.title),
    url: String(r.url),
    note: (r.note as string) ?? null,
    createdAt: String(r.created_at),
  };
}

function savedToDb(r: SavedResource, userId: string) {
  return {
    id: r.id,
    user_id: userId,
    competition_slug: r.competitionSlug,
    title: r.title,
    url: r.url,
    note: r.note,
    created_at: r.createdAt,
  };
}

/* ───── Registered competitions ──────────────────────────── */
export function getRegistered(): string[] {
  return read<string[]>(KEYS.registered, []);
}

export function isRegistered(slug: string): boolean {
  return getRegistered().includes(slug);
}

export function registerCompetition(slug: string): void {
  const cur = getRegistered();
  if (cur.length === 1 && cur[0] === slug) return;
  // Single event: registering a new one REPLACES the current pick (people
  // compete in one event), so we keep exactly [slug].
  write(KEYS.registered, [slug]);
  if (syncUserId) {
    const supa = getSupabase();
    const others = cur.filter((s) => s !== slug);
    if (others.length) {
      supa?.from("registrations")
        .delete()
        .eq("user_id", syncUserId)
        .in("competition_slug", others)
        .then(({ error }) => error && devError("register replace sync:", error));
    }
    supa?.from("registrations")
      .upsert({ user_id: syncUserId, competition_slug: slug }, { onConflict: "user_id,competition_slug" })
      .then(({ error }) => error && devError("register sync:", error));
  }
}

export function unregisterCompetition(slug: string): void {
  const cur = getRegistered();
  write(KEYS.registered, cur.filter((s) => s !== slug));
  if (syncUserId) {
    const supa = getSupabase();
    supa?.from("registrations")
      .delete()
      .eq("user_id", syncUserId)
      .eq("competition_slug", slug)
      .then(({ error }) => error && devError("unregister sync:", error));
  }
}

export function toggleRegistration(slug: string): boolean {
  if (isRegistered(slug)) {
    unregisterCompetition(slug);
    return false;
  }
  registerCompetition(slug);
  return true;
}

/* ───── Practice logs ────────────────────────────────────── */
export function getPracticeLogs(): PracticeLog[] {
  return read<PracticeLog[]>(KEYS.practice, []);
}

export function addPracticeLog(log: Omit<PracticeLog, "id" | "loggedAt">): PracticeLog {
  const entry: PracticeLog = { ...log, id: cryptoId(), loggedAt: new Date().toISOString() };
  write(KEYS.practice, [entry, ...getPracticeLogs()]);
  if (syncUserId) {
    const supa = getSupabase();
    supa?.from("practice_logs")
      .insert(logToDb(entry, syncUserId))
      .then(({ error }) => error && devError("addPracticeLog sync:", error));
  }
  return entry;
}

export function removePracticeLog(id: string): void {
  write(KEYS.practice, getPracticeLogs().filter((l) => l.id !== id));
  if (syncUserId) {
    const supa = getSupabase();
    supa?.from("practice_logs")
      .delete()
      .eq("user_id", syncUserId)
      .eq("id", id)
      .then(({ error }) => error && devError("removePracticeLog sync:", error));
  }
}

/* ───── Topic mastery (weak-topic analysis) ──────────────────
   Per event, accumulate correct/total per topic across all tests, so we can
   surface a student's weakest topics and offer a targeted drill. Device-local
   (derived data); cheap to recompute as the student practices. */
export type TopicStat = { correct: number; total: number };
type TopicStatsMap = Record<string, Record<string, TopicStat>>;

export function getTopicStats(slug: string): Record<string, TopicStat> {
  return read<TopicStatsMap>(KEYS.topicStats, {})[slug] ?? {};
}

export function recordTopicResults(slug: string, results: { topic: string; correct: boolean }[]): void {
  if (!slug || results.length === 0) return;
  const all = read<TopicStatsMap>(KEYS.topicStats, {});
  const forSlug = { ...(all[slug] ?? {}) };
  // Canonicalize each topic against the event's known topic list so model drift
  // (trailing punctuation, rephrasing) can't spawn permanent near-duplicate keys
  // that grow the map unbounded and fragment the weak-topic analysis.
  const known = getCompetition(slug)?.topics ?? [];
  const canon = (t: string) => known.find((k) => k.toLowerCase() === t.trim().toLowerCase()) ?? t.trim();
  for (const r of results) {
    const t = canon(r.topic || "");
    if (!t) continue;
    const cur = forSlug[t] ?? { correct: 0, total: 0 };
    forSlug[t] = { correct: cur.correct + (r.correct ? 1 : 0), total: cur.total + 1 };
  }
  write(KEYS.topicStats, { ...all, [slug]: forSlug });
}

export type WeakTopic = { topic: string; correct: number; total: number; pct: number };

/** Topics seen at least `minSeen` times, weakest (lowest accuracy) first. */
export function getWeakTopics(slug: string, minSeen = 2): WeakTopic[] {
  const stats = getTopicStats(slug);
  return Object.entries(stats)
    .filter(([, s]) => s.total >= minSeen)
    .map(([topic, s]) => ({ topic, correct: s.correct, total: s.total, pct: Math.round((s.correct / s.total) * 100) }))
    .sort((a, b) => a.pct - b.pct || b.total - a.total);
}

/* ───── Competition milestones (Regionals -> States -> Nationals) ──── */
export type MilestoneLevel = "regionals" | "states" | "nationals";
export type Milestones = Partial<Record<MilestoneLevel, string>>; // ISO date strings

export function getMilestones(): Milestones {
  return read<Milestones>(KEYS.milestones, {});
}

export function setMilestone(level: MilestoneLevel, date: string | null): void {
  const cur = getMilestones();
  if (date) cur[level] = date;
  else delete cur[level];
  write(KEYS.milestones, cur);
}

/* ───── Saved resources ──────────────────────────────────── */
export function getSavedResources(): SavedResource[] {
  return read<SavedResource[]>(KEYS.saved, []);
}

export function addSavedResource(r: Omit<SavedResource, "id" | "createdAt">): SavedResource {
  const entry: SavedResource = { ...r, id: cryptoId(), createdAt: new Date().toISOString() };
  write(KEYS.saved, [entry, ...getSavedResources()]);
  if (syncUserId) {
    const supa = getSupabase();
    supa?.from("saved_resources")
      .insert(savedToDb(entry, syncUserId))
      .then(({ error }) => error && devError("addSavedResource sync:", error));
  }
  return entry;
}

export function removeSavedResource(id: string): void {
  write(KEYS.saved, getSavedResources().filter((r) => r.id !== id));
  if (syncUserId) {
    const supa = getSupabase();
    supa?.from("saved_resources")
      .delete()
      .eq("user_id", syncUserId)
      .eq("id", id)
      .then(({ error }) => error && devError("removeSavedResource sync:", error));
  }
}

/* ── Deadlines ───────────────────────────────────────── */
/**
 * Deadlines are chapter-shared when the user is in a chapter (read from a local
 * mirror of public.deadlines that syncChapterDeadlines keeps fresh; only the
 * advisor can write). Solo / preview users fall back to personal localStorage.
 */
function dbToDeadline(r: Record<string, unknown>): Deadline {
  return {
    id: String(r.id),
    title: String(r.title),
    competitionSlug: (r.competition_slug as string) ?? null,
    dueAt: String(r.due_at).slice(0, 10),
    note: (r.description as string) ?? null,
    createdAt: String(r.created_at),
  };
}

/** Pull the chapter's shared deadlines into the local mirror. */
export async function syncChapterDeadlines(): Promise<void> {
  const supa = getSupabase();
  if (!supa || !chapterCtx.chapterId) return;
  try {
    const { data, error } = await supa
      .from("deadlines")
      .select("id, title, competition_slug, due_at, description, created_at")
      .eq("chapter_id", chapterCtx.chapterId)
      .order("due_at", { ascending: true });
    if (error) { devError("syncChapterDeadlines:", error); return; }
    write(KEYS.chapterDeadlines, (data ?? []).map((r) => dbToDeadline(r as Record<string, unknown>)));
  } catch (e) {
    devError("syncChapterDeadlines:", e);
  }
}

export function getDeadlines(): Deadline[] {
  const key = chapterCtx.chapterId ? KEYS.chapterDeadlines : KEYS.deadlines;
  return read<Deadline[]>(key, []);
}

export function addDeadline(d: Omit<Deadline, "id" | "createdAt">): Deadline {
  const entry: Deadline = { ...d, id: cryptoId(), createdAt: new Date().toISOString() };

  // In a chapter: shared deadline, advisor-only, persisted to Supabase.
  if (chapterCtx.chapterId) {
    if (chapterCtx.role !== "advisor") return entry; // members cannot add (RLS blocks anyway)
    write(KEYS.chapterDeadlines, [entry, ...getDeadlines()]);
    const supa = getSupabase();
    if (supa && syncUserId) {
      supa
        .from("deadlines")
        .insert({
          chapter_id: chapterCtx.chapterId,
          title: entry.title,
          description: entry.note,
          due_at: entry.dueAt,
          competition_slug: entry.competitionSlug,
          created_by: syncUserId,
        })
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) { devError("addDeadline sync:", error); return; }
          if (data) {
            const server = dbToDeadline(data as Record<string, unknown>);
            write(KEYS.chapterDeadlines, getDeadlines().map((dl) => (dl.id === entry.id ? server : dl)));
          }
        });
    }
    return entry;
  }

  // Solo / preview: personal local deadline.
  write(KEYS.deadlines, [entry, ...getDeadlines()]);
  return entry;
}

export function removeDeadline(id: string): void {
  if (chapterCtx.chapterId) {
    if (chapterCtx.role !== "advisor") return; // members cannot remove
    write(KEYS.chapterDeadlines, getDeadlines().filter((dl) => dl.id !== id));
    const supa = getSupabase();
    supa?.from("deadlines").delete().eq("id", id)
      .then(({ error }) => error && devError("removeDeadline sync:", error));
    return;
  }
  write(KEYS.deadlines, getDeadlines().filter((dl) => dl.id !== id));
}

export function getUpcomingDeadlines(limit = 10): Deadline[] {
  const today = new Date().toISOString().slice(0, 10);
  return getDeadlines()
    .filter((dl) => dl.dueAt >= today)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .slice(0, limit);
}

/* ───── Profile (display name, chapter) ──────────────────── */
export function getDisplayName(): string {
  return read<string>(KEYS.displayName, "") || "";
}

export function setDisplayName(name: string): void {
  write(KEYS.displayName, name);
}

export function getChapterName(): string {
  return read<string>(KEYS.chapterName, "") || "";
}

export function setChapterName(name: string): void {
  write(KEYS.chapterName, name);
}

/* ───── Helpers ──────────────────────────────────────────── */
function cryptoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
