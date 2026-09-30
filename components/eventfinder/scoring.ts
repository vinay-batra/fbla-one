/**
 * Scores every FBLA event against a student's quiz answers.
 *
 * Deterministic and transparent on purpose: no AI, no network, no randomness.
 * Every point an event earns comes from a row in one of the tables below, and
 * each row carries the plain-English reason (or catch) it stands for, so the
 * results page can say WHY an event was picked and the numbers stay easy to
 * tune. Change a weight here and nothing else needs to move.
 *
 * The registry (lib/competitions.ts) is read, never edited. Traits it does not
 * store directly (is this a "build something" event, how much speaking, how
 * much prep time) are derived here from its format, category, and slug.
 */

import {
  COMPETITIONS,
  type Competition,
  type CompetitionFormat,
} from "@/lib/competitions";
import {
  SUBJECT_LABEL,
  type Answers,
  type Experience,
  type Speaking,
  type Style,
  type Subject,
  type Time,
} from "./questions";

/* ── Tuning knobs ─────────────────────────────────────────── */

export const WEIGHTS = {
  /** Multiplies the 0-3 style fit from STYLE_FIT. */
  style: 2,
  /** An event whose main subject is one the student picked. */
  subjectPrimary: 4,
  /** An event that touches a picked subject on the side. */
  subjectSecondary: 2,
  /** Team preference matched (team event for "team", individual for "solo"). */
  teamMatch: 3,
  /** Wanted a team, got an individual event. */
  soloForTeamFan: -2.5,
  /** Wanted solo, got a team event that can still be entered alone (1 to 3 members). */
  flexTeamForSoloFan: -1,
  /** Wanted solo, got an event that needs a full team (4 or 5 members). */
  bigTeamForSoloFan: -4,
  /** A 9th or 10th grader, and the event is written for them. */
  introForUnderclassmen: 1.5,
  /** No classes yet, and the event builds on earlier coursework. */
  advancedWithoutClasses: -2.5,
  /** Several classes, and the event builds on them. */
  advancedWithClasses: 1.5,
  /** Accounting caps eligibility at two semesters of accounting. */
  cappedEventWithLotsOfClasses: -2,
  /** A chapter event is the chapter's project, not a member's own event. */
  chapterEvent: -1,
  /** Tiny nudge so ties go to events more members already pick. */
  popular: 0.3,
} as const;

/**
 * How well each way of competing fits each kind of event, 0 to 3. "build" and
 * "impromptu" are presentation events that play very differently from a
 * prepared speech, so they get their own rows.
 */
type EventKind = CompetitionFormat | "build" | "impromptu";

export const STYLE_FIT: Record<EventKind, Record<Style, number>> = {
  "objective-test": { test: 3, talk: 0, present: 0, build: 0 },
  "test-then-role-play": { test: 2, talk: 3, present: 1, build: 0 },
  "test-and-presentation": { test: 2, talk: 1, present: 2, build: 0 },
  production: { test: 1, talk: 0, present: 0, build: 3 },
  presentation: { test: 0, talk: 1, present: 3, build: 0 },
  build: { test: 0, talk: 0, present: 1.5, build: 3 },
  impromptu: { test: 0, talk: 3, present: 1.5, build: 0 },
  interview: { test: 0, talk: 2.5, present: 1.5, build: 0 },
  "chapter-event": { test: 0, talk: 0, present: 2.5, build: 1 },
};

/**
 * Points by how much speaking an event asks for:
 * 0 none, 1 a demo or short Q&A, 2 a prepared talk, 3 live and unscripted.
 */
export const SPEAKING_FIT: Record<Speaking, [number, number, number, number]> = {
  love: [-1, 0.5, 2, 3],
  prepared: [0.5, 1, 1.5, -1.5],
  avoid: [2, 0.5, -2.5, -4],
};

/** Points by prep time the event takes: 1 light, 2 steady, 3 a season-long project. */
export const TIME_FIT: Record<Time, [number, number, number]> = {
  light: [1.5, -1, -3],
  steady: [0.5, 1, -0.5],
  deep: [0, 0.5, 1.5],
};

/* ── Event traits the registry does not store ─────────────── */

/** Presentation events where you make something (code, design, video) and demo it. */
const BUILD_SLUGS = new Set([
  "coding-programming",
  "website-coding-development",
  "website-design",
  "mobile-application-development",
  "computer-game-simulation-programming",
  "intro-to-programming",
  "digital-animation",
  "digital-video-production",
  "graphic-design",
  "publication-design",
  "broadcast-journalism",
  "public-service-announcement",
  "data-analysis",
]);

