"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSignedIn } from "@/components/useSignedIn";
import { PenCircle, PenCheck, PenCross } from "@/components/PenMarks";

/**
 * The landing page's centerpiece: a real, answerable practice question on a
 * sheet of exam paper, graded in red pen. It replaces a static screenshot of a
 * question, so the product proves itself instead of describing itself.
 *
 * Every answer here was checked by hand, and the arithmetic ones by computation
 * ($4,800 x 3/12 = $1,200; 20% / 10% = 2.0; $1,000 x 1.06^2 = $1,123.60). The
 * distractors are the mistakes students actually make, not filler.
 *
 * It is a real five-question test: after the last answer the sheet turns into
 * a graded report card with the score circled in red, what you missed, and a
 * way into a full-length test.
 */

type Q = {
  event: string;
  slug: string;
  /** What the question tests, shown on the report card. */
  topic: string;
  prompt: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  why: string;
};

const QUESTIONS: Q[] = [
  {
    event: "Accounting",
    slug: "accounting-i",
    topic: "Adjusting entries",
    prompt:
      "On October 1, a company prepays $4,800 for a 12-month insurance policy. What adjusting entry does it record on December 31?",
    options: [
      "Debit Prepaid Insurance $1,200, credit Insurance Expense $1,200",
      "Debit Insurance Expense $1,200, credit Prepaid Insurance $1,200",
      "Debit Insurance Expense $4,800, credit Prepaid Insurance $4,800",
      "Debit Insurance Expense $3,600, credit Prepaid Insurance $3,600",
    ],
    correct: 1,
    why: "October, November and December are used up: 3 of 12 months, so $4,800 × 3/12 = $1,200 moves from the asset to the expense. $3,600 is what is still prepaid, not what was used.",
  },
  {
    event: "Economics",
    slug: "economics",
    topic: "Price elasticity",
    prompt:
      "Concert ticket prices rise 10%, and the quantity demanded falls 20%. What is the price elasticity of demand?",
    options: ["0.5, inelastic", "0.5, elastic", "2.0, inelastic", "2.0, elastic"],
    correct: 3,
    why: "Elasticity is the percent change in quantity over the percent change in price: 20% ÷ 10% = 2.0. Anything above 1 is elastic, because buyers reacted more than the price moved.",
  },
  {
    event: "Business Law",
    slug: "business-law",
    topic: "Contracts with minors",
    prompt:
      "A 16-year-old signs a contract to buy a used car, then changes their mind a week later. The contract is generally:",
    options: [
      "Voidable, at the minor's option",
      "Void from the start",
      "Voidable, at the seller's option",
      "Fully enforceable against both parties",
    ],
    correct: 0,
    why: "Contracts with minors are voidable, and only the minor can choose to cancel. The adult seller stays bound unless the minor backs out.",
  },
  {
    event: "Personal Finance",
    slug: "personal-finance",
    topic: "Compound interest",
    prompt:
      "You deposit $1,000 at 6% interest, compounded annually. What is the balance after 2 years?",
    options: ["$1,120.00", "$1,060.00", "$1,123.60", "$1,191.02"],
    correct: 2,
    why: "Compounding earns interest on the interest: $1,000 × 1.06 × 1.06 = $1,123.60. Simple interest stops at $1,120, and $1,191.02 is three years, not two.",
  },
  {
    event: "Cybersecurity",
    slug: "cyber-security",
    topic: "Least privilege",
    prompt:
      "A company gives each employee access to only the systems their job requires, and nothing more. Which security principle is this?",
    options: ["Defense in depth", "Least privilege", "Separation of duties", "Non-repudiation"],
    correct: 1,
    why: "Least privilege gives every account the minimum access its job needs, so a stolen login can do less damage. Separation of duties is different: it splits one sensitive task between people so no one can finish it alone.",
  },
];

