/**
 * Independent answer-key check for AI practice questions.
 *
 * The generator (claude-haiku-4-5) writes a question and its key. This module
 * asks a different, stronger model (claude-sonnet-5) to check it in two calls
 * that run at the same time:
 *
 *   1. SOLVE, blind. The model sees only the question and the four options,
 *      never the key or the explanation, and picks an answer itself. It also
 *      flags a question that has two right answers, none, ambiguous wording, or
 *      a rule that is only conditionally true but stated as universal.
 *   2. AUDIT, with the key. A separate call reads the key and the explanation
 *      and judges whether exactly one option is correct, whether the keyed one
 *      is it, whether anything is ambiguous or outdated, and whether the
 *      explanation is right.
 *
 * A question is kept only when the blind answer matches the key AND neither
 * call flagged a problem. Anything else is dropped, and the coach writes a
 * replacement. The blind solve is required; if only the audit fails, the
 * decision rests on the solve alone.
 *
 * No path aliases in this file, so it can be exercised directly with
 * `node --experimental-strip-types` outside Next.
 */

import Anthropic from "@anthropic-ai/sdk";

export const VERIFIER_MODEL = "claude-sonnet-5";
export const MAX_VERIFY_BATCH = 25;

export type Letter = "A" | "B" | "C" | "D";
const LETTERS: Letter[] = ["A", "B", "C", "D"];

export type VerifyInput = {
  question: string;
  options: Record<Letter, string>;
  correct: Letter;
  explanation: string;
  topic?: string;
};

export type EventBrief = { name: string; topics: string[]; overview: string };

export type Verdict = {
  index: number;
  verdict: "keep" | "drop";
  solvedAs: Letter | null;
  reason: string;
};

type SolveRow = {
  index: number;
  answer: Letter | "none";
  confidence: "high" | "medium" | "low";
  multiple_correct: boolean;
  ambiguous: boolean;
  outdated_or_conditional: boolean;
  reason: string;
};

type AuditRow = {
  index: number;
  exactly_one_correct: boolean;
  key_is_correct: boolean;
  ambiguous: boolean;
  outdated_or_conditional: boolean;
  explanation_correct: boolean;
  reason: string;
};

export class VerifierError extends Error {}

// ── Prompts ────────────────────────────────────────────────────

const HOUSE = `Write every "reason" as one short plain sentence. Never use an em dash or en dash; use a comma instead. No emojis.`;

const SOLVE_SYSTEM = `You are a veteran examiner who writes and grades FBLA (Future Business Leaders of America) high school competitive event tests. You are checking a draft test before students see it. No answer key is provided: work out every question yourself.

For each question:
- Solve it from first principles and choose the single best option. For any arithmetic, work it step by step and double check it before choosing.
- Set "answer" to that letter, or "none" if no option is correct as written.
- "confidence": "high" only when you are certain; "medium" when you lean one way but a careful teacher could argue; "low" when you are guessing.
- "multiple_correct": true if more than one option is defensibly correct.
- "ambiguous": true if the wording can reasonably be read two ways that lead to different answers, or the question depends on information it does not give.
- "outdated_or_conditional": true if the intended answer relies on a figure, law, rule or standard that has changed, varies by state, country, year or organization, or only holds under conditions the question does not state, yet the question treats it as universally true.
- "reason": why you chose your answer, or what is wrong with the question.

Judge each question strictly on its own. A student will be taught whatever the key says, so flag anything you would not defend in front of a room of teachers.

${HOUSE}`;

const AUDIT_SYSTEM = `You are a veteran examiner who audits FBLA (Future Business Leaders of America) high school competitive event tests before students see them. Each question comes with the answer key the question writer chose and the explanation students will read after the test. The writer is sometimes wrong. Do not assume the key is right: check it.

For each question decide:
- "exactly_one_correct": true only if exactly one option is correct and the other three are clearly wrong.
- "key_is_correct": true only if the keyed option is that one correct option.
- "ambiguous": true if the wording can reasonably be read two ways that lead to different answers, or depends on information the question does not give.
- "outdated_or_conditional": true if the keyed answer relies on a figure, law, rule or standard that has changed, varies by state, country, year or organization, or only holds under conditions the question does not state, yet it is presented as universally true.
- "explanation_correct": true only if the explanation is factually right, supports the keyed answer, contains no wrong arithmetic, and refers to choices by their wording rather than by letter or position (the options are reordered before display, so a letter reference would point at the wrong choice).
- "reason": the problem you found, or a short confirmation.

Be strict. A wrong key teaches a student the wrong thing, which is the worst possible failure.

${HOUSE}`;

