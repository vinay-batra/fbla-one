"use client";

import { useState, type CSSProperties, type Ref } from "react";
import { ResponseInput } from "./ResponseInput";
import { TotalCircle } from "./RatingSheet";
import { MAX_ANSWER_CHARS, type FollowUpResult } from "./types";

type Props = {
  questions: string[];
  /** Official Q&A minutes, when the event states them. */
  qaMin: number | null;
  /** True for events that run with no judges' questions. */
  noQA: boolean;
  busy: boolean;
  error: string;
  result: FollowUpResult | null;
  onScore: (answers: string[]) => void;
  resultHeadingRef?: Ref<HTMLHeadingElement>;
};

export function FollowUpRound({ questions, qaMin, noQA, busy, error, result, onScore, resultHeadingRef }: Props) {
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ""));
  const answered = answers.filter((a) => a.trim()).length;
  const locked = busy || result !== null;

  const intro = noQA
    ? "This event has no Q&A at the conference, but a judge would be thinking these. Answering them tests how deep your preparation goes."
    : `Answer each one the way you would out loud: lead with the answer, then one piece of support.${
        qaMin ? ` The real Q&A is ${qaMin} minutes for everything, so keep each answer short.` : ""
      }`;

  return (
    <section className="judge-qa" aria-labelledby="judge-qa-title">
      <p className="eyebrow">Round two</p>
      <h2 id="judge-qa-title" className="judge-qa-title">
        The judges have questions.
      </h2>
      <p className="judge-lede">{intro}</p>

      <ol className="judge-qa-list">
        {questions.map((q, i) => (
          <li key={q} className="judge-qa-item">
            <p className="judge-qa-q">
              <span className="judge-qa-num" aria-hidden="true">
                Q{i + 1}
              </span>
              {q}
            </p>
            <ResponseInput
              id={`judge-answer-${i}`}
              label={`Your answer to question ${i + 1}`}
              value={answers[i] ?? ""}
              onChange={(next) => setAnswers((prev) => prev.map((a, j) => (j === i ? next : a)))}
              rows={4}
              maxLength={MAX_ANSWER_CHARS}
              disabled={locked}
            />
          </li>
        ))}
      </ol>

      {error && (
        <p className="judge-error" role="alert">
          {error}
        </p>
      )}

      {!result && (
        <div className="judge-actions">
          <button
            type="button"
            className={`btn btn-accent btn-lg${busy ? " btn-loading" : ""}`}
            disabled={busy || answered === 0}
            onClick={() => onScore(answers)}
          >
            <span className="btn-text">{busy ? "Judging your answers" : "Score my answers"}</span>
          </button>
          <p className="judge-actions-note">
            {answered} of {questions.length} answered. Blank answers score zero.
          </p>
        </div>
      )}

      {result && (
        <div className="judge-sheet judge-sheet-qa">
          <header className="judge-sheet-head">
            <span>Q&amp;A round</span>
            <span>Practice round</span>
          </header>
          <div className="judge-total judge-total-sm">
            <p className="judge-total-mark" aria-hidden="true">
              <span>{result.total}</span>
              <TotalCircle />
            </p>
            <div className="judge-total-copy">
              <h3 ref={resultHeadingRef} tabIndex={-1} className="judge-total-title">
                <span className="sr-only">Q and A score: </span>
                {result.total}
                <span className="judge-total-of"> out of 100</span>
              </h3>
              {result.summary && <p className="judge-verdict">{result.summary}</p>}
            </div>
          </div>
          <ol className="judge-rows">
            {result.answers.map((a, i) => (
              <li key={a.question} className="judge-row" style={{ "--i": i } as CSSProperties}>
                <span className="judge-row-score" aria-hidden="true">
                  {a.score}
                </span>
                <div className="judge-row-body">
                  <p className="judge-row-name">
                    Question {i + 1}
                    <span className="sr-only">: {a.score} out of 10.</span>
                  </p>
                  <p className="judge-row-level">{a.question}</p>
                  {a.note && <p className="judge-note">{a.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