/** Events that build on earlier coursework in the subject. */
const ADVANCED_SLUGS = new Set(["accounting-ii"]);
/** Events that cap how much coursework you can have (Accounting: two semesters). */
const CAPPED_SLUGS = new Set(["accounting-i"]);

/** Every category's default subject; SUBJECT_OVERRIDES refines single events. */
const CATEGORY_SUBJECT: Record<Competition["category"], Subject> = {
  "Accounting & Finance": "money",
  "Business Management": "business",
  "Career Development": "careers",
  "Communication & Public Speaking": "speaking",
  "Information Technology": "tech",
  "Marketing & Sales": "marketing",
  "Service & Leadership": "careers",
};

type SubjectMix = { primary: Subject[]; secondary: Subject[] };

const SUBJECT_OVERRIDES: Record<string, SubjectMix> = {
  "business-law": { primary: ["law"], secondary: ["business"] },
  economics: { primary: ["law"], secondary: ["money"] },
  "public-administration-management": { primary: ["business"], secondary: ["law"] },
  "real-estate": { primary: ["money"], secondary: ["law"] },
  "insurance-risk-management": { primary: ["money"], secondary: ["law"] },
  "international-business": { primary: ["business"], secondary: ["law"] },
  "business-ethics": { primary: ["careers"], secondary: ["law", "speaking"] },
  "parliamentary-procedure": { primary: ["careers"], secondary: ["speaking", "law"] },
  "intro-to-parliamentary-procedure": { primary: ["careers"], secondary: ["law"] },
  "organizational-leadership": { primary: ["business", "careers"], secondary: [] },
  "human-resource-management": { primary: ["business"], secondary: ["careers"] },
  "future-business-educator": { primary: ["careers"], secondary: ["speaking"] },
  "business-plan": { primary: ["business"], secondary: ["money", "marketing"] },
  entrepreneurship: { primary: ["business"], secondary: ["marketing", "money"] },
  "business-financial-plan": { primary: ["money"], secondary: ["business"] },
  "hospitality-event-management": { primary: ["business"], secondary: ["marketing"] },
  "event-planning": { primary: ["business"], secondary: ["marketing"] },
  "sports-entertainment-management": { primary: ["marketing"], secondary: ["business"] },
  "retail-management": { primary: ["marketing"], secondary: ["business"] },
  "intro-to-retail-merchandising": { primary: ["marketing"], secondary: ["business"] },
  "customer-service": { primary: ["marketing"], secondary: ["speaking"] },
  "sales-presentation": { primary: ["marketing"], secondary: ["speaking"] },
  advertising: { primary: ["marketing"], secondary: ["design"] },
  "social-media-strategies": { primary: ["marketing"], secondary: ["design"] },
  "intro-to-social-media-strategy": { primary: ["marketing"], secondary: ["design"] },
  "graphic-design": { primary: ["design"], secondary: ["marketing"] },
  "publication-design": { primary: ["design"], secondary: ["marketing"] },
  "digital-video-production": { primary: ["design"], secondary: ["speaking"] },
  "broadcast-journalism": { primary: ["design", "speaking"], secondary: [] },
  "public-service-announcement": { primary: ["design"], secondary: ["speaking"] },
  journalism: { primary: ["speaking"], secondary: ["design"] },
  "digital-animation": { primary: ["design"], secondary: ["tech"] },
  "website-design": { primary: ["design", "tech"], secondary: [] },
  "website-coding-development": { primary: ["tech"], secondary: ["design"] },
  "computer-game-simulation-programming": { primary: ["tech"], secondary: ["design"] },
  "management-information-systems": { primary: ["tech"], secondary: ["business"] },
  "data-analysis": { primary: ["tech"], secondary: ["business"] },
  "computer-applications": { primary: ["tech"], secondary: ["business"] },
  "business-communication": { primary: ["speaking"], secondary: ["business"] },
  "intro-to-business-communication": { primary: ["speaking"], secondary: ["business"] },
  "intro-to-business-presentation": { primary: ["business"], secondary: ["speaking"] },
  "intro-to-business": { primary: ["business"], secondary: ["money"] },
  "community-service-project": { primary: ["careers"], secondary: ["speaking"] },
  "local-chapter-annual-business-report": { primary: ["careers"], secondary: ["speaking"] },
};

/** 0 none, 1 a demo or short Q&A, 2 a prepared talk, 3 live and unscripted. */
const SPEAK_LOAD: Record<EventKind, 0 | 1 | 2 | 3> = {
  "objective-test": 0,
  production: 0,
  build: 1,
  presentation: 2,
  "test-and-presentation": 2,
  "chapter-event": 2,
  "test-then-role-play": 3,
  impromptu: 3,
  interview: 3,
};

