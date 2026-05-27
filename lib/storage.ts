/**
 * Local-first storage layer. Reads/writes localStorage with safe SSR fallbacks.
 * When Supabase auth is configured + the user is signed in, downstream code can
 * mirror these writes to the DB. Until then, the dashboard runs entirely client-side.
 */

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

const KEYS = {
  registered: "fbla_registered_competitions",
  practice: "fbla_practice_logs",
  saved: "fbla_saved_resources",
  displayName: "fbla_display_name",
  chapterName: "fbla_chapter_name",
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

/* ───── Registered competitions ──────────────────────────── */
export function getRegistered(): string[] {
  return read<string[]>(KEYS.registered, []);
}

export function isRegistered(slug: string): boolean {
  return getRegistered().includes(slug);
}

export function registerCompetition(slug: string): void {
  const cur = getRegistered();
  if (!cur.includes(slug)) write(KEYS.registered, [...cur, slug]);
}

export function unregisterCompetition(slug: string): void {
  const cur = getRegistered();
  write(KEYS.registered, cur.filter((s) => s !== slug));
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
  const entry: PracticeLog = {
    ...log,
    id: cryptoId(),
    loggedAt: new Date().toISOString(),
  };
  const cur = getPracticeLogs();
  write(KEYS.practice, [entry, ...cur]);
  return entry;
}

export function removePracticeLog(id: string): void {
  const cur = getPracticeLogs();
  write(KEYS.practice, cur.filter((l) => l.id !== id));
}

export function getPracticeLogsForCompetition(slug: string): PracticeLog[] {
  return getPracticeLogs().filter((l) => l.competitionSlug === slug);
}

/* ───── Saved resources ──────────────────────────────────── */
export function getSavedResources(): SavedResource[] {
  return read<SavedResource[]>(KEYS.saved, []);
}

export function addSavedResource(r: Omit<SavedResource, "id" | "createdAt">): SavedResource {
  const entry: SavedResource = {
    ...r,
    id: cryptoId(),
    createdAt: new Date().toISOString(),
  };
  write(KEYS.saved, [entry, ...getSavedResources()]);
  return entry;
}

export function removeSavedResource(id: string): void {
  write(KEYS.saved, getSavedResources().filter((r) => r.id !== id));
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
