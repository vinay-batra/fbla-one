/**
 * Everything the Judge derives from an event's registry entry: which mode it
 * runs in, its official timing, and the criteria on its rating sheet. Pure
 * functions, shared by the page and the API route so both agree on the rubric.
 */
import type { Competition, CompetitionFormat } from "@/lib/competitions";
import type { JudgeMode, RolePlayCard } from "./types";

export function judgeModeFor(format: CompetitionFormat): JudgeMode | null {
  // A production test (Computer Applications) is a hands-on timed test with
  // nothing for a judge to score, so it is not a Judge event either.
  if (format === "objective-test" || format === "production") return null;
  if (format === "test-then-role-play") return "role-play";
  return "presentation";
}

function eventText(c: Competition): string {
  return `${c.duration ?? ""} ${c.longDescription ?? ""}`;
}

function firstMatch(text: string, patterns: RegExp[]): number | null {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const n = Number(m[1]);
      if (Number.isFinite(n) && n > 0 && n <= 120) return n;
    }
  }
  return null;
}

export const DEFAULT_PREP_MIN = 20;
export const DEFAULT_PERFORM_MIN = 7;

/** Official prep and performance minutes for a role play event. */
export function rolePlayTiming(c: Competition): { prepMin: number; performMin: number } {
  const text = eventText(c);
  const prepMin =
    firstMatch(text, [/(\d+)\s*minutes?\s+(?:of\s+)?prep/i, /(\d+)\s*minutes?\s+to\s+prepare/i]) ??
    DEFAULT_PREP_MIN;
  const performMin =
    firstMatch(text, [
      /(\d+)-minute\s+(?:role play|mock meeting)/i,
      /(\d+)\s*minutes?\s+to\s+present/i,
      /for up to (\d+)\s*minutes/i,
    ]) ?? DEFAULT_PERFORM_MIN;
  return { prepMin, performMin };
}

/** Official speaking limit for a presentation, speech, or interview, if stated. */
export function presentationLimit(c: Competition): number | null {
  return firstMatch(eventText(c), [
    /(\d+)-minute\s+(?:interactive\s+)?presentation/i,
    /speech\s+(?:of\s+)?up to (\d+)\s*minutes/i,
    /(\d+)-minute\s+interview/i,
  ]);
}

/** Official Q&A minutes, if stated. */
export function qaMinutes(c: Competition): number | null {
  return firstMatch(c.duration ?? "", [/(\d+)\s*minutes?\s+(?:of\s+)?(?:Q&A|questions)/i]);
}

/** True when the event runs with no judges' questions at all. */
export function hasNoQA(c: Competition): boolean {
  return /no (?:separate )?Q&A/i.test(c.duration ?? "");
}

// ── Criteria ───────────────────────────────────────────────────

const STANDARD_PRESENTATION = [
  "Content and knowledge of the topic",
  "Organization and logical flow",
  "Evidence, examples, and data",
  "Delivery and audience engagement",
];

const STANDARD_INTERVIEW = [
  "Answers the question that was asked",
  "Relevant experience and specific examples",
  "Knowledge of the role and organization",
  "Professional, confident communication",
];

/**
 * Every official role play rating sheet scores these regardless of event, on
 * top of the event-specific performance indicators.
 */
export const ROLE_PLAY_STANDARD = [
  "Defines the problem and the judges' needs",
  "Clear, workable solution with next steps",
  "Communication and professional presence",
];

const MAX_CRITERIA = 10;

/**
 * The rating-sheet rows for a judged performance.
 *
 * Presentation: the event's `topics` (which hold its rating sheet) or, when an
 * event lists fewer than 3, a standard sheet.
 *
 * Role play: a role play event's `topics` are its test knowledge areas, and a
 * single case only exercises two or three of them. Scoring all of them would
 * mark a student down for areas the card never raised, so the rows are the
 * topics this card targets plus the three standard role play rows.
 */
export function criteriaFor(c: Competition, mode: JudgeMode, card?: RolePlayCard | null): string[] {
  const topics = (c.topics ?? []).map((t) => t.trim()).filter(Boolean);
  if (mode === "role-play") {
    const focus = (card?.focusTopics ?? []).filter((t) => topics.includes(t)).slice(0, 3);
    const rows = focus.length > 0 ? focus : topics.slice(0, 2);
    return [...rows, ...ROLE_PLAY_STANDARD];
  }
  // Test plus presentation events keep test areas in `topics`; their rating
  // sheet lives in `judgedOn`.
  const sheet = (c.judgedOn ?? []).map((t) => t.trim()).filter(Boolean);
  if (sheet.length >= 3) return sheet.slice(0, MAX_CRITERIA);
  if (topics.length >= 3) return topics.slice(0, MAX_CRITERIA);
  return c.format === "interview" ? STANDARD_INTERVIEW : STANDARD_PRESENTATION;
}

/** Official rating-sheet level for a 0-10 criterion score. */
export function levelFor(score: number): string {
  if (score <= 0) return "Not demonstrated";
  if (score <= 4) return "Below expectations";
  if (score <= 7) return "Meets expectations";
  return "Exceeds expectations";
}

/** What the student hands the judge in presentation mode, by format. */
export function submissionNoun(c: Competition): string {
  return c.format === "interview" ? "interview answers" : "presentation";
}

export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
