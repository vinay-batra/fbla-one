/**
 * The practice-test question pipeline, shared by the coach (app/app/coach) and
 * Mock Regionals (lib/mock.ts).
 *
 *   write   /api/practice-test streams NDJSON from claude-haiku-4-5. Each line is
 *           validated, dash-tidied and run through the calculator re-key.
 *   check   Survivors are sent in small batches to /api/verify-questions, where
 *           claude-sonnet-5 solves each one blind and audits the key. Only
 *           "keep" verdicts go on the paper. Checks run while the stream is
 *           still writing, so they overlap with generation.
 *   top up  Anything dropped is replaced by further, smaller batches.
 *
 * If the checker is unavailable (error, rate limit or timeout), the pipeline
 * falls back to the pre-checker behavior for the rest of that paper: the
 * calculator-checked questions are used as is, and the caller is told so.
 */

import { evaluateExpression } from "@/lib/calc";
import { tidyQuestion } from "@/lib/text";

export type Option = "A" | "B" | "C" | "D";
export const OPTION_KEYS: Option[] = ["A", "B", "C", "D"];

export type Question = {
  id: number;
  question: string;
  options: Record<Option, string>;
  correct: Option;
  explanation: string;
  topic?: string;
  // Arithmetic expression the model used for a computed numeric answer (lib/calc
  // evaluates it to re-key or drop the question). Absent for conceptual questions.
  calc?: string;
  /** Set when the question came from the student's mistake bank. */
  bankId?: string;
  /** "checked" = passed the second-model check; "unchecked" = checker was unavailable. */
  check?: "checked" | "unchecked";
};

// ── Per-question helpers ───────────────────────────────────────

/** Normalized question text, used to spot duplicates and match bank entries. */
export function questionKey(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// Pull the first number out of an option label like "$9,533.08" or "12 items".
function optionNumber(text: string): number | null {
  const m = text.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

// For a question whose answer is a computed number, the model sends a `calc`
// expression. Evaluate it exactly (lib/calc) and reconcile with the options:
//   - exactly one option matches the computed value -> key to that option
//   - no option matches -> drop the question (the right answer is not present)
//   - calc absent / unparseable / ambiguous -> leave the question untouched
export function verifyNumericAnswer<T extends { options: Record<Option, string>; correct: Option; calc?: string }>(q: T): T | null {
  const calc = q.calc;
  if (typeof calc !== "string" || !calc.trim()) return q;
  let target: number;
  try { target = evaluateExpression(calc); } catch { return q; }
  const tol = Math.abs(target) * 0.01 + 0.01; // tolerate rounding to cents
  const hits = OPTION_KEYS.filter((k) => {
    const n = optionNumber(q.options[k]);
    return n !== null && Math.abs(n - target) <= tol;
  });
  if (hits.length === 1) return { ...q, correct: hits[0] };
  if (hits.length === 0) return null;
  return q;
}

// Randomize answer position so the correct letter is evenly spread. Remaps
// `correct` by the original letter, so it can never point at the wrong text.
export function shuffleQuestionOptions<T extends { options: Record<Option, string>; correct: Option }>(q: T): T {
  const entries = OPTION_KEYS.map((L) => ({ orig: L, text: q.options[L] }));
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }
  const options = {} as Record<Option, string>;
  let correct: Option = q.correct;
  entries.forEach((e, idx) => {
    options[OPTION_KEYS[idx]] = e.text;
    if (e.orig === q.correct) correct = OPTION_KEYS[idx];
  });
  return { ...q, options, correct };
}

/** Validate one NDJSON line. Throws only for a server-sent {"error"} line. */
function parseLine(line: string): Question | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    return null; // malformed or partial line
  }
  if (raw.error) throw new Error(String(raw.error));
  // Validate fully: question text, all four options, and a key that is exactly
  // one of A-D (a lowercase or malformed key once silently mis-scored tests).
  const opts = raw.options as Record<string, unknown> | undefined;
  const optionsOk = !!opts && OPTION_KEYS.every((k) => typeof opts[k] === "string" && (opts[k] as string).trim());
  if (typeof raw.question !== "string" || !raw.question.trim() || !optionsOk) return null;
  if (!OPTION_KEYS.includes(raw.correct as Option)) return null;
  const q: Question = {
    id: 0,
    question: raw.question,
    options: { A: String(opts!.A), B: String(opts!.B), C: String(opts!.C), D: String(opts!.D) },
    correct: raw.correct as Option,
    explanation: typeof raw.explanation === "string" ? raw.explanation : "",
    topic: typeof raw.topic === "string" ? raw.topic : undefined,
    calc: typeof raw.calc === "string" ? raw.calc : undefined,
  };
  return verifyNumericAnswer(tidyQuestion(q));
}