function briefBlock(brief: EventBrief): string {
  const topics = brief.topics.length ? brief.topics.map((t) => `- ${t}`).join("\n") : "- General business knowledge";
  return `Event: ${brief.name}\nOverview: ${brief.overview}\nTopic outline:\n${topics}`;
}

// ── Schemas (structured output) ────────────────────────────────

const SOLVE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["results"],
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["index", "answer", "confidence", "multiple_correct", "ambiguous", "outdated_or_conditional", "reason"],
        properties: {
          index: { type: "integer" },
          answer: { type: "string", enum: ["A", "B", "C", "D", "none"] },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          multiple_correct: { type: "boolean" },
          ambiguous: { type: "boolean" },
          outdated_or_conditional: { type: "boolean" },
          reason: { type: "string" },
        },
      },
    },
  },
} as const;

const AUDIT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["results"],
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "index",
          "exactly_one_correct",
          "key_is_correct",
          "ambiguous",
          "outdated_or_conditional",
          "explanation_correct",
          "reason",
        ],
        properties: {
          index: { type: "integer" },
          exactly_one_correct: { type: "boolean" },
          key_is_correct: { type: "boolean" },
          ambiguous: { type: "boolean" },
          outdated_or_conditional: { type: "boolean" },
          explanation_correct: { type: "boolean" },
          reason: { type: "string" },
        },
      },
    },
  },
} as const;

// ── Model calls ────────────────────────────────────────────────

async function askJson(
  client: Anthropic,
  system: string,
  user: string,
  schema: Record<string, unknown>,
  count: number
): Promise<unknown[]> {
  const message = await client.messages.create({
    model: VERIFIER_MODEL,
    // Room for adaptive thinking plus a short row per question.
    max_tokens: Math.min(32000, 6000 + count * 700),
    system,
    messages: [{ role: "user", content: user }],
    output_config: { effort: "medium", format: { type: "json_schema", schema } },
  });
  if (message.stop_reason === "refusal") throw new VerifierError("verifier declined");
  if (message.stop_reason === "max_tokens") throw new VerifierError("verifier ran out of room");

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new VerifierError("verifier returned unreadable JSON");
  }
  const results = (parsed as { results?: unknown })?.results;
  if (!Array.isArray(results)) throw new VerifierError("verifier returned no results");
  return results;
}

const bool = (v: unknown): v is boolean => typeof v === "boolean";
const str = (v: unknown, max = 300) =>
  typeof v === "string"
    ? v.replace(/(\d)\s*[\u2013\u2014]\s*(\d)/g, "$1-$2").replace(/\s*[\u2013\u2014]\s*/g, ", ").trim().slice(0, max)
    : "";

/** Validate every row field by field; anything malformed is simply absent. */
function toSolveRows(raw: unknown[], count: number): Map<number, SolveRow> {
  const out = new Map<number, SolveRow>();
  for (const r of raw) {
    const o = r as Record<string, unknown>;
    const index = Number(o?.index);
    if (!Number.isInteger(index) || index < 0 || index >= count || out.has(index)) continue;
    const answer = o.answer;
    const confidence = o.confidence;
    if (answer !== "none" && !LETTERS.includes(answer as Letter)) continue;
    if (confidence !== "high" && confidence !== "medium" && confidence !== "low") continue;
    if (!bool(o.multiple_correct) || !bool(o.ambiguous) || !bool(o.outdated_or_conditional)) continue;
    out.set(index, {
      index,
      answer: answer as Letter | "none",
      confidence,
      multiple_correct: o.multiple_correct,
      ambiguous: o.ambiguous,
      outdated_or_conditional: o.outdated_or_conditional,
      reason: str(o.reason),
    });
  }
  return out;
}

function toAuditRows(raw: unknown[], count: number): Map<number, AuditRow> {
  const out = new Map<number, AuditRow>();
  for (const r of raw) {
    const o = r as Record<string, unknown>;
    const index = Number(o?.index);
    if (!Number.isInteger(index) || index < 0 || index >= count || out.has(index)) continue;
    const flags = [o.exactly_one_correct, o.key_is_correct, o.ambiguous, o.outdated_or_conditional, o.explanation_correct];
    if (!flags.every(bool)) continue;
    out.set(index, {
      index,
      exactly_one_correct: o.exactly_one_correct as boolean,
      key_is_correct: o.key_is_correct as boolean,
      ambiguous: o.ambiguous as boolean,
      outdated_or_conditional: o.outdated_or_conditional as boolean,
      explanation_correct: o.explanation_correct as boolean,
      reason: str(o.reason),
    });
  }
  return out;
}

// ── Decision ───────────────────────────────────────────────────

