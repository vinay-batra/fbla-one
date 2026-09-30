/**
 * Mistake bank: every question a student misses on a submitted coach test is
 * kept (device-local, localStorage `fbla_mistake_bank`) so it can come back.
 *
 * Rules
 * - A miss adds the full question (text, options, key, explanation, topic) or,
 *   if it is already banked, bumps timesMissed and resets its progress.
 * - A banked question leaves after it is answered correctly twice in LATER
 *   tests. Spaced: two correct answers inside the same test count once.
 * - The in-session "retry the ones you missed" run never adds or clears
 *   (the caller simply does not record it): it is not spaced.
 * - Each event keeps at most MAX_PER_EVENT entries; the least recently seen
 *   go first.
 *
 * Deliberately separate from lib/storage.ts (not synced to Supabase): it is
 * a study aid derived from tests, cheap to lose, and can hold a lot of text.
 */

import type { Option } from "@/components/coach/engine";

const KEY = "fbla_mistake_bank";
const EVENT = "fbla:mistakes-change";
export const MAX_PER_EVENT = 200;
/** Correct answers, in separate tests, that clear a question from the bank. */
export const CLEAR_AFTER = 2;

export type BankedQuestion = {
  id: string;
  slug: string;
  question: string;
  options: Record<Option, string>;
  correct: Option;
  explanation: string;
  topic?: string;
  timesMissed: number;
  /** Correct answers since the last miss, each from a different test. */
  timesRight: number;
  firstMissedAt: string;
  lastMissedAt: string;
  lastSeenAt: string;
  /** Test that last counted as a correct answer, so one test counts once. */
  lastRightTest?: string;
  /**
   * True once this entry has been saved to the student's account. A synced
   * entry that later disappears from the account was cleared on another
   * device, so it is dropped here instead of being uploaded again.
   */
  synced?: boolean;
};

type Bank = Record<string, BankedQuestion[]>;

export type BankResult = { added: number; cleared: number; stillIn: number };

export type TestItem = {
  question: string;
  options: Record<Option, string>;
  correct: Option;
  explanation: string;
  topic?: string;
  /** What the student chose; undefined for a blank. */
  answer: Option | undefined;
};

// ── Storage ────────────────────────────────────────────────────

function readBank(): Bank {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Bank) : {};
  } catch {
    return {};
  }
}

function writeBank(bank: Bank): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(bank));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* quota or private mode: the bank is best effort */
  }
}

/** Subscribe to bank changes in this tab and others. */
export function onMistakesChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const local = () => cb();
  const remote = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener(EVENT, local);
  window.addEventListener("storage", remote);
  return () => {
    window.removeEventListener(EVENT, local);
    window.removeEventListener("storage", remote);
  };
}

// ── Identity ───────────────────────────────────────────────────

/**
 * Stable id from the question text plus the keyed answer's TEXT (not letter,
 * since options are reshuffled every time). Two different questions with the
 * same stem stay distinct.
 */
export function bankId(question: string, correctText: string): string {
  const s = `${question}|${correctText}`.toLowerCase().replace(/[^a-z0-9|]+/g, " ").trim();
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 + c, 2246822519) >>> 0;
  }
  return `m${h1.toString(36)}${h2.toString(36)}`;
}

function isValid(e: unknown): e is BankedQuestion {
  const q = e as BankedQuestion;
  return (
    !!q &&
    typeof q.id === "string" &&
    typeof q.question === "string" &&
    !!q.options &&
    ["A", "B", "C", "D"].every((k) => typeof q.options[k as Option] === "string") &&
    ["A", "B", "C", "D"].includes(q.correct)
  );
}

// ── Reads ──────────────────────────────────────────────────────

export function getBank(slug: string): BankedQuestion[] {
  if (!slug) return [];
  const list = readBank()[slug];
  return Array.isArray(list) ? list.filter(isValid) : [];
}

export function bankCount(slug: string): number {
  return getBank(slug).length;
}

/**
 * Most useful to revisit first: missed most often, then seen longest ago.
 * `topic` narrows to one topic (for a drill).
 */
export function pickFromBank(slug: string, max: number, topic?: string): BankedQuestion[] {
  if (max <= 0) return [];
  return getBank(slug)
    .filter((q) => !topic || q.topic === topic)
    .sort((a, b) => b.timesMissed - a.timesMissed || a.lastSeenAt.localeCompare(b.lastSeenAt))
    .slice(0, max);
}

