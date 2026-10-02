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

/**
 * Per-topic tally carried on a practice log (practice_logs.topic_results,
 * migration 0019). For an AI practice test: questions right / questions asked
 * per topic. For an AI Judge round: rating-sheet points earned / points
 * possible per criterion (judge rows are never mixed into weak-topic analysis).
 */
export type TopicResult = { topic: string; correct: number; total: number };

export type PracticeLog = {
  id: string;
  competitionSlug: string;
  score: number | null;
  outOf: number | null;
  durationMin: number | null;
  notes: string;
  loggedAt: string;
  /** Optional; absent on manual tracker rows and on logs written before 0019. */
  topicResults?: TopicResult[] | null;
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
  /** Which account the synced data on this device belongs to (absent = preview data). */
  dataOwner: "fbla_data_owner",
  /** When this device last pulled from the account: { userId, at }. */
  lastPull: "fbla_last_pull",
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

  // Stamp the pull with when the server was READ, so a row added while it was
  // in flight is never mistaken for one deleted elsewhere.
  const readAt = new Date().toISOString();
  try {
    const [
      { data: regs, error: regsErr },
      { data: logs, error: logsErr },
      { data: saved, error: savedErr },
    ] = await Promise.all([
      supa.from("registrations").select("competition_slug").eq("user_id", userId),
      selectOwnLogs(userId),
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

    // Rows that exist only on this device are either new (push them up) or were
    // deleted on another device after this one last synced (drop them, or they
    // come back). Anything created before this device's last pull for this same
    // account was on the server then, so if it is gone now it was deleted.
    const last = read<{ userId: string; at: string } | null>(KEYS.lastPull, null);
    const syncedBefore = last && last.userId === userId ? new Date(last.at).getTime() : null;
    const deletedElsewhere = (createdAt: string) =>
      syncedBefore != null && new Date(createdAt).getTime() < syncedBefore;

    // ── Practice logs: union by id, push local-only up ──
    const localLogs = getPracticeLogs();
    const localById = new Map(localLogs.map((l) => [l.id, l]));
    // A tally recorded while 0019 was not applied yet only exists locally; keep
    // it rather than letting the column-less remote copy erase it.
    const remoteLogs: PracticeLog[] = ((logs ?? []) as unknown as Record<string, unknown>[]).map((r) => {
      const remote = dbToLog(r);
      const local = localById.get(remote.id);
      if (!remote.topicResults && local?.topicResults?.length) remote.topicResults = local.topicResults;
      return remote;
    });
    const remoteLogIds = new Set(remoteLogs.map((l) => l.id));
    const onlyLocalLogs = localLogs.filter((l) => !remoteLogIds.has(l.id) && !deletedElsewhere(l.loggedAt));
    if (onlyLocalLogs.length) {
      // upsert (not insert) so an id already present remotely - e.g. a just-added
      // log whose async insert raced this pull, or a concurrent DataSync run -
      // is a no-op instead of failing the whole batch (23505) and dropping the
      // genuinely-new rows with it.
      await writeLogsToDb(onlyLocalLogs, userId, "upsert");
    }
    const mergedLogs = [...remoteLogs, ...onlyLocalLogs].sort(
      (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
    );
    write(KEYS.practice, mergedLogs);

    // ── Saved resources: union by id, push local-only up ──
    const remoteSaved: SavedResource[] = (saved ?? []).map(dbToSaved);
    const remoteSavedIds = new Set(remoteSaved.map((r) => r.id));
    const localSaved = getSavedResources();
    const onlyLocalSaved = localSaved.filter((r) => !remoteSavedIds.has(r.id) && !deletedElsewhere(r.createdAt));
    if (onlyLocalSaved.length) {
      await supa.from("saved_resources").upsert(
        onlyLocalSaved.map((r) => savedToDb(r, userId)),
        { onConflict: "id", ignoreDuplicates: true }
      );
    }
    write(KEYS.saved, [...remoteSaved, ...onlyLocalSaved]);
    // Only after a successful pull; a failed one must not mark rows as synced.
    if (!regsErr && !logsErr && !savedErr) write(KEYS.lastPull, { userId, at: readAt });
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
    // profiles.role cannot hold "advisor" until the user owns a chapter (0013
    // pins inserts to member; create_chapter promotes). Keep the sign-up
    // choice on the account so the app can show advisors the advisor setup.
    // UX only: user_metadata is user-editable and grants nothing.
    if (role) await supa.auth.updateUser({ data: { signup_role: role } }).catch(() => {});
    try {
      localStorage.removeItem("fbla_pending_role");
    } catch {}
  } catch (e) {
    devError("ensureProfile:", e);
  }
}

export { signedUpAsAdvisor, isAdvisorAccount } from "./roles";

/** The account whose data is in localStorage, or null for preview (no account) data. */
export function getDataOwner(): string | null {
  return read<string | null>(KEYS.dataOwner, null);
}

export function setDataOwner(userId: string | null): void {
  if (userId) write(KEYS.dataOwner, userId);
  else if (typeof window !== "undefined") {
    try { window.localStorage.removeItem(KEYS.dataOwner); } catch {}
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
  // Derived from this user's tests; the next person must not see them either.
  write(KEYS.topicStats, {});
  write(KEYS.milestones, {});
  write(KEYS.lastPull, null);
  setDataOwner(null);
}

function dbToLog(r: Record<string, unknown>): PracticeLog {
  const log: PracticeLog = {
    id: String(r.id),
    competitionSlug: String(r.competition_slug),
    score: r.score == null ? null : Number(r.score),
    outOf: r.out_of == null ? null : Number(r.out_of),
    durationMin: r.duration_min == null ? null : Number(r.duration_min),
    notes: (r.notes as string) ?? "",
    loggedAt: String(r.logged_at),
  };
  const topics = parseTopicResults(r.topic_results);
  if (topics) log.topicResults = topics;
  return log;
}

function logToDb(l: PracticeLog, userId: string, withTopics: boolean) {
  const row: Record<string, unknown> = {
    id: l.id,
    user_id: userId,
    competition_slug: l.competitionSlug,
    score: l.score,
    out_of: l.outOf,
    duration_min: l.durationMin,
    notes: l.notes,
    logged_at: l.loggedAt,
  };
  if (withTopics) row.topic_results = l.topicResults?.length ? l.topicResults : null;
  return row;
}

/* ───── topic_results column (migration 0019), with graceful fallback ─────
   The app ships before 0019 is applied. Until then PostgREST rejects any read
   or write that names topic_results (42703 on select, PGRST204 on insert). We
   detect that once, remember it for the session, and retry without the column,
   so a log is never lost and a pull never fails because of it. */

const LOG_COLS = "id, competition_slug, score, out_of, duration_min, notes, logged_at";
let topicColumnMissing = false;

type PgErr = { code?: string; message?: string } | null | undefined;

/** True when an error means the topic_results column does not exist yet. */
export function isMissingTopicColumn(err: PgErr): boolean {
  if (!err) return false;
  const msg = (err.message ?? "").toLowerCase();
  if (!msg.includes("topic_results")) return false;
  return (
    err.code === "42703" || err.code === "PGRST204" ||
    msg.includes("does not exist") || msg.includes("schema cache") || msg.includes("could not find")
  );
}

async function selectOwnLogs(userId: string) {
  const supa = getSupabase()!;
  const run = (cols: string) =>
    supa.from("practice_logs").select(cols).eq("user_id", userId).order("logged_at", { ascending: false });
  if (!topicColumnMissing) {
    const res = await run(`${LOG_COLS}, topic_results`);
    if (!isMissingTopicColumn(res.error)) return res;
    topicColumnMissing = true;
  }
  return run(LOG_COLS);
}

/** Insert (or upsert-ignore) practice logs, falling back to no topic_results. */
async function writeLogsToDb(logs: PracticeLog[], userId: string, mode: "insert" | "upsert"): Promise<void> {
  const supa = getSupabase();
  if (!supa || logs.length === 0) return;
  const send = (withTopics: boolean) => {
    const rows = logs.map((l) => logToDb(l, userId, withTopics));
    return mode === "insert"
      ? supa.from("practice_logs").insert(rows)
      : supa.from("practice_logs").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
  };
  const withTopics = logs.some((l) => l.topicResults?.length) && !topicColumnMissing;
  let { error } = await send(withTopics);
  // Whatever went wrong with the tally (column missing, check constraint,
  // a bad unicode escape), the practice log itself must still land.
  if (error && withTopics) {
    if (isMissingTopicColumn(error)) topicColumnMissing = true;
    ({ error } = await send(false));
  }
  if (error) devError(`practice_logs ${mode} sync:`, error);
}

// Mirrors the 0019 check constraint (40 items, 120-char topics, 6000 bytes).
const TOPIC_MAX_ITEMS = 40;
const TOPIC_MAX_LEN = 120;
const TOPIC_MAX_BYTES = 4800;

function utf8Length(s: string): number {
  return typeof TextEncoder !== "undefined" ? new TextEncoder().encode(s).length : s.length * 3;
}

/** Validate + clamp a topic_results value (from the DB or a caller) into a safe array. */
export function parseTopicResults(v: unknown): TopicResult[] | null {
  if (!Array.isArray(v)) return null;
  const out: TopicResult[] = [];
  let bytes = 2;
  for (const item of v) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const topic = typeof r.topic === "string" ? r.topic.trim().slice(0, TOPIC_MAX_LEN) : "";
    const total = Math.round(Number(r.total));
    const correct = Math.round(Number(r.correct));
    if (!topic || !Number.isFinite(total) || !Number.isFinite(correct)) continue;
    if (total < 1 || total > 1000 || correct < 0 || correct > total) continue;
    const entry = { topic, correct, total };
    // Stay well under the DB's 6000-byte cap (Postgres prints jsonb with extra
    // spaces, so leave headroom) rather than have the whole tally rejected.
    bytes += utf8Length(JSON.stringify(entry)) + 1;
    if (bytes > TOPIC_MAX_BYTES) break;
    out.push(entry);
    if (out.length >= TOPIC_MAX_ITEMS) break;
  }
  return out.length ? out : null;
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

/**
 * Record a practice session. `topicResults` is optional: pass a per-topic
 * tally (see toTopicResults) and it is stored locally and synced to
 * practice_logs.topic_results, where the advisor readiness report reads it.
 * Before migration 0019 the tally stays local and the row still syncs.
 */
export function addPracticeLog(log: Omit<PracticeLog, "id" | "loggedAt">): PracticeLog {
  const { topicResults, ...rest } = log;
  const topics = parseTopicResults(topicResults);
  const entry: PracticeLog = { ...rest, id: cryptoId(), loggedAt: new Date().toISOString() };
  if (topics) entry.topicResults = topics;
  write(KEYS.practice, [entry, ...getPracticeLogs()]);
  if (syncUserId) void writeLogsToDb([entry], syncUserId, "insert");
  return entry;
}

/**
 * Patch an existing log in place (used to add the Judge Q&A round to the log
 * written when the main score came back). Only notes / score / duration /
 * topicResults can change; id, event and timestamp are fixed.
 */
export function updatePracticeLog(
  id: string,
  patch: Partial<Pick<PracticeLog, "notes" | "score" | "outOf" | "durationMin" | "topicResults">>
): void {
  const logs = getPracticeLogs();
  const cur = logs.find((l) => l.id === id);
  if (!cur) return;
  const next: PracticeLog = { ...cur, ...patch };
  if ("topicResults" in patch) {
    const topics = parseTopicResults(patch.topicResults);
    if (topics) next.topicResults = topics;
    else delete next.topicResults;
  }
  write(KEYS.practice, logs.map((l) => (l.id === id ? next : l)));
  if (!syncUserId) return;
  const supa = getSupabase();
  if (!supa) return;
  const row: Record<string, unknown> = {};
  if ("notes" in patch) row.notes = next.notes;
  if ("score" in patch) row.score = next.score;
  if ("outOf" in patch) row.out_of = next.outOf;
  if ("durationMin" in patch) row.duration_min = next.durationMin;
  const withTopics = "topicResults" in patch && !topicColumnMissing;
  if (withTopics) row.topic_results = next.topicResults ?? null;
  if (Object.keys(row).length === 0) return;
  const uid = syncUserId;
  const send = (r: Record<string, unknown>) =>
    supa.from("practice_logs").update(r).eq("user_id", uid).eq("id", id);
  send(row).then(async ({ error }) => {
    if (error && withTopics) {
      if (isMissingTopicColumn(error)) topicColumnMissing = true;
      delete row.topic_results;
      if (Object.keys(row).length === 0) return;
      ({ error } = await send(row));
    }
    if (error) devError("updatePracticeLog sync:", error);
  });
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

/**
 * Collapse per-question results into one tally per topic, canonicalized the
 * same way as recordTopicResults, ready for addPracticeLog({ topicResults }).
 */
export function toTopicResults(slug: string, results: { topic: string; correct: boolean }[]): TopicResult[] {
  const known = getCompetition(slug)?.topics ?? [];
  const canon = (t: string) => known.find((k) => k.toLowerCase() === t.trim().toLowerCase()) ?? t.trim();
  const byTopic = new Map<string, TopicResult>();
  for (const r of results) {
    const t = canon(r.topic || "").slice(0, TOPIC_MAX_LEN);
    if (!t) continue;
    const cur = byTopic.get(t) ?? { topic: t, correct: 0, total: 0 };
    cur.total += 1;
    if (r.correct) cur.correct += 1;
    byTopic.set(t, cur);
  }
  return Array.from(byTopic.values()).slice(0, TOPIC_MAX_ITEMS);
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
  // Local date, not UTC: toISOString() rolls over at 8pm Eastern, which hid
  // a deadline due today for the whole evening.
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