/** The teacher's note at the bottom of the report card, by score out of 5. */
const VERDICT = [
  "Everyone starts somewhere. This is exactly what practice is for.",
  "A rough first pass. Every miss below is a topic you now know to study.",
  "A start. Two or three topics to work on before competition day.",
  "Solid. Tighten up the topics you missed and you are close.",
  "Strong paper. One topic away from perfect.",
  "Perfect paper. Now try a full-length test.",
];

const LETTERS = ["A", "B", "C", "D"] as const;

/** The score, written in the top margin and circled, the way a teacher grades. */
function PenScore({ right, done }: { right: number; done: number }) {
  return (
    <div className="sheet-score" aria-hidden="true">
      <span>
        {right}/{done}
      </span>
      {/* keyed on `done` so the circle is redrawn each time the score changes */}
      <svg key={done} className="pen pen-score-circle" viewBox="0 0 64 44">
        <path d="M10 16C16 6 38 3 50 8c10 5 11 17 3 25-9 8-30 9-40 2C5 30 5 21 12 14c4-4 11-6 17-6" />
      </svg>
    </div>
  );
}

export function ExamSheet() {
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  // Running tally across questions, shown as a red-pen score once you answer.
  const [tally, setTally] = useState({ right: 0, done: 0 });
  // "out" lifts the sheet off the stack; "in" lays the next one down.
  const [turn, setTurn] = useState<"idle" | "out" | "in">("idle");
  // Per question: true = right, false = wrong, null = skipped or not reached.
  const [results, setResults] = useState<(boolean | null)[]>(() => QUESTIONS.map(() => null));
  const [finished, setFinished] = useState(false);
  const signedIn = useSignedIn();
  const isLast = qi === QUESTIONS.length - 1;
  const liveRef = useRef<HTMLParagraphElement>(null);
  const q = QUESTIONS[qi];
  const answered = picked !== null;
  const gotIt = picked === q.correct;

  // Move focus to the first option when the question changes via "Next", so a
  // keyboard user is not left on a button that just re-rendered.
  const firstOptRef = useRef<HTMLButtonElement>(null);
  const advanced = useRef(false);
  useEffect(() => {
    if (advanced.current) firstOptRef.current?.focus();
  }, [qi]);

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    setTally((t) => ({ right: t.right + (i === q.correct ? 1 : 0), done: t.done + 1 }));
    setResults((r) => r.map((v, k) => (k === qi ? i === q.correct : v)));
  };

  const swapQuestion = () => {
    advanced.current = true;
    setPicked(null);
    if (isLast) setFinished(true);
    else setQi((i) => i + 1);
  };

  const restart = () => {
    setPicked(null);
    setTally({ right: 0, done: 0 });
    setResults(QUESTIONS.map(() => null));
    setFinished(false);
    advanced.current = true;
    setQi(0);
  };

  const next = () => {
    if (turn !== "idle") return;
    const reduced =
      typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      swapQuestion();
      return;
    }
    // Lift the sheet off, swap the question while it is out of view, then lay
    // the new page down. Timings match the sheet-out / sheet-in keyframes.
    setTurn("out");
    window.setTimeout(() => {
      swapQuestion();
      setTurn("in");
      window.setTimeout(() => setTurn("idle"), 360);
    }, 280);
  };

  if (finished) {
    const right = results.filter((r) => r === true).length;
    const missed = QUESTIONS.filter((_, i) => results[i] !== true);
    return (
      <div className="sheet-stack">
        <div className="sheet sheet-report turn-in" aria-label="Your graded sample test">
          <div className="sheet-head">
            <span className="sheet-meta">Graded</span>
            <span className="sheet-event">Sample test</span>
          </div>

          <div className="report-score">
            <div className="report-big" aria-label={`${right} out of ${QUESTIONS.length}`}>
              <span>
                {right}
                <span className="report-slash">/</span>
                {QUESTIONS.length}
              </span>
              <svg className="pen report-circle" viewBox="0 0 120 80" aria-hidden="true">
                <path d="M18 30C28 10 70 4 94 14c18 8 22 30 8 46-16 16-56 18-76 6C6 56 6 38 20 24c8-8 22-12 34-12" />
              </svg>
            </div>
            <p className="report-verdict">{VERDICT[right]}</p>
          </div>

          <ol className="report-list">
            {QUESTIONS.map((item, i) => (
              <li key={item.slug} className={results[i] === true ? "is-right" : "is-missed"}>
                <span className="report-mark" aria-hidden="true">
                  {results[i] === true ? <PenCheck /> : <PenCross />}
                </span>
                <span className="report-topic">
                  {item.topic}
                  <span className="report-event">{item.event}</span>
                </span>
                {results[i] !== true && (
                  <Link href={`/competitions/${item.slug}`} className="sheet-link report-study">
                    Study this
                  </Link>
                )}
                <span className="sr-only">{results[i] === true ? "correct" : "missed"}</span>
              </li>
            ))}
          </ol>

          <div className="sheet-foot report-foot">
            <Link
              href={
                signedIn
                  ? `/app/coach${missed.length ? `?slug=${missed[0].slug}` : ""}`
                  : `/auth?mode=signup&next=${encodeURIComponent(missed.length ? `/app/coach?slug=${missed[0].slug}` : "/app/coach")}`
              }
              className="btn btn-accent report-cta"
            >
              {missed.length ? "Drill what you missed" : "Take a full-length test"}{" "}
              <span aria-hidden="true">→</span>
            </Link>
            <button type="button" className="sheet-next" onClick={restart}>
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sheet-stack">
    <div
      className={`sheet${turn === "out" ? " turn-out" : turn === "in" ? " turn-in" : ""}`}
      aria-label="Sample practice question"
    >
      {tally.done > 0 && <PenScore right={tally.right} done={tally.done} />}
      <div className="sheet-head">
        <span className="sheet-meta">
          Question {qi + 1} <span className="sheet-of">of {QUESTIONS.length}</span>
        </span>
        <span className="sheet-event">{q.event}</span>
      </div>

      <p className="sheet-q">{q.prompt}</p>

      <div className="sheet-opts" role="group" aria-label="Answer choices">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correct;
          const isPicked = i === picked;
          const state = !answered ? "" : isCorrect ? " is-correct" : isPicked ? " is-wrong" : " is-dim";
          return (
            <button
              key={`${qi}-${i}`}
              ref={i === 0 ? firstOptRef : undefined}
              type="button"
              className={`opt${state}`}
              aria-pressed={isPicked}
              disabled={answered}
              onClick={() => pick(i)}
            >
              <span className="bubble">
                {LETTERS[i]}
                {answered && isCorrect && <PenCircle />}
                {answered && isPicked && !isCorrect && <PenCross />}
              </span>
              <span className="opt-text">{opt}</span>
              {answered && isCorrect && <PenCheck />}
            </button>
          );
        })}
      </div>

      {/* Announces the result; visually the grading marks carry it. */}
      <p ref={liveRef} className="sr-only" aria-live="polite">
        {answered ? (gotIt ? "Correct." : `Not quite. The answer is ${LETTERS[q.correct]}.`) : ""}
      </p>

      <div className={`sheet-why${answered ? " is-open" : ""}`} aria-hidden={!answered}>
        <div className="why-inner">
          <span className="why-mark">{gotIt ? "Right." : "Here's why."}</span> {q.why}
        </div>
      </div>

      <div className="sheet-foot">
        <span className="sheet-hint">
          {answered ? (
            <Link href={`/competitions/${q.slug}`} className="sheet-link">
              {q.event} prep page
            </Link>
          ) : (
            "Pick an answer. It gets graded like the real thing."
          )}
        </span>
        <button type="button" className="sheet-next" onClick={next}>
          {isLast ? (answered ? "See your score" : "Skip and finish") : answered ? "Next question" : "Skip"}{" "}
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="sheet-dots" aria-hidden="true">
        {QUESTIONS.map((_, i) => (
          <span key={i} className={i === qi ? "on" : ""} />
        ))}
      </div>
    </div>
    </div>
  );
}
