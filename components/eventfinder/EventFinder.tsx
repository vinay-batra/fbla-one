"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { PenCheck } from "@/components/PenMarks";
import {
  EMPTY_ANSWERS,
  QUESTIONS,
  selectedValues,
  type Answers,
  type Question,
} from "./questions";
import { Results } from "./Results";

/**
 * "Which FBLA event is for me?" One question per sheet of exam paper; each
 * answer is a card with a Scantron bubble that gets filled in and checked in
 * red pen. Scoring is pure client code (scoring.ts), nothing leaves the page.
 *
 * Keyboard: number keys pick an answer, arrow keys move between answers (and
 * pick, on single-choice questions), Enter continues, Backspace goes back.
 * A tap on a single-choice card picks it and moves on by itself after the
 * check mark draws; keyboard picks never auto-advance, so arrowing through the
 * choices is safe.
 */

const AUTO_ADVANCE_MS = 560;
const AUTO_ADVANCE_REDUCED_MS = 180;

function prefersReducedMotion() {
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Answers with this question's value set (or toggled, for multi-select). */
function withChoice(a: Answers, q: Question, value: string, toggle: boolean): Answers {
  if (q.id === "subjects") {
    const cur = a.subjects as string[];
    const max = q.multi?.max ?? 1;
    let next: string[];
    if (cur.includes(value)) next = toggle ? cur.filter((v) => v !== value) : cur;
    // At the limit, a new pick replaces the oldest one instead of being refused.
    else next = [...cur, value].slice(-max);
    return { ...a, subjects: next as Answers["subjects"] };
  }
  return { ...a, [q.id]: value } as Answers;
}

export function EventFinder() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [done, setDone] = useState(false);
  const [live, setLive] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const timer = useRef<number | null>(null);
  // Only move focus after the student has navigated, never on first load.
  const navigated = useRef(false);

  const q = QUESTIONS[step];
  const picked = selectedValues(answers, q.id);
  const canContinue = picked.length > 0;
  const isLast = step === QUESTIONS.length - 1;

  const clearTimer = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };
  useEffect(() => clearTimer, []);

  const goTo = useCallback((next: number) => {
    clearTimer();
    navigated.current = true;
    setStep(next);
  }, []);

  const advance = useCallback(
    (a: Answers = answers) => {
      clearTimer();
      if (selectedValues(a, QUESTIONS[step].id).length === 0) return;
      if (step < QUESTIONS.length - 1) goTo(step + 1);
      else setDone(true);
    },
    [answers, step, goTo],
  );

  const back = useCallback(() => {
    if (step > 0) goTo(step - 1);
  }, [step, goTo]);

  const choose = useCallback(
    (index: number, opts: { toggle: boolean; autoAdvance: boolean }) => {
      const choice = q.choices[index];
      if (!choice) return;
      clearTimer();
      const next = withChoice(answers, q, choice.value, opts.toggle);
      setAnswers(next);
      if (opts.autoAdvance && !q.multi) {
        timer.current = window.setTimeout(
          () => advance(next),
          prefersReducedMotion() ? AUTO_ADVANCE_REDUCED_MS : AUTO_ADVANCE_MS,
        );
      }
    },
    [answers, q, advance],
  );

  // Announce each new question and put focus on its answers.
  useEffect(() => {
    if (done) return;
    setLive(`Question ${step + 1} of ${QUESTIONS.length}. ${QUESTIONS[step].prompt}`);
    if (!navigated.current) return;
    const vals = selectedValues(answers, QUESTIONS[step].id);
    const idx = Math.max(0, QUESTIONS[step].choices.findIndex((c) => vals.includes(c.value)));
    cardRefs.current[idx]?.focus({ preventScroll: true });
    // Answers are read at the moment the step changes, not on every pick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, done]);

  // The quiz sits partway down the landing page, so its keys only count while
  // it is actually on screen (otherwise Enter or 1-9 anywhere would answer it).
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [done]);

  // Page-level keys, active only while the quiz is on screen.
  useEffect(() => {
    if (done || !onScreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      // Leave dialogs (chat, feedback) alone.
      if (t && t.closest('[role="dialog"]')) return;
      const onCard = !!t?.closest("[data-ef-choice]");
      const interactive = !!t?.closest("a, button, summary");

      if (/^[1-9]$/.test(e.key)) {
        const i = Number(e.key) - 1;
        if (i < q.choices.length) {
          e.preventDefault();
          choose(i, { toggle: true, autoAdvance: false });
          cardRefs.current[i]?.focus();
        }
        return;
      }
      if (e.key === "Enter") {
        // Enter on the Back / Continue buttons or a link keeps its own meaning.
        if (interactive && !onCard) return;
        e.preventDefault();
        if (canContinue) advance();
        else if (onCard) {
          const i = cardRefs.current.findIndex((el) => el === t?.closest("[data-ef-choice]"));
          if (i >= 0) choose(i, { toggle: true, autoAdvance: false });
        }
        return;
      }
      if (e.key === "Backspace" && step > 0) {
        e.preventDefault();
        back();
        return;
      }
      if (onCard && /^Arrow(Up|Down|Left|Right)$/.test(e.key)) {
        e.preventDefault();
        const cur = cardRefs.current.findIndex((el) => el === t?.closest("[data-ef-choice]"));
        const dir = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
        const n = q.choices.length;
        const i = (cur + dir + n) % n;
        cardRefs.current[i]?.focus();
        if (!q.multi) choose(i, { toggle: false, autoAdvance: false });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, onScreen, q, step, canContinue, choose, advance, back]);

  const restart = () => {
    clearTimer();
    setAnswers(EMPTY_ANSWERS);
    setDone(false);
    navigated.current = true;
    setStep(0);
    rootRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  };

  if (done) {
    return (
      <div ref={rootRef} className="ef-root">
        <Results answers={answers} onRestart={restart} />
      </div>
    );
  }

  const onCardClick = (i: number) => (e: MouseEvent<HTMLButtonElement>) => {
    // detail is 0 for a click synthesized from Space or Enter: no auto-advance.
    choose(i, { toggle: !!q.multi, autoAdvance: e.detail > 0 });
  };

  // Single choice is a radio group with a roving tab stop; multi is checkboxes.
  const rovingIndex = Math.max(0, q.choices.findIndex((c) => picked.includes(c.value)));

  return (
    <div ref={rootRef} className="ef-root sheet-stack">
      <div className="sheet ef-sheet">
        <div className="sheet-head">
          <span className="sheet-meta">
            Question {step + 1} <span className="sheet-of">of {QUESTIONS.length}</span>
          </span>
          <span className="sheet-event">Find your event</span>
        </div>

        <div className="ef-progress" aria-hidden="true">
          {QUESTIONS.map((item, i) => (
            <span key={item.id} className={i < step ? "is-done" : i === step ? "is-now" : ""} />
          ))}
        </div>

        <div key={q.id} className="ef-step">
          <h2 id="ef-q" className="ef-q">
            {q.prompt}
          </h2>
          {q.note && <p className="ef-note">{q.note}</p>}

          <div
            className={`ef-choices${q.choices.length > 4 ? " is-many" : ""}`}
            role={q.multi ? "group" : "radiogroup"}
            aria-labelledby="ef-q"
          >
            {q.choices.map((c, i) => {
              const on = picked.includes(c.value);
              return (
                <button
                  key={c.value}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  type="button"
                  data-ef-choice=""
                  role={q.multi ? "checkbox" : "radio"}
                  aria-checked={on}
                  tabIndex={q.multi || i === rovingIndex ? 0 : -1}
                  className={`ef-choice${on ? " is-on" : ""}`}
                  onClick={onCardClick(i)}
                >
                  <span className="ef-bubble" aria-hidden="true">
                    <span className="ef-bubble-n">{i + 1}</span>
                    {on && <PenCheck />}
                  </span>
                  <span className="ef-choice-text">
                    <span className="ef-choice-label">{c.label}</span>
                    {c.hint && <span className="ef-choice-hint">{c.hint}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {live}
        </p>

        <div className="sheet-foot ef-foot">
          <button type="button" className="sheet-next ef-back" onClick={back} disabled={step === 0}>
            <span aria-hidden="true">←</span> Back
          </button>
          <span className="sheet-hint ef-keys" aria-hidden="true">
            Press a number to pick, <kbd>Enter</kbd> to continue
          </span>
          <button
            type="button"
            className="btn btn-accent ef-next"
            onClick={() => advance()}
            disabled={!canContinue}
          >
            {isLast ? "See my events" : "Continue"} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
