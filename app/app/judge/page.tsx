"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { COMPETITIONS, FORMAT_LABEL, getCompetition, type Competition } from "@/lib/competitions";
import { getRegistered } from "@/lib/storage";
import {
  criteriaFor,
  formatClock,
  hasNoQA,
  judgeModeFor,
  presentationLimit,
  qaMinutes,
  rolePlayTiming,
  ROLE_PLAY_STANDARD,
  submissionNoun,
} from "@/components/judge/rubric";
import {
  countWords,
  MAX_CHARS,
  MIN_WORDS,
  type CardResponse,
  type ErrorResponse,
  type FollowUpResponse,
  type FollowUpResult,
  type JudgeMode,
  type JudgeRequest,
  type JudgeResult,
  type RolePlayCard,
  type ScoreResponse,
} from "@/components/judge/types";
import { Timer, useCountdown } from "@/components/judge/Timer";
import { ResponseInput } from "@/components/judge/ResponseInput";
import { RolePlayCardView } from "@/components/judge/RolePlayCardView";
import { RatingSheet } from "@/components/judge/RatingSheet";
import { FollowUpRound } from "@/components/judge/FollowUpRound";
import "./judge.css";

// ── Events the judge covers (every format with a judged performance) ──

const byName = (a: Competition, b: Competition) => a.name.localeCompare(b.name);
const JUDGED = COMPETITIONS.filter((c) => judgeModeFor(c.format) !== null);
const ROLE_PLAY_EVENTS = JUDGED.filter((c) => judgeModeFor(c.format) === "role-play").sort(byName);
const PRESENTATION_EVENTS = JUDGED.filter((c) => judgeModeFor(c.format) === "presentation").sort(byName);

function isJudged(slug: string | null | undefined): slug is string {
  return !!slug && JUDGED.some((c) => c.slug === slug);
}

type Phase = "setup" | "drawing" | "prep" | "perform" | "judging" | "results";

async function callJudge<T>(body: JudgeRequest): Promise<T> {
  let res: Response;
  try {
    res = await fetch("/api/judge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Could not reach the judge. Check your connection and try again.");
  }
  const data = (await res.json().catch(() => null)) as (T & Partial<ErrorResponse>) | null;
  if (!res.ok || !data) {
    throw new Error(data?.error || "The judge could not score this. Try again.");
  }
  return data;
}

// ── Page ───────────────────────────────────────────────────────

