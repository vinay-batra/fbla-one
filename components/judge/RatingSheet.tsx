"use client";

import type { CSSProperties, Ref } from "react";
import type { Competition } from "@/lib/competitions";
import { PenCheck, PenCross } from "@/components/PenMarks";
import { levelFor } from "./rubric";
import type { JudgeResult } from "./types";

type Props = {
  result: JudgeResult;
  comp: Competition;
  /** Focus target once the sheet appears, so keyboard and screen reader users land on the score. */
  headingRef?: Ref<HTMLHeadingElement>;
};

/**
 * A loose red-pen loop around the total. PenCircle's loop is drawn for a
 * single letter; this one is wider so it rings a two or three digit score.
 */
export function TotalCircle() {
  return (
    <svg className="pen judge-total-circle" viewBox="0 0 120 80" preserveAspectRatio="none" aria-hidden="true">
      <path d="M14 38C16 16 48 6 76 8c26 2 40 16 38 32-2 20-30 32-60 31C26 70 8 58 10 40c1-10 10-18 22-23" />
    </svg>
  );
}

/**
 * The judge's feedback as a rating sheet marked up in red pen: a score
 * written in the margin beside each criterion, handwritten notes under it,
 * and the total circled at the top.
 */
export function RatingSheet({ result, comp, headingRef }: Props) {
  const points = result.criteria.reduce((s, c) => s + c.score, 0);
  const max = result.criteria.length * 10;
  const kind = result.mode === "role-play" ? "Role play" : comp.format === "interview" ? "Interview" : "Presentation";

  return (
    <section className="judge-sheet" aria-labelledby="judge-sheet-title">
      <header className="judge-sheet-head">
        <span>
          <span className="judge-sheet-event">{comp.name}</span>
          {kind} rating sheet
        </span>
        <span>Practice round</span>
      </header>

      <div className="judge-total">
        <p className="judge-total-mark" aria-hidden="true">
          <span>{result.total}</span>
          <TotalCircle />
        </p>
        <div className="judge-total-copy">
          <h2 id="judge-sheet-title" ref={headingRef} tabIndex={-1} className="judge-total-title">
            <span className="sr-only">Overall score: </span>
            {result.total}
            <span className="judge-total-of"> out of 100</span>
          </h2>
          {result.verdict && <p className="judge-verdict">{result.verdict}</p>}
        </div>
      </div>

      <ol className="judge-rows">
        {result.criteria.map((c, i) => (
          <li key={c.name} className="judge-row" style={{ "--i": i } as CSSProperties}>
            <span className="judge-row-score" aria-hidden="true">
              {c.score}
            </span>
            <div className="judge-row-body">
              <p className="judge-row-name">
                {c.name}
                <span className="sr-only">: {c.score} out of 10.</span>
              </p>
              <p className="judge-row-level">
                {levelFor(c.score)} <span aria-hidden="true">&middot; {c.score}/10</span>
              </p>
              {c.note && <p className="judge-note">{c.note}</p>}
            </div>
          </li>
        ))}
      </ol>
      <p className="judge-sum">
        {points} of {max} points, scaled to {result.total} out of 100
      </p>

      {result.strengths.length > 0 && (
        <div className="judge-block">
          <h3 className="judge-block-title">What earned points</h3>
          <ul className="judge-marks">
            {result.strengths.map((s) => (
              <li key={s.quote}>
                <span className="report-mark">
                  <PenCheck />
                </span>
                <div>
                  <p className={s.verbatim ? "judge-quote" : "judge-quote judge-paraphrase"}>
                    {s.verbatim ? <>&ldquo;{s.quote}&rdquo;</> : s.quote}
                  </p>
                  <p className="judge-why">{s.why}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="judge-block">
        <h3 className="judge-block-title">Fix before your next round</h3>
        <ul className="judge-marks">
          {result.fixes.map((f) => (
            <li key={f.issue}>
              <span className="report-mark">
                <PenCross />
              </span>
              <div>
                <p className="judge-fix-issue">{f.issue}</p>
                <p className="judge-why">{f.fix}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="judge-finalist">
        <p className="judge-finalist-label">The finalist difference</p>
        <p className="judge-finalist-text">{result.finalist}</p>
      </div>
    </section>
  );
}