/** Keep only when the blind answer matches the key and nobody flagged anything. */
export function decide(q: VerifyInput, solve: SolveRow | undefined, audit: AuditRow | undefined, auditRan: boolean): Omit<Verdict, "index"> {
  if (!solve) return { verdict: "drop", solvedAs: null, reason: "The second model did not return an answer for this question." };
  const solvedAs = solve.answer === "none" ? null : solve.answer;
  const drop = (reason: string) => ({ verdict: "drop" as const, solvedAs, reason });

  if (solve.answer === "none") return drop(`No option is correct as written. ${solve.reason}`.trim());
  if (solve.answer !== q.correct) return drop(`Solved independently as ${solve.answer}, but the key says ${q.correct}. ${solve.reason}`.trim());
  if (solve.multiple_correct) return drop(`More than one option is defensible. ${solve.reason}`.trim());
  if (solve.ambiguous) return drop(`Ambiguous wording. ${solve.reason}`.trim());
  if (solve.outdated_or_conditional) return drop(`Outdated or only conditionally true. ${solve.reason}`.trim());
  if (solve.confidence === "low") return drop(`The second model was not confident. ${solve.reason}`.trim());

  if (auditRan) {
    if (!audit) return drop("The audit did not return a result for this question.");
    if (!audit.key_is_correct) return drop(`Audit: the keyed answer is wrong. ${audit.reason}`.trim());
    if (!audit.exactly_one_correct) return drop(`Audit: not exactly one correct option. ${audit.reason}`.trim());
    if (audit.ambiguous) return drop(`Audit: ambiguous. ${audit.reason}`.trim());
    if (audit.outdated_or_conditional) return drop(`Audit: outdated or only conditionally true. ${audit.reason}`.trim());
    if (!audit.explanation_correct) return drop(`Audit: the explanation is wrong. ${audit.reason}`.trim());
  }
  return { verdict: "keep", solvedAs, reason: auditRan ? "Confirmed by an independent solve and an audit." : "Confirmed by an independent solve." };
}

/**
 * Check a batch. Throws VerifierError (or an SDK error) when the blind solve
 * itself fails, so the caller can report the verifier as unavailable.
 */
export async function verifyQuestions(
  client: Anthropic,
  brief: EventBrief,
  questions: VerifyInput[]
): Promise<{ results: Verdict[]; audited: boolean }> {
  const n = questions.length;
  const blind = questions.map((q, index) => ({ index, question: q.question, options: q.options }));
  const keyed = questions.map((q, index) => ({
    index,
    topic: q.topic ?? "",
    question: q.question,
    options: q.options,
    keyed_answer: q.correct,
    explanation: q.explanation,
  }));

  const solveUser = `${briefBlock(brief)}\n\nSolve each of these ${n} questions. Return exactly one result per question, using its "index".\n\n${JSON.stringify(blind, null, 1)}`;
  const auditUser = `${briefBlock(brief)}\n\nAudit each of these ${n} questions and their answer keys. Return exactly one result per question, using its "index".\n\n${JSON.stringify(keyed, null, 1)}`;

  const [solveRes, auditRes] = await Promise.allSettled([
    askJson(client, SOLVE_SYSTEM, solveUser, SOLVE_SCHEMA as unknown as Record<string, unknown>, n),
    askJson(client, AUDIT_SYSTEM, auditUser, AUDIT_SCHEMA as unknown as Record<string, unknown>, n),
  ]);
  if (solveRes.status === "rejected") throw solveRes.reason;

  const solveRows = toSolveRows(solveRes.value, n);
  const auditRan = auditRes.status === "fulfilled";
  const auditRows = auditRan ? toAuditRows(auditRes.value, n) : new Map<number, AuditRow>();

  const results = questions.map((q, index) => ({ index, ...decide(q, solveRows.get(index), auditRows.get(index), auditRan) }));
  return { results, audited: auditRan };
}

/** Strict shape check for one incoming question. Returns null when invalid. */
export function parseVerifyInput(raw: unknown): VerifyInput | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const opts = o.options as Record<string, unknown> | undefined;
  if (typeof o.question !== "string" || !o.question.trim() || o.question.length > 2000) return null;
  if (!opts || typeof opts !== "object") return null;
  if (!LETTERS.every((k) => typeof opts[k] === "string" && (opts[k] as string).trim() && (opts[k] as string).length <= 600)) return null;
  if (!LETTERS.includes(o.correct as Letter)) return null;
  const explanation = typeof o.explanation === "string" ? o.explanation.slice(0, 2500) : "";
  return {
    question: o.question,
    options: { A: opts.A as string, B: opts.B as string, C: opts.C as string, D: opts.D as string },
    correct: o.correct as Letter,
    explanation,
    topic: typeof o.topic === "string" ? o.topic.slice(0, 200) : undefined,
  };
}