function JudgeInner() {
  const searchParams = useSearchParams();
  const paramSlug = searchParams.get("event");

  const [slug, setSlug] = useState<string>(() => (isJudged(paramSlug) ? paramSlug : ""));
  const [phase, setPhase] = useState<Phase>("setup");
  const [error, setError] = useState("");

  // Role play
  const [card, setCard] = useState<RolePlayCard | null>(null);
  const [drawCount, setDrawCount] = useState(0);
  const [prepEndAt, setPrepEndAt] = useState<number | null>(null);
  const [performEndAt, setPerformEndAt] = useState<number | null>(null);
  const [notecard, setNotecard] = useState("");

  // Shared
  const [response, setResponse] = useState("");
  const [spoken, setSpoken] = useState(false);
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [submitted, setSubmitted] = useState("");
  const [overtimeSec, setOvertimeSec] = useState(0);

  // Follow-up round (presentation)
  const [followBusy, setFollowBusy] = useState(false);
  const [followError, setFollowError] = useState("");
  const [followResult, setFollowResult] = useState<FollowUpResult | null>(null);

  // Screen reader announcements: timer events are urgent, results are not.
  const [urgent, setUrgent] = useState("");
  const [polite, setPolite] = useState("");

  const requestId = useRef(0);
  const sheetHeadingRef = useRef<HTMLHeadingElement>(null);
  const followHeadingRef = useRef<HTMLHeadingElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const announcedRef = useRef<Set<string>>(new Set());

  // Preselect the student's registered event when the URL does not name one.
  useEffect(() => {
    if (slug) return;
    const mine = getRegistered().find((s) => isJudged(s));
    if (mine) setSlug(mine);
    // Runs once on mount; later picks are the student's own.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const comp = slug ? getCompetition(slug) ?? null : null;
  const mode: JudgeMode | null = comp ? judgeModeFor(comp.format) : null;
  const timing = useMemo(() => (comp ? rolePlayTiming(comp) : { prepMin: 20, performMin: 7 }), [comp]);
  const limit = comp ? presentationLimit(comp) : null;

  const prepLeft = useCountdown(phase === "prep" ? prepEndAt : null);
  const performLeft = useCountdown(phase === "perform" ? performEndAt : null);

  function resetRun() {
    requestId.current += 1;
    setPhase("setup");
    setError("");
    setCard(null);
    setPrepEndAt(null);
    setPerformEndAt(null);
    setNotecard("");
    setResponse("");
    setSpoken(false);
    setResult(null);
    setSubmitted("");
    setOvertimeSec(0);
    setFollowBusy(false);
    setFollowError("");
    setFollowResult(null);
    announcedRef.current = new Set();
  }

  function pickEvent(next: string) {
    resetRun();
    setSlug(next);
  }

  // ── Role play flow ───────────────────────────────────────────

  async function drawCard() {
    if (!comp) return;
    const id = ++requestId.current;
    setError("");
    setResult(null);
    setResponse("");
    setSpoken(false);
    setNotecard("");
    setPhase("drawing");
    setPolite("Drawing a role play card.");
    try {
      const data = await callJudge<CardResponse>({ action: "card", slug: comp.slug });
      if (id !== requestId.current) return;
      setCard(data.card);
      setDrawCount((n) => n + 1);
      announcedRef.current = new Set();
      setPrepEndAt(Date.now() + timing.prepMin * 60 * 1000);
      setPhase("prep");
      setUrgent(`Card drawn: ${data.card.title}. Your ${timing.prepMin} minutes of prep time have started.`);
    } catch (e) {
      if (id !== requestId.current) return;
      setError((e as Error).message);
      setPhase("setup");
    }
  }

  const startPerformance = useCallback(
    (reason: "early" | "time") => {
      setPrepEndAt(null);
      setPerformEndAt(Date.now() + timing.performMin * 60 * 1000);
      setPhase("perform");
      setUrgent(
        reason === "time"
          ? `Prep time is over. Your ${timing.performMin}-minute role play has started.`
          : `Your ${timing.performMin}-minute role play has started.`
      );
    },
    [timing.performMin]
  );

  function performAgain() {
    requestId.current += 1;
    setResult(null);
    setResponse("");
    setSpoken(false);
    setError("");
    setOvertimeSec(0);
    announcedRef.current = new Set();
    startPerformance("early");
  }

  // Prep runs out: move straight to the performance, like the real event.
  useEffect(() => {
    if (phase === "prep" && prepEndAt !== null && prepLeft <= 0) startPerformance("time");
  }, [phase, prepEndAt, prepLeft, startPerformance]);

  // One-minute warning and time call, each announced once.
  useEffect(() => {
    if (phase !== "perform" || performEndAt === null) return;
    const seen = announcedRef.current;
    if (performLeft <= 60 && performLeft > 0 && !seen.has("one-minute")) {
      seen.add("one-minute");
      setUrgent("One minute left.");
    }
    if (performLeft <= 0 && !seen.has("time")) {
      seen.add("time");
      setUrgent("Time. At the conference the judges would stop you here. Finish your sentence and submit.");
    }
  }, [phase, performEndAt, performLeft]);

  useEffect(() => {
    if (phase === "prep" && prepLeft <= 60 && prepLeft > 0 && !announcedRef.current.has("prep-minute")) {
      announcedRef.current.add("prep-minute");
      setUrgent("One minute of prep left.");
    }
  }, [phase, prepLeft]);

  // ── Scoring ──────────────────────────────────────────────────

  async function submitForScore() {
    if (!comp || !mode) return;
    const text = response.trim();
    if (countWords(text) < MIN_WORDS) {
      setError(`Give the judge at least ${MIN_WORDS} words to score. You have ${countWords(text)}.`);
      return;
    }
    const over = mode === "role-play" && performEndAt !== null ? Math.max(0, Math.floor(-performLeft)) : 0;
    const leftAtSubmit = performLeft;
    const id = ++requestId.current;
    setError("");
    setOvertimeSec(over);
    setSubmitted(text);
    setPerformEndAt(null);
    setPhase("judging");
    setPolite("The judge is scoring your performance.");
    try {
      const data = await callJudge<ScoreResponse>({
        action: "score",
        slug: comp.slug,
        mode,
        response: text,
        card: mode === "role-play" ? card ?? undefined : undefined,
        overtimeSec: over,
        spoken,
      });
      if (id !== requestId.current) return;
      setResult(data.result);
      setFollowResult(null);
      setFollowError("");
      setPhase("results");
      setPolite(
        `Scored ${data.result.total} out of 100.${
          data.result.questions.length ? ` The judges have ${data.result.questions.length} follow-up questions.` : ""
        }`
      );
    } catch (e) {
      if (id !== requestId.current) return;
      setError((e as Error).message);
      // Send them back to where their words are, with the text intact.
      setPhase(mode === "role-play" ? "perform" : "setup");
      if (mode === "role-play") setPerformEndAt(Date.now() + leftAtSubmit * 1000);
    }
  }

  async function scoreFollowUp(answers: string[]) {
    if (!comp || !result) return;
    const id = requestId.current;
    setFollowBusy(true);
    setFollowError("");
    try {
      const data = await callJudge<FollowUpResponse>({
        action: "followup",
        slug: comp.slug,
        submission: submitted,
        questions: result.questions,
        answers,
      });
      if (id !== requestId.current) return;
      setFollowResult(data.followup);
      setPolite(`Q and A scored ${data.followup.total} out of 100.`);
    } catch (e) {
      if (id !== requestId.current) return;
      setFollowError((e as Error).message);
    } finally {
      if (id === requestId.current) setFollowBusy(false);
    }
  }

  function reviseSubmission() {
    requestId.current += 1;
    setResponse(submitted);
    setResult(null);
    setFollowResult(null);
    setFollowError("");
    setError("");
    setPhase("setup");
  }

  // ── Focus management ─────────────────────────────────────────

  useEffect(() => {
    if (phase === "results") sheetHeadingRef.current?.focus();
    else if (phase === "prep" || phase === "perform" || phase === "judging") stageRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    if (followResult) followHeadingRef.current?.focus();
  }, [followResult]);

  // ── Render ───────────────────────────────────────────────────

  const wide = phase === "prep" || phase === "perform";
  const noun = comp ? submissionNoun(comp) : "presentation";

  return (
    <div className={`judge${wide ? " judge-wide" : ""}`}>
      <p className="sr-only" role="status" aria-live="assertive" aria-atomic="true">
        {urgent}
      </p>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {polite}
      </p>

      <header className="judge-hero">
        <p className="eyebrow">Judge</p>
        <h1 className="judge-h1">
          Practice for the <em>judges</em>, not just the test.
        </h1>
        <p className="judge-lede">
          {JUDGED.length} events are decided by a role play, presentation, or interview. Pick yours, perform it here, and get it back marked up like a real rating sheet.
        </p>
      </header>

      {(phase === "setup" || phase === "drawing") && (
        <SetupPanel
          slug={slug}
          comp={comp}
          mode={mode}
          timing={timing}
          limit={limit}
          noun={noun}
          busy={phase === "drawing"}
          error={error}
          response={response}
          onResponse={setResponse}
          onSpoken={() => setSpoken(true)}
          onPick={pickEvent}
          onDraw={drawCard}
          onSubmit={submitForScore}
        />
      )}

      {phase === "prep" && comp && card && (
        <div className="judge-stage" ref={stageRef} tabIndex={-1} aria-label="Prep time">
          <div className="judge-stage-side">
            <RolePlayCardView card={card} comp={comp} prepMin={timing.prepMin} performMin={timing.performMin} drawNumber={drawCount} />
          </div>
          <div className="judge-stage-right">
            <div className="judge-stage-timer">
              <Timer
                label="Prep time"
                totalSec={timing.prepMin * 60}
                remainingSec={prepLeft}
                caption={`Then ${timing.performMin} minutes in front of the judges.`}
              />
              <div className="judge-actions">
                <button type="button" className="btn btn-accent btn-lg" onClick={() => startPerformance("early")}>
                  I am ready, start the role play
                </button>
                <button type="button" className="btn btn-ghost" onClick={resetRun}>
                  Start over
                </button>
              </div>
            </div>
            <div className="judge-stage-main judge-notecard">
              <ResponseInput
                id="judge-notecard"
                label="Notecard"
                hint="For your prep notes. Not scored, and it stays beside you during the role play."
                value={notecard}
                onChange={setNotecard}
                rows={7}
                maxLength={3000}
              />
            </div>
          </div>
        </div>
      )}

      {phase === "perform" && comp && card && (
        <div className="judge-stage judge-stage-perform" ref={stageRef} tabIndex={-1} aria-label="Role play in progress">
          <div className="judge-stage-side">
            <RolePlayCardView card={card} comp={comp} prepMin={timing.prepMin} performMin={timing.performMin} drawNumber={drawCount} />
            {notecard.trim() && (
              <div className="judge-notecard-read">
                <p className="judge-notecard-label">Your notecard</p>
                <p className="judge-notecard-text">{notecard}</p>
              </div>
            )}
          </div>
          <div className="judge-stage-right">
            <div className="judge-stage-timer">
              <Timer
                label="Role play"
                totalSec={timing.performMin * 60}
                remainingSec={performLeft}
                caption={performLeft <= 0 ? "Time. Finish your sentence and submit." : "Talk to the judges as if they are across the table."}
              />
            </div>
            <div className="judge-stage-main">
              <ResponseInput
                id="judge-response"
                label="Your role play"
                hint="Type what you would say, or press Speak and say it. Greet the judges, restate the problem, then walk through every task on the card."
                value={response}
                onChange={setResponse}
                onSpoken={() => setSpoken(true)}
                rows={12}
                maxLength={MAX_CHARS}
                showSpokenEstimate
              />
              {error && (
                <p className="judge-error" role="alert">
                  {error}
                </p>
              )}
              <div className="judge-actions">
                <button type="button" className="btn btn-accent btn-lg" onClick={submitForScore}>
                  Finish and get scored
                </button>
                <button type="button" className="btn btn-ghost" onClick={resetRun}>
                  Start over
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === "judging" && (
        <div className="judge-reading" ref={stageRef} tabIndex={-1} aria-busy="true" aria-label="Judging">
          <div className="judge-reading-sheet" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="judge-reading-title">The judge is reading.</p>
          <p className="judge-reading-note">
            Scoring against {comp && mode ? criteriaFor(comp, mode, card).length : "each"} criteria on the rating sheet. This usually takes 20 to 40 seconds.
          </p>
        </div>
      )}

      {phase === "results" && comp && result && (
        <div className="judge-results">
          <RatingSheet result={result} comp={comp} headingRef={sheetHeadingRef} />

          {overtimeSec > 0 && (
            <p className="judge-overtime">
              You ran {formatClock(overtimeSec)} over. At the conference the judges stop you at time, so anything after that would not count.
            </p>
          )}

          <details className="judge-submitted">
            <summary>What you handed the judge ({countWords(submitted)} words)</summary>
            <p>{submitted}</p>
          </details>

          {result.mode === "presentation" && result.questions.length > 0 && (
            <FollowUpRound
              key={result.questions.join("|")}
              questions={result.questions}
              qaMin={qaMinutes(comp)}
              noQA={hasNoQA(comp)}
              busy={followBusy}
              error={followError}
              result={followResult}
              onScore={scoreFollowUp}
              resultHeadingRef={followHeadingRef}
            />
          )}

          <div className="judge-actions judge-next">
            {result.mode === "role-play" ? (
              <>
                <button type="button" className="btn btn-accent btn-lg" onClick={drawCard}>
                  Draw a new card
                </button>
                <button type="button" className="btn btn-ghost" onClick={performAgain}>
                  Perform this card again
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-accent btn-lg" onClick={reviseSubmission}>
                Revise and resubmit
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={resetRun}>
              Pick another event
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Setup: pick an event, then draw a card or hand in a presentation ──

type SetupProps = {
  slug: string;
  comp: Competition | null;
  mode: JudgeMode | null;
  timing: { prepMin: number; performMin: number };
  limit: number | null;
  noun: string;
  busy: boolean;
  error: string;
  response: string;
  onResponse: (v: string) => void;
  onSpoken: () => void;
  onPick: (slug: string) => void;
  onDraw: () => void;
  onSubmit: () => void;
};

function SetupPanel({
  slug,
  comp,
  mode,
  timing,
  limit,
  noun,
  busy,
  error,
  response,
  onResponse,
  onSpoken,
  onPick,
  onDraw,
  onSubmit,
}: SetupProps) {
  const criteria = comp && mode === "presentation" ? criteriaFor(comp, "presentation") : [];
  const words = countWords(response);
  const qa = comp ? qaMinutes(comp) : null;

  const steps: { title: string; detail: string }[] =
    mode === "role-play"
      ? [
          { title: "Draw a card", detail: "A new case written for this event." },
          { title: `Prep, ${timing.prepMin}:00`, detail: "Start early whenever you are ready." },
          { title: `Perform, ${timing.performMin}:00`, detail: "Type it, or speak it out loud." },
          { title: "Get scored", detail: "Against the rating sheet, out of 100." },
        ]
      : [
          { title: `Hand in your ${noun}`, detail: limit ? `Paste it or speak it. The limit is ${limit} minutes.` : "Paste it or speak it." },
          { title: "Get scored", detail: `Against all ${criteria.length} rating-sheet criteria.` },
          { title: "Face questions", detail: qa ? `Answer what the judges ask, as in the ${qa}-minute Q&A.` : "Answer what a judge would ask." },
          { title: "Q&A scored", detail: "A short second round, out of 100." },
        ];

  return (
    <div className="judge-setup">
      <div className="judge-pick">
        <label htmlFor="judge-event" className="judge-input-label">
          Your event
        </label>
        <select
          id="judge-event"
          className="input-field judge-select"
          value={slug}
          onChange={(e) => onPick(e.target.value)}
          disabled={busy}
        >
          <option value="">Choose a judged event</option>
          <optgroup label="Role play events">
            {ROLE_PLAY_EVENTS.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Presentation, speech, and interview events">
            {PRESENTATION_EVENTS.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </optgroup>
        </select>
        <p className="judge-input-hint">
          Objective-test-only events are not here.{" "}
          <Link href="/app/coach" className="judge-link">
            Use AI Practice for those.
          </Link>
        </p>
      </div>

      {comp && mode && (
        <>
          <div className="judge-slip">
            <div className="judge-slip-chips">
              <span className="chip chip-format">{FORMAT_LABEL[comp.format]}</span>
              <span className="chip">{comp.isTeam ? "Team event" : "Individual event"}</span>
              {mode === "role-play" ? (
                <>
                  <span className="chip">{timing.prepMin} min prep</span>
                  <span className="chip">{timing.performMin} min role play</span>
                </>
              ) : (
                <>
                  {limit && <span className="chip">{limit} min limit</span>}
                  {qa && <span className="chip">{qa} min Q&amp;A</span>}
                </>
              )}
            </div>
            <ol className="judge-steps">
              {steps.map((s, i) => (
                <li key={s.title}>
                  <span className="judge-step-num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="judge-step-title">{s.title}</span>
                  <span className="judge-step-detail">{s.detail}</span>
                </li>
              ))}
            </ol>

            <details className="judge-criteria">
              <summary>What the judges score</summary>
              {mode === "role-play" ? (
                <>
                  <p>Two or three of this event&apos;s topics, chosen by the card you draw, plus the rows every role play rating sheet carries:</p>
                  <ul>
                    {ROLE_PLAY_STANDARD.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <ul>
                  {criteria.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              )}
            </details>
          </div>

          {error && (
            <p className="judge-error" role="alert">
              {error}
            </p>
          )}

          {mode === "role-play" ? (
            <div className="judge-actions">
              <button
                type="button"
                className={`btn btn-accent btn-lg${busy ? " btn-loading" : ""}`}
                onClick={onDraw}
                disabled={busy}
              >
                <span className="btn-text">{busy ? "Writing your card" : "Draw a role play card"}</span>
              </button>
              <p className="judge-actions-note">
                The prep clock starts the moment the card appears.
              </p>
            </div>
          ) : (
            <div className="judge-compose">
              <ResponseInput
                id="judge-response"
                label={comp.format === "interview" ? "Your interview answers" : "Your presentation script or outline"}
                hint={
                  comp.format === "interview"
                    ? "Answer the questions you expect, such as tell us about yourself, why this role, and a time you led. Put each question first, then your answer. Or press Speak."
                    : `Paste your script or a detailed outline, or press Speak and deliver it.${limit ? ` At a steady pace ${limit} minutes is about ${limit * 140} words.` : ""}`
                }
                value={response}
                onChange={onResponse}
                onSpoken={onSpoken}
                rows={14}
                maxLength={MAX_CHARS}
                showSpokenEstimate
              />
              <div className="judge-actions">
                <button type="button" className="btn btn-accent btn-lg" onClick={onSubmit} disabled={words === 0}>
                  Hand it to the judge
                </button>
                <p className="judge-actions-note">
                  {words < MIN_WORDS ? `The judge needs at least ${MIN_WORDS} words.` : "Scored honestly. Most first drafts land between 40 and 60."}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function JudgePage() {
  return (
    <Suspense fallback={<div className="judge-loading">Loading the judge...</div>}>
      <JudgeInner />
    </Suspense>
  );
}
