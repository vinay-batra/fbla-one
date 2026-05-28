/**
 * Local-first storage with Supabase sync.
 *
 * Reads are always synchronous from localStorage (fast, works offline + in
 * preview mode). When a signed-in user is registered via setSyncUser(), every
 * mutation also fire-and-forgets to Supabase, and pullFromSupabase() merges the
 * server state down on sign-in (migrating any preview-mode data up first).
 */

import { getSupabase } from "./supabase";

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

export function setSyncUser(id: string | null): void {
  syncUserId = id;
}

function devError(label: string, e: unknown): void {
  if (process.env.NODE_ENV !== "production") console.error(label, e);
}

/** Pull server state, merge with any local (preview) data, push local-only up. */
export async function pullFromSupabase(userId: string): Promise<void> {
  const supa = getSupabase();
  if (!supa) return;
  setSyncUser(userId);

  try {
    const [{ data: regs }, { data: logs }, { data: saved }] = await Promise.all([
      supa.from("registrations").select("competition_slug").eq("user_id", userId),
      supa.from("practice_logs").select("*").eq("user_id", userId).order("logged_at", { ascending: false }),
      supa.from("saved_resources").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);

    // ── Registrations: union, push local-only up ──
    const remoteSlugs = (regs ?? []).map((r) => r.competition_slug as string);
    const localSlugs = getRegistered();
    const onlyLocalSlugs = localSlugs.filter((s) => !remoteSlugs.includes(s));
    if (onlyLocalSlugs.length) {
      await supa.from("registrations").upsert(
        onlyLocalSlugs.map((slug) => ({ user_id: userId, competition_slug: slug })),
        { onConflict: "user_id,competition_slug" }
      );
    }
    write(KEYS.registered, Array.from(new Set([...remoteSlugs, ...localSlugs])));

    // ── Practice logs: union by id, push local-only up ──
    const remoteLogs: PracticeLog[] = (logs ?? []).map(dbToLog);
    const remoteLogIds = new Set(remoteLogs.map((l) => l.id));
    const localLogs = getPracticeLogs();
    const onlyLocalLogs = localLogs.filter((l) => !remoteLogIds.has(l.id));
    if (onlyLocalLogs.length) {
      await supa.from("practice_logs").insert(onlyLocalLogs.map((l) => logToDb(l, userId)));
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
      await supa.from("saved_resources").insert(onlyLocalSaved.map((r) => savedToDb(r, userId)));
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
  try {
    await supa
      .from("profiles")
      .upsert({ id: userId, email, display_name: name }, { onConflict: "id", ignoreDuplicates: true });
  } catch (e) {
    devError("ensureProfile:", e);
  }
}

/** Clear sync user + wipe local app data (on sign-out). */
export function clearSyncedData(): void {
  setSyncUser(null);
  write(KEYS.registered, []);
  write(KEYS.practice, []);
  write(KEYS.saved, []);
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
  if (cur.includes(slug)) return;
  write(KEYS.registered, [...cur, slug]);
  if (syncUserId) {
    const supa = getSupabase();
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

export function getPracticeLogsForCompetition(slug: string): PracticeLog[] {
  return getPracticeLogs().filter((l) => l.competitionSlug === slug);
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
export function getDeadlines(): Deadline[] {
  return read<Deadline[]>(KEYS.deadlines, []);
}

export function addDeadline(d: Omit<Deadline, "id" | "createdAt">): Deadline {
  const entry: Deadline = { ...d, id: cryptoId(), createdAt: new Date().toISOString() };
  write(KEYS.deadlines, [entry, ...getDeadlines()]);
  return entry;
}

export function removeDeadline(id: string): void {
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