// ── Writes ─────────────────────────────────────────────────────

/**
 * Record one submitted test. Every missed or blank question is banked; every
 * correctly answered banked question moves toward clearing.
 */
export function recordTestForBank(slug: string, testId: string, items: TestItem[]): BankResult {
  if (!slug || items.length === 0) return { added: 0, cleared: 0, stillIn: bankCount(slug) };
  const bank = readBank();
  const list = (Array.isArray(bank[slug]) ? bank[slug] : []).filter(isValid);
  const byId = new Map(list.map((q) => [q.id, q]));
  const now = new Date().toISOString();
  let added = 0;
  let cleared = 0;
  const changed = new Set<string>();
  const removed = new Set<string>();

  for (const it of items) {
    const id = bankId(it.question, it.options[it.correct]);
    const existing = byId.get(id);
    const right = it.answer === it.correct;
    if (!right) {
      if (existing) {
        existing.timesMissed += 1;
        existing.timesRight = 0;
        existing.lastMissedAt = now;
        existing.lastSeenAt = now;
        existing.lastRightTest = undefined;
        changed.add(id);
      } else {
        byId.set(id, {
          id,
          slug,
          question: it.question,
          options: { ...it.options },
          correct: it.correct,
          explanation: it.explanation,
          topic: it.topic,
          timesMissed: 1,
          timesRight: 0,
          firstMissedAt: now,
          lastMissedAt: now,
          lastSeenAt: now,
        });
        changed.add(id);
        added += 1;
      }
    } else if (existing) {
      existing.lastSeenAt = now;
      if (existing.lastRightTest !== testId) {
        existing.timesRight += 1;
        existing.lastRightTest = testId;
      }
      changed.add(id);
      if (existing.timesRight >= CLEAR_AFTER) {
        byId.delete(id);
        changed.delete(id);
        removed.add(id);
        cleared += 1;
      }
    }
  }

  // Cap per event: keep the most recently seen.
  const sorted = [...byId.values()].sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
  const next = sorted.slice(0, MAX_PER_EVENT);
  for (const dropped of sorted.slice(MAX_PER_EVENT)) {
    changed.delete(dropped.id);
    removed.add(dropped.id);
  }
  bank[slug] = next;
  writeBank(bank);
  void pushChanges(slug, next.filter((q) => changed.has(q.id)), [...removed]);
  return { added, cleared, stillIn: next.length };
}

export function clearBank(slug: string): void {
  const bank = readBank();
  const ids = (bank[slug] ?? []).map((q) => q.id);
  delete bank[slug];
  writeBank(bank);
  void pushChanges(slug, [], ids);
}

// ── Account sync ───────────────────────────────────────────────
// Signed in, the bank is mirrored to public.mistake_bank (migration 0020) so it
// follows the student between devices. Signed out or in preview it stays local,
// and whatever was banked before signing up is uploaded on the first sign-in.
// Every sync call is best effort: a network error or a missing table (before
// 0020 is applied) leaves the local bank working exactly as before.

let syncUser: string | null = null;

/** Set by DataSync when a user signs in (null on sign out). */
export function setMistakeSyncUser(id: string | null): void {
  syncUser = id;
}

type Row = {
  user_id?: string;
  competition_slug: string;
  question_key: string;
  data: { question: string; options: Record<Option, string>; correct: Option; explanation: string; topic?: string };
  times_missed: number;
  times_right: number;
  last_right_test: string | null;
  first_missed_at: string;
  last_missed_at: string;
  last_seen_at: string;
};

const ROW_COLUMNS =
  "competition_slug, question_key, data, times_missed, times_right, last_right_test, first_missed_at, last_missed_at, last_seen_at";

function toRow(q: BankedQuestion, userId: string): Row {
  return {
    user_id: userId,
    competition_slug: q.slug,
    question_key: q.id,
    data: { question: q.question, options: q.options, correct: q.correct, explanation: q.explanation, topic: q.topic },
    times_missed: q.timesMissed,
    times_right: q.timesRight,
    last_right_test: q.lastRightTest ?? null,
    first_missed_at: q.firstMissedAt,
    last_missed_at: q.lastMissedAt,
    last_seen_at: q.lastSeenAt,
  };
}

