/**
 * Shared shapes for the Judge feature. The API route (app/api/judge/route.ts)
 * validates model output into these types before returning it, so the page can
 * trust every field it renders.
 */

export type JudgeMode = "role-play" | "presentation";

/** A practice role play card, modeled on an official event case study. */
export type RolePlayCard = {
  /** Short name for the scenario, e.g. "The Late Shipment Problem". */
  title: string;
  /** Fictional company at the center of the case. */
  company: string;
  /** The case study situation, one or two paragraphs. */
  situation: string;
  /** Who the student plays. */
  yourRole: string;
  /** Who the judges play. */
  judgeRole: string;
  /** What the student must accomplish in the performance. */
  tasks: string[];
  /** Performance indicators the judges look for. */
  indicators: string[];
  /** Event topics this card targets, copied verbatim from the event's topics. */
  focusTopics: string[];
};

export type CriterionScore = {
  name: string;
  /** 0 to 10. */
  score: number;
  /** Short red-pen margin note. */
  note: string;
};

export type Strength = {
  /** The student's own words. */
  quote: string;
  /** True when the quote was found word for word in the submission. */
  verbatim: boolean;
  why: string;
};

export type Fix = {
  issue: string;
  fix: string;
};

export type JudgeResult = {
  mode: JudgeMode;
  criteria: CriterionScore[];
  /** Overall score out of 100, computed from the criteria. */
  total: number;
  /** One-line summary, written like a judge's closing comment. */
  verdict: string;
  strengths: Strength[];
  fixes: Fix[];
  /** One sentence: what a top-15 finalist would have done differently. */
  finalist: string;
  /** Presentation mode only: 2 or 3 follow-up questions. Empty for role plays. */
  questions: string[];
};

export type FollowUpAnswerScore = {
  question: string;
  /** 0 to 10. */
  score: number;
  note: string;
};

export type FollowUpResult = {
  answers: FollowUpAnswerScore[];
  /** Out of 100. */
  total: number;
  summary: string;
};

// ── Request bodies ─────────────────────────────────────────────

export type CardRequest = { action: "card"; slug: string };

export type ScoreRequest = {
  action: "score";
  slug: string;
  mode: JudgeMode;
  /** The student's typed or transcribed performance. */
  response: string;
  /** Role play mode: the card the student performed against. */
  card?: RolePlayCard;
  /** Seconds the student ran past the time limit (0 when on time). */
  overtimeSec?: number;
  /** True when any of the response came from speech recognition. */
  spoken?: boolean;
};

export type FollowUpRequest = {
  action: "followup";
  slug: string;
  /** The original presentation text, for context. */
  submission: string;
  questions: string[];
  answers: string[];
};

export type JudgeRequest = CardRequest | ScoreRequest | FollowUpRequest;

// ── Response bodies ────────────────────────────────────────────

export type CardResponse = { card: RolePlayCard };
export type ScoreResponse = { result: JudgeResult };
export type FollowUpResponse = { followup: FollowUpResult };
export type ErrorResponse = { error: string };

/** Minimum words before the judge will score a performance. */
export const MIN_WORDS = 25;
/** Hard cap on submitted text, in characters (a long 10-minute talk fits). */
export const MAX_CHARS = 14000;
/** Hard cap on each follow-up answer, in characters. */
export const MAX_ANSWER_CHARS = 2500;

export function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}