// ── Network ────────────────────────────────────────────────────

export type Section = { topics: string[]; part: number; parts: number };

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const j = await res.json();
    if (j?.error) return String(j.error);
  } catch {}
  return fallback;
}

/** Stream one generator batch, handing each valid question to onQuestion. */
async function streamBatch(
  body: { slug: string; count: number; focusTopic?: string; section?: Section },
  signal: AbortSignal,
  onQuestion: (q: Question) => void
): Promise<void> {
  const res = await fetch("/api/practice-test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    throw new Error(await errorMessage(res, "Failed to start generation"));
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const q = parseLine(line);
      if (q) onQuestion(q);
    }
  }
  const last = parseLine(buffer);
  if (last) onQuestion(last);
}

export type VerifyVerdict = { index: number; verdict: "keep" | "drop"; solvedAs: Option | null; reason: string };

/** Client budget per check. The route itself gives up at about 50s. */
const VERIFY_TIMEOUT_MS = 58_000;
/** Questions per check request. Measured ~7s for 6 and ~22s for 25. */
export const VERIFY_CHUNK = 8;

/**
 * Ask the second model to check up to 25 questions. Resolves null when the
 * checker is unavailable (any error or timeout), so callers can fall back.
 * Rejects only with an AbortError when the caller's signal aborts.
 */
