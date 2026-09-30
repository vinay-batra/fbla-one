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
        added += 1;
      }
    } else if (existing) {
      existing.lastSeenAt = now;
      if (existing.lastRightTest !== testId) {
        existing.timesRight += 1;
        existing.lastRightTest = testId;
      }
      if (existing.timesRight >= CLEAR_AFTER) {
        byId.delete(id);
        cleared += 1;
      }
    }
  }

  // Cap per event: keep the most recently seen.
  const next = [...byId.values()].sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt)).slice(0, MAX_PER_EVENT);
  bank[slug] = next;
  writeBank(bank);
  return { added, cleared, stillIn: next.length };
}

export function clearBank(slug: string): void {
  const bank = readBank();
  delete bank[slug];
  writeBank(bank);
}