function fromRow(r: Row): BankedQuestion | null {
  const q: BankedQuestion = {
    id: r.question_key,
    slug: r.competition_slug,
    question: r.data?.question,
    options: r.data?.options,
    correct: r.data?.correct,
    explanation: r.data?.explanation ?? "",
    topic: r.data?.topic,
    timesMissed: r.times_missed,
    timesRight: r.times_right,
    lastRightTest: r.last_right_test ?? undefined,
    firstMissedAt: r.first_missed_at,
    lastMissedAt: r.last_missed_at,
    lastSeenAt: r.last_seen_at,
    synced: true,
  };
  return isValid(q) ? q : null;
}

async function client() {
  if (!syncUser) return null;
  const { getSupabase } = await import("./supabase");
  return getSupabase();
}

/** Mark entries as saved to the account without firing a change event. */
function markSynced(slug: string, ids: string[]): void {
  if (!ids.length) return;
  const bank = readBank();
  const set = new Set(ids);
  for (const q of bank[slug] ?? []) if (set.has(q.id)) q.synced = true;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(bank));
  } catch {}
}

async function pushChanges(slug: string, upserts: BankedQuestion[], deletes: string[]): Promise<void> {
  const userId = syncUser;
  if (!userId || (!upserts.length && !deletes.length)) return;
  try {
    const supa = await client();
    if (!supa) return;
    if (upserts.length) {
      const { error } = await supa
        .from("mistake_bank")
        .upsert(upserts.map((q) => toRow(q, userId)), { onConflict: "user_id,competition_slug,question_key" });
      if (!error) markSynced(slug, upserts.map((q) => q.id));
    }
    if (deletes.length) {
      await supa.from("mistake_bank").delete().eq("user_id", userId).eq("competition_slug", slug).in("question_key", deletes);
    }
  } catch {
    /* offline or 0020 not applied: the next sign-in pull reconciles */
  }
}

/**
 * Merge the account's bank with this browser's on sign-in. For a question on
 * both sides the more recently seen copy wins. A local entry that was synced
 * before but is gone from the account was cleared on another device, so it is
 * dropped; a local entry never synced is new and is uploaded.
 */
export async function pullMistakes(userId: string): Promise<void> {
  setMistakeSyncUser(userId);
  try {
    const supa = await client();
    if (!supa) return;
    const { data, error } = await supa.from("mistake_bank").select(ROW_COLUMNS).eq("user_id", userId);
    if (error) return; // includes 0020 not applied yet
    const remote = new Map<string, BankedQuestion>();
    for (const r of (data ?? []) as unknown as Row[]) {
      const q = fromRow(r);
      if (q) remote.set(`${q.slug}|${q.id}`, q);
    }

    const local = readBank();
    const merged: Bank = {};
    const toUpload: BankedQuestion[] = [];
    const put = (q: BankedQuestion) => (merged[q.slug] ??= []).push(q);

    for (const [slug, list] of Object.entries(local)) {
      for (const q of (Array.isArray(list) ? list : []).filter(isValid)) {
        const key = `${slug}|${q.id}`;
        const r = remote.get(key);
        if (r) {
          remote.delete(key);
          if (q.lastSeenAt > r.lastSeenAt) {
            put({ ...q, slug, synced: true });
            toUpload.push({ ...q, slug });
          } else {
            put(r);
          }
        } else if (!q.synced) {
          put({ ...q, slug });
          toUpload.push({ ...q, slug });
        }
        // else: synced before and gone from the account, so cleared elsewhere.
      }
    }
    for (const r of remote.values()) put(r);

    for (const slug of Object.keys(merged)) {
      merged[slug] = merged[slug]
        .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))
        .slice(0, MAX_PER_EVENT);
    }
    writeBank(merged);

    if (toUpload.length) {
      const bySlug = new Map<string, BankedQuestion[]>();
      for (const q of toUpload) bySlug.set(q.slug, [...(bySlug.get(q.slug) ?? []), q]);
      for (const [slug, qs] of bySlug) await pushChanges(slug, qs, []);
    }
  } catch {
    /* best effort */
  }
}

/** On sign out: the bank belongs to the account, not to a shared computer. */
export function clearLocalMistakes(): void {
  setMistakeSyncUser(null);
  writeBank({});
}
