"use client";

import { useState } from "react";
import { RotatingWord } from "@/components/landing/RotatingWord";

/**
 * The sign-in page's left side: "Walk into regionals / states / nationals",
 * the landing hero's rotating word on its own clock exactly as on the landing,
 * and a graded sample question with an arrow to flip through three of them.
 *
 * Every answer is worked out in the "Why" line, so the samples are checkable:
 *   regionals  (50,000 - 5,000) / 5 = 9,000
 *   states     2,000 x 0.06 x 3 = 360 (compounding instead gives about 382)
 *   nationals  quantity -30% vs price +25%, so demand is elastic
 */
const LEVELS = ["regionals", "states", "nationals"];

const SAMPLES = [
  {
    meta: "Question 3 of 5",
    event: "Accounting",
    q: "A $50,000 truck has a $5,000 salvage value and a 5-year life. Yearly straight-line depreciation?",
    opts: ["$10,000", "$9,000", "$11,000", "$45,000"],
    right: 1,
    why: "subtract salvage first. $45,000 ÷ 5 = $9,000.",
  },
  {
    meta: "Question 12 of 25",
    event: "Personal Finance",
    q: "You save $2,000 at 6% simple interest for 3 years. How much interest do you earn?",
    opts: ["$120", "$2,360", "$360", "$382"],
    right: 2,
    why: "simple interest is principal × rate × time. $2,000 × 0.06 × 3 = $360.",
  },
  {
    meta: "Question 47 of 100",
    event: "Economics",
    q: "A price rises from $4 to $5 and quantity demanded falls from 100 to 70. Demand here is:",
    opts: ["Elastic", "Inelastic", "Unit elastic", "Perfectly inelastic"],
    right: 0,
    why: "quantity fell 30% while price rose 25%, so buyers reacted more than the price moved.",
  },
];

export function AuthSide() {
  // The sample flips only when the arrow is pressed. Same turn shape as the
  // rotating word: the current sheet slides up and out, the next rises in.
  const [{ i, prev }, setTurn] = useState<{ i: number; prev: number | null }>({ i: 0, prev: null });
  const next = () => setTurn((t) => ({ i: (t.i + 1) % SAMPLES.length, prev: t.i }));

  return (
    <aside className="au-side" aria-label="Sample questions">
      <p className="au-side-title">
        Walk into <RotatingWord words={LEVELS} /> <em>already knowing the test.</em>
      </p>
      <div className="au-sample">
      <div className="au-stack">
        <div className="au-sheet-back" />
        {/* All three sheets share one grid cell, so the stack is always as
            tall as the longest question and nothing around it moves. They
            crossfade with CSS transitions (never remount), and the pen marks
            draw in once the new sheet has risen. */}
        <div className="au-sheets">
          {SAMPLES.map((s, n) => (
            <div
              className={`au-sheet${n === i ? " is-in" : ""}${n === prev ? " is-out" : ""}`}
              key={n}
              aria-hidden={n !== i}
            >
              <div className="au-sheet-meta">
                <span>{s.meta}</span>
                <b>{s.event}</b>
              </div>
              <p className="au-sheet-q">{s.q}</p>
              <ul className="au-sheet-opts">
                {s.opts.map((o, k) => (
                  <li key={o} className={k === s.right ? "is-right" : undefined}>
                    {k === s.right && (
                      <svg className="au-pen au-pen-circle" viewBox="0 0 52 46" aria-hidden="true">
                        <path pathLength={1} d="M8 17C12 6 28 2 38 6c9 4 12 14 8 23-5 11-22 14-32 9C5 34 3 25 8 17c3-5 9-8 15-9" />
                      </svg>
                    )}
                    <span className="bub">{"ABCD"[k]}</span>
                    {o}
                    {k === s.right && (
                      <svg className="au-pen au-pen-check" viewBox="0 0 30 24" aria-hidden="true">
                        <path pathLength={1} d="M3 13c3 2 6 5 8 8 4-8 9-14 16-18" />
                      </svg>
                    )}
                  </li>
                ))}
              </ul>
              <p className="au-sheet-why"><b>Why:</b> {s.why}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="au-flip">
        <button type="button" className="au-next" onClick={next} aria-label="Show another sample question">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
        <span className="au-flip-count" aria-live="polite">{i + 1} of {SAMPLES.length}</span>
      </div>
      </div>
    </aside>
  );
}