/** 1 light (study for a test), 2 steady, 3 a season-long project. */
const EFFORT: Record<EventKind, 1 | 2 | 3> = {
  "objective-test": 1,
  impromptu: 1,
  production: 2,
  presentation: 2,
  "test-then-role-play": 2,
  interview: 2,
  build: 3,
  "test-and-presentation": 3,
  "chapter-event": 3,
};

export type TeamSize = { min: number; max: number } | null;

export type Traits = {
  kind: EventKind;
  /** "Introduction to" events are for grades 9 and 10 only. */
  intro: boolean;
  /** null = individual event. */
  team: TeamSize;
  /** 0 none, 1 demo or short Q&A, 2 prepared talk, 3 live and unscripted. */
  speak: 0 | 1 | 2 | 3;
  /** 1 light, 2 steady, 3 season-long project. */
  effort: 1 | 2 | 3;
  subjects: SubjectMix;
};

function teamSize(c: Competition): TeamSize {
  if (!c.isTeam) return null;
  const m = (c.longDescription ?? "").match(/(?:[Tt]eam event \(|team of )(\d) (?:to|or) (\d) members/);
  return m ? { min: Number(m[1]), max: Number(m[2]) } : { min: 1, max: 3 };
}

export function traitsOf(c: Competition): Traits {
  const kind: EventKind =
    c.slug === "impromptu-speaking" ? "impromptu" : BUILD_SLUGS.has(c.slug) ? "build" : c.format;

  return {
    kind,
    intro: c.name.startsWith("Introduction to"),
    team: teamSize(c),
    speak: SPEAK_LOAD[kind],
    // A business plan is a written plan plus a pitch: a season-long project.
    effort: c.slug === "business-plan" ? 3 : EFFORT[kind],
    subjects: SUBJECT_OVERRIDES[c.slug] ?? { primary: [CATEGORY_SUBJECT[c.category]], secondary: [] },
  };
}

/* ── Scoring ──────────────────────────────────────────────── */

/** One line of an event's score: its points and what it means for the student. */
export type Part = {
  points: number;
  /** Shown in "why it fits" when the part helps. Lowercase, second person. */
  reason?: string;
  /** Shown as the one catch when the part hurts enough to mention. */
  caveat?: string;
  /** Short label for the "how this was scored" breakdown. */
  label: string;
};

export type Scored = {
  event: Competition;
  traits: Traits;
  score: number;
  parts: Part[];
};

const STYLE_REASON: Record<Style, string> = {
  test: "you like proving it on a test",
  talk: "you're comfortable thinking on your feet",
  present: "you like preparing something and presenting it",
  build: "you like building things",
};

const SPEAK_REASON: Record<Speaking, string | undefined> = {
  love: "you enjoy speaking in front of people",
  prepared: "you can rehearse what you'll say",
  avoid: "you never have to speak in front of judges",
};

const TIME_REASON: Record<Time, [string?, string?, string?]> = {
  light: ["it fits a lighter schedule"],
  steady: [undefined, "it rewards steady weekly practice"],
  deep: [undefined, undefined, "you have time for a season-long project"],
};

function speakCaveat(t: Traits): string {
  if (t.kind === "test-then-role-play") return "finalists handle a role play live in front of judges";
  if (t.speak === 3) return "you'll answer judges live, with no script";
  return "you'll present to judges";
}

function experienceParts(c: Competition, exp: Experience | undefined): Part[] {
  if (!exp) return [];
  const out: Part[] = [];
  if (ADVANCED_SLUGS.has(c.slug)) {
    if (exp === "none")
      out.push({ points: WEIGHTS.advancedWithoutClasses, label: "Builds on classes you haven't taken", caveat: "it builds on earlier accounting coursework" });
    if (exp === "lots")
      out.push({ points: WEIGHTS.advancedWithClasses, label: "Builds on classes you've taken", reason: "you've already taken several classes" });
  }
  if (CAPPED_SLUGS.has(c.slug) && exp === "lots")
    out.push({ points: WEIGHTS.cappedEventWithLotsOfClasses, label: "Coursework cap", caveat: "it's limited to students with two semesters of accounting or less" });
  return out;
}

/** Scores one event, or returns null when the student is not eligible for it. */
export function scoreEvent(c: Competition, a: Answers): Scored | null {
  const t = traitsOf(c);
  const upperclass = a.grade === "11" || a.grade === "12";
  if (t.intro && upperclass) return null;

  const parts: Part[] = [];

  if (a.style) {
    const fit = STYLE_FIT[t.kind][a.style];
    if (fit) parts.push({ points: fit * WEIGHTS.style, label: "How you like to compete", reason: fit >= 2 ? STYLE_REASON[a.style] : undefined });
  }

  for (const s of a.subjects) {
    if (t.subjects.primary.includes(s))
      parts.push({ points: WEIGHTS.subjectPrimary, label: `Subject: ${SUBJECT_LABEL[s]}`, reason: `you like ${SUBJECT_LABEL[s]}` });
    else if (t.subjects.secondary.includes(s))
      parts.push({ points: WEIGHTS.subjectSecondary, label: `Touches ${SUBJECT_LABEL[s]}`, reason: `it touches on ${SUBJECT_LABEL[s]}` });
  }

  if (a.team === "team") {
    if (t.team) parts.push({ points: WEIGHTS.teamMatch, label: "Team event", reason: "you want a team" });
    else parts.push({ points: WEIGHTS.soloForTeamFan, label: "Individual event", caveat: "it's an individual event" });
  } else if (a.team === "solo") {
    if (!t.team) parts.push({ points: WEIGHTS.teamMatch, label: "Individual event", reason: "you'd rather compete on your own" });
    else if (t.team.min <= 1) parts.push({ points: WEIGHTS.flexTeamForSoloFan, label: "Team event you can enter alone" });
    else parts.push({ points: WEIGHTS.bigTeamForSoloFan, label: "Needs a full team", caveat: `it needs a team of ${t.team.min} or ${t.team.max}` });
  }

  if (a.speaking) {
    const p = SPEAKING_FIT[a.speaking][t.speak];
    if (p) {
      const helps = p >= 1.5 || (a.speaking === "prepared" && p >= 1);
      parts.push({
        points: p,
        label: "Speaking",
        reason: helps ? SPEAK_REASON[a.speaking] : undefined,
        caveat: p <= -2 ? speakCaveat(t) : undefined,
      });
    }
  }

  if (a.time) {
    const p = TIME_FIT[a.time][t.effort - 1];
    if (p) parts.push({ points: p, label: "Time it takes", reason: p >= 1 ? TIME_REASON[a.time][t.effort - 1] : undefined, caveat: p <= -2 ? "it takes more prep time than you mentioned" : undefined });
  }

  if (t.intro && (a.grade === "9" || a.grade === "10"))
    parts.push({ points: WEIGHTS.introForUnderclassmen, label: "Written for grades 9 and 10", reason: "it's built for 9th and 10th graders" });

  parts.push(...experienceParts(c, a.experience));

  if (c.format === "chapter-event") parts.push({ points: WEIGHTS.chapterEvent, label: "A chapter's project, not your own event" });
  if (c.popular) parts.push({ points: WEIGHTS.popular, label: "Popular event" });

  const score = Math.round(parts.reduce((sum, p) => sum + p.points, 0) * 10) / 10;
  return { event: c, traits: t, score, parts };
}

/** Every eligible event, best match first. Ties: popular first, then A to Z. */
export function rankEvents(a: Answers, events: Competition[] = COMPETITIONS): Scored[] {
  return events
    .map((c) => scoreEvent(c, a))
    .filter((s): s is Scored => s !== null)
    .sort(
      (x, y) =>
        y.score - x.score ||
        Number(!!y.event.popular) - Number(!!x.event.popular) ||
        x.event.name.localeCompare(y.event.name),
    );
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/** "You want a team, you like marketing, and you're comfortable thinking on your feet." */
export function whySentence(s: Scored): string {
  const reasons = s.parts
    .filter((p) => p.reason && p.points > 0)
    .sort((x, y) => y.points - x.points)
    .map((p) => p.reason as string)
    .filter((r, i, all) => all.indexOf(r) === i)
    .slice(0, 3);
  if (!reasons.length) return "It's the closest overall match to your answers.";
  const text = joinList(reasons);
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}

/** The single biggest drawback worth flagging, if any. */
export function caveatOf(s: Scored): string | null {
  const worst = s.parts
    .filter((p) => p.caveat)
    .sort((x, y) => x.points - y.points)[0];
  return worst ? `One catch: ${worst.caveat}.` : null;
}

/** "Individual", "Team of 1 to 3", "Team of 4 or 5". */
export function teamLabel(t: Traits): string {
  if (!t.team) return "Individual";
  return `Team of ${t.team.min} ${t.team.max - t.team.min === 1 ? "or" : "to"} ${t.team.max}`;
}
