"use client";

import { useEffect, useState } from "react";
import "./judgeflow.css";

/**
 * The AI Judge, played out in three steps like a real round: draw a card, the
 * prep clock runs while you plan, then the rating sheet comes back scored.
 * Auto-advances while its slide is showing; the step buttons jump directly.
 *
 * This is a written example (labeled on the page), built on the rows the Judge
 * really scores for a role play: two of the event's topic areas plus the three
 * rows every role play carries. Scores add up: 36 of 50 is 72 out of 100.
 */
const STEPS = ["Draw a card", "Prepare", "Get scored"] as const;

const ROWS = [
  { name: "Promotion", score: 8, note: "A loyalty card and a free-coffee flyer at school fit a student crowd." },
  { name: "Market planning", score: 6, note: "You never said how the $2,000 is split, so the owner can't tell if it fits." },
  { name: "Defines the problem", score: 7, note: "Named the drive-through as the reason regulars left. Good." },
  { name: "Clear solution and next steps", score: 7, note: "Three clear steps, but no date for when each one starts." },
  { name: "Communication", score: 8, note: "Confident and direct. You finished 90 seconds early: use them." },
];

const NOTES = ["Why they left: the drive-through is faster", "Loyalty card: 10th coffee free", "Flyers at school, $300", "How will we know? Count morning sales"];

function mmss(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function JudgeFlow({ active }: { active?: boolean }) {
  const [step, setStep] = useState(0);
  const [prep, setPrep] = useState(20 * 60);
  const [paused, setPaused] = useState(false);

  const reduced =
    typeof window !== "undefined" &&
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Walk through the round on its own while the slide is showing.
  useEffect(() => {
    if (!active || paused || reduced) return;
    const id = window.setTimeout(() => setStep((s) => (s + 1) % STEPS.length), step === 2 ? 6500 : 4200);
    return () => window.clearTimeout(id);
  }, [active, paused, reduced, step]);

  // The prep clock runs (fast) during the prepare step.
  useEffect(() => {
    if (step !== 1) {
      setPrep(20 * 60);
      return;
    }
    if (reduced) return;
    const id = window.setInterval(() => setPrep((p) => Math.max(0, p - 7)), 100);
    return () => window.clearInterval(id);
  }, [step, reduced]);

  const choose = (i: number) => {
    setPaused(true);
    setStep(i);
  };

  return (
    <div className="jf">
      <div className="jf-steps" role="group" aria-label="A judged round, step by step">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`jf-step${i === step ? " is-on" : ""}${i < step ? " is-done" : ""}`}
            aria-pressed={i === step}
            onClick={() => choose(i)}
          >
            <span className="jf-step-n">{i + 1}</span>
            {label}
          </button>
        ))}
      </div>

      <div className="jf-stage">
        {/* 1. The card */}
        <article className={`jf-panel jf-card${step === 0 ? " is-on" : ""}`} aria-hidden={step !== 0}>
          <div className="jf-card-top">
            <span>Marketing</span>
            <span>Role play card</span>
          </div>
          <h4 className="jf-title">Win back the morning regulars</h4>
          <p className="jf-text">
            Brewed Awakening, a coffee shop near your school, lost about 30% of its weekday morning
            customers after a chain with a drive-through opened across the street. The owner has{" "}
            <strong>$2,000</strong> to spend over the next 60 days.
          </p>
          <div className="jf-roles">
            <p>
              <span className="jf-label">You are</span> a marketing consultant the owner hired.
            </p>
            <p>
              <span className="jf-label">The judges play</span> the owner, who wants regulars back
              without cutting prices.
            </p>
          </div>
          <ol className="jf-tasks">
            <li>Explain why customers left.</li>
            <li>Recommend a plan that fits the $2,000.</li>
            <li>Show how you will know it worked.</li>
          </ol>
          <p className="jf-clock-line">20 minutes to prepare · 7 minutes with the judges</p>
        </article>

        {/* 2. Prep */}
        <div className={`jf-panel jf-prep${step === 1 ? " is-on" : ""}`} aria-hidden={step !== 1}>
          <p className="jf-label">Prep time</p>
          <p className="jf-big-clock" aria-hidden="true">
            {mmss(prep)}
          </p>
          <div className="jf-notecard">
            {NOTES.map((n, i) => (
              <p key={n} style={{ animationDelay: `${0.4 + i * 0.7}s` }}>
                {n}
              </p>
            ))}
          </div>
          <p className="jf-prep-after">Then 7 minutes to present. Type it or say it out loud.</p>
        </div>

        {/* 3. The rating sheet */}
        <article className={`jf-panel jf-sheet${step === 2 ? " is-on" : ""}`} aria-hidden={step !== 2}>
          <div className="jf-sheet-top">
            <span>Rating sheet</span>
            <span className="jf-total">
              72
              <svg className="pen report-circle jf-circle" viewBox="0 0 120 80" aria-hidden="true">
                <path d="M18 30C28 10 70 4 94 14c18 8 22 30 8 46-16 16-56 18-76 6C6 56 6 38 20 24c8-8 22-12 34-12" />
              </svg>
            </span>
          </div>
          <ul className="jf-rows">
            {ROWS.map((r, i) => (
              <li key={r.name} style={{ animationDelay: `${0.2 + i * 0.35}s` }}>
                <span className="jf-score">{r.score}</span>
                <div>
                  <p className="jf-row-name">
                    {r.name} <span>/ 10</span>
                  </p>
                  <p className="jf-note">{r.note}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="jf-finalist">
            <strong>To reach the finals:</strong> put a number on every idea. What it costs, and how
            many customers it wins back.
          </p>
        </article>
      </div>

      <p className="jf-caption">An example round. Every card you draw is new, and your score comes from your own answer.</p>
    </div>
  );
}