export async function verifyBatch(
  slug: string,
  questions: Pick<Question, "question" | "options" | "correct" | "explanation" | "topic">[],
  signal?: AbortSignal
): Promise<VerifyVerdict[] | null> {
  if (questions.length === 0) return [];
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), VERIFY_TIMEOUT_MS);
  const onAbort = () => ctrl.abort();
  signal?.addEventListener("abort", onAbort);
  try {
    const res = await fetch("/api/verify-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        questions: questions.map((q) => ({
          question: q.question,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation,
          topic: q.topic,
        })),
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: unknown };
    if (!Array.isArray(data.results)) return null;
    const out: VerifyVerdict[] = [];
    for (const r of data.results as Record<string, unknown>[]) {
      const index = Number(r?.index);
      if (!Number.isInteger(index) || index < 0 || index >= questions.length) continue;
      out.push({
        index,
        verdict: r.verdict === "keep" ? "keep" : "drop",
        solvedAs: OPTION_KEYS.includes(r.solvedAs as Option) ? (r.solvedAs as Option) : null,
        reason: typeof r.reason === "string" ? r.reason : "",
      });
    }
    return out;
  } catch {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    return null;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

// ── The paper builder ──────────────────────────────────────────

export type BuildProgress = {
  target: number;
  /** Questions written that passed format and calculator checks. */
  written: number;
  /** Questions the second model has finished checking. */
  checked: number;
  /** Questions on the paper so far. */
  kept: number;
  /** Questions the second model set aside. */
  dropped: number;
  /** "on" while the checker is answering; "off" once it failed and we fell back. */
  checker: "on" | "off";
};

export type BuildOptions = {
  slug: string;
  target: number;
  focusTopic?: string;
  /** Initial generator batches, run in parallel. */
  batches: { count: number; section?: Section }[];
  /** Question keys that must not appear (for example, bank questions already on the paper). */
  exclude?: Iterable<string>;
  maxTopUps?: number;
  signal: AbortSignal;
  onProgress?: (p: BuildProgress) => void;
  /** Each accepted question, in the order it clears the check. Already shuffled. */
  onAccept?: (q: Question) => void;
  /** Skip the second-model check entirely. */
  skipCheck?: boolean;
};

export type BuildResult = { questions: Question[]; checker: "on" | "off"; dropped: number };

/**
 * Write, check and top up until `target` questions are accepted or the top-up
 * budget runs out. Throws when nothing could be written at all.
 */
export async function buildPaper(opts: BuildOptions): Promise<BuildResult> {
  const { slug, target, focusTopic, signal } = opts;
  const maxTopUps = opts.maxTopUps ?? 4;
  const accepted: Question[] = [];
  const seen = new Set<string>(opts.exclude ?? []);
  const inFlight = new Set<Promise<void>>();
  const progress: BuildProgress = { target, written: 0, checked: 0, kept: 0, dropped: 0, checker: opts.skipCheck ? "off" : "on" };
  // A holder, not a `let`: it is written inside the stream closures.
  const failure: { last: Error | null } = { last: null };

  // Streams stop early once the paper is full; that abort is not an error.
  const streamCtrl = new AbortController();
  const stopStreams = () => streamCtrl.abort();
  signal.addEventListener("abort", stopStreams);
  const full = () => accepted.length >= target;

  const report = () => opts.onProgress?.({ ...progress, kept: accepted.length });

  const accept = (q: Question, check: Question["check"]) => {
    if (full()) return;
    const placed = shuffleQuestionOptions({ ...q, check });
    delete placed.calc;
    accepted.push(placed);
    opts.onAccept?.(placed);
    if (full()) stopStreams();
  };

  const runCheck = (chunk: Question[]) => {
    if (chunk.length === 0) return;
    if (progress.checker === "off") {
      chunk.forEach((q) => accept(q, "unchecked"));
      report();
      return;
    }
    const p = (async () => {
      const verdicts = await verifyBatch(slug, chunk, signal);
      if (verdicts === null) {
        // Checker unavailable: fall back to the calculator-checked behavior.
        progress.checker = "off";
        chunk.forEach((q) => accept(q, "unchecked"));
      } else {
        const keep = new Set(verdicts.filter((v) => v.verdict === "keep").map((v) => v.index));
        chunk.forEach((q, i) => {
          progress.checked += 1;
          if (keep.has(i)) accept(q, "checked");
          else progress.dropped += 1;
        });
      }
      report();
    })();
    inFlight.add(p);
    p.finally(() => inFlight.delete(p)).catch(() => {});
  };

  const runStream = async (count: number, section?: Section) => {
    let buffer: Question[] = [];
    try {
      await streamBatch({ slug, count, focusTopic, section }, streamCtrl.signal, (q) => {
        if (full()) return;
        const key = questionKey(q.question);
        if (seen.has(key)) return; // parallel or top-up batches can repeat a question
        seen.add(key);
        progress.written += 1;
        buffer.push(q);
        if (buffer.length >= VERIFY_CHUNK) {
          runCheck(buffer);
          buffer = [];
        }
        report();
      });
    } catch (e) {
      if (signal.aborted) throw e;
      if (!streamCtrl.signal.aborted) failure.last = e as Error;
    }
    runCheck(buffer);
  };

  const settle = async () => {
    while (inFlight.size > 0) await Promise.allSettled([...inFlight]);
  };

  try {
    report();
    await Promise.all(opts.batches.map((b) => runStream(b.count, b.section)));
    await settle();

    for (let attempt = 0; attempt < maxTopUps && !full() && progress.written > 0; attempt++) {
      if (signal.aborted) break;
      const deficit = target - accepted.length;
      // Ask for extra, since the checker drops some. A big deficit is split
      // into parallel batches of at most 25 so each stays well inside the 60s
      // function limit.
      const want = Math.min(100, Math.max(5, deficit + Math.ceil(deficit * 0.3) + 2));
      const parts = Math.ceil(want / 25);
      const each = Math.max(5, Math.ceil(want / parts));
      const before = progress.written;
      await Promise.all(Array.from({ length: parts }, () => runStream(each)));
      await settle();
      if (progress.written === before && failure.last) break; // the generator is failing, stop asking
    }
  } finally {
    signal.removeEventListener("abort", stopStreams);
  }

  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  if (accepted.length === 0) {
    throw failure.last ?? new Error("No questions passed the answer check. Try again.");
  }
  return { questions: accepted.map((q, i) => ({ ...q, id: i + 1 })), checker: progress.checker, dropped: progress.dropped };
}

/** Split an outline into `parts` interleaved slices, so each section gets a spread. */
export function splitTopics(topics: string[], parts: number): string[][] {
  if (topics.length < parts) return Array.from({ length: parts }, () => [...topics]);
  const out: string[][] = Array.from({ length: parts }, () => []);
  topics.forEach((t, i) => out[i % parts].push(t));
  return out;
}
