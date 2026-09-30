"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PenCheck, PenCircle, PenCross } from "@/components/PenMarks";
import {
  OPTION_KEYS,
  chapterAverage,
  getReview,
  ordinal,
  rankParticipants,
  type MockParticipant,
  type Review,
} from "@/lib/mock";

const VERDICT = (pct: number) =>
  pct >= 90 ? "That places at regionals." : pct >= 75 ? "Strong paper. A few points from the podium." : pct >= 60 ? "Solid base. The misses below are your study list." : "Now you know exactly what to study. Start with the misses.";

/**
 * After time is called: the student's graded paper (score circled in red pen,
 * rank, chapter average) and a review of every miss with the explanation.
 */
export function MockResults({
  sessionId,
  userId,
  eventSlug,
  eventName,
  total,
  participants,
}: {
  sessionId: string;
  userId: string;
  eventSlug: string;
  eventName: string;
  total: number;
  participants: MockParticipant[];
}) {
  const [review, setReview] = useState<Review | null | undefined>(undefined);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let alive = true;
    getReview(sessionId).then((r) => {
      if (alive) setReview(r);
    });
    return () => {
      alive = false;
    };
  }, [sessionId]);

  const ranked = useMemo(() => rankParticipants(participants), [participants]);
  const me = ranked.find((p) => p.user_id === userId);
  const avg = chapterAverage(participants, total);

  if (review === undefined) return <p className="mock-muted" role="status">Grading your paper...</p>;
  if (review === null) {
    return (
      <div className="card mock-note">
        <p>Results are not available yet. They open as soon as your advisor calls time.</p>
      </div>
    );
  }

  const score = review.myScore ?? me?.score ?? null;
  const pct = score != null && total ? Math.round((score / total) * 100) : null;
  const misses = review.questions
    .map((q, i) => ({ q, i, mine: review.myAnswers[String(i)] }))
    .filter((r) => showAll || r.mine !== r.q.correct);

  return (
    <div className="mock-results">
      <div className="sheet-stack">
        <div className="sheet mock-report">
          <div className="sheet-head">
            <span className="sheet-meta">Graded</span>
            <span className="sheet-event">{eventName}</span>
          </div>

          {score == null ? (
            <p className="report-verdict">You did not sit this paper, so there is no score. The chapter results are below.</p>
          ) : (
            <div className="report-score">
              <div className="report-big" aria-label={`${score} out of ${total}`}>
                <span>
                  {score}
                  <span className="report-slash">/</span>
                  {total}
                </span>
                <svg className="pen report-circle" viewBox="0 0 120 80" aria-hidden="true">
                  <path d="M18 30C28 10 70 4 94 14c18 8 22 30 8 46-16 16-56 18-76 6C6 56 6 38 20 24c8-8 22-12 34-12" />
                </svg>
              </div>
              <p className="report-verdict">{pct != null ? VERDICT(pct) : ""}</p>
            </div>
          )}

          <dl className="mock-report-stats">
            <div>
              <dt>Your place</dt>
              <dd>{me ? `${ordinal(me.rank)} of ${ranked.length}` : "Not ranked"}</dd>
            </div>
            <div>
              <dt>You</dt>
              <dd>{pct != null ? `${pct}%` : "N/A"}</dd>
            </div>
            <div>
              <dt>Chapter average</dt>
              <dd>{avg != null ? `${avg}%` : "N/A"}</dd>
            </div>
          </dl>

          {ranked.length > 0 && (
            <ol className="mock-report-top" aria-label="Top of the chapter">
              {ranked.slice(0, 3).map((p) => (
                <li key={p.id} className={p.user_id === userId ? "is-me" : undefined}>
                  <span className="mock-rest-place">{ordinal(p.rank)}</span>
                  <span className="mock-rest-name">{p.user_id === userId ? `${p.display_name} (you)` : p.display_name}</span>
                  <span className="mock-rest-score">{p.score}/{total}</span>
                </li>
              ))}
            </ol>
          )}

          <div className="sheet-foot mock-report-actions">
            <Link href={`/app/coach?slug=${eventSlug}`} className="btn btn-accent btn-sm">
              Practice {eventName}
            </Link>
            <Link href="/app/mock" className="sheet-next">
              Back to Mock Regionals
            </Link>
          </div>
        </div>
      </div>

      {score != null && (
        <section className="mock-review" aria-labelledby="mock-review-title">
          <div className="mock-review-head">
            <h2 id="mock-review-title" className="mock-review-title">
              {showAll ? "Every question" : `Your misses (${review.questions.length - (score ?? 0)})`}
            </h2>
            <div className="mock-toggle" role="group" aria-label="Which questions to show">
              <button type="button" aria-pressed={!showAll} onClick={() => setShowAll(false)}>
                Misses only
              </button>
              <button type="button" aria-pressed={showAll} onClick={() => setShowAll(true)}>
                All questions
              </button>
            </div>
          </div>

          {misses.length === 0 && <p className="mock-muted">A perfect paper. Nothing to review.</p>}

          {misses.map(({ q, i, mine }) => {
            const right = mine === q.correct;
            return (
              <article key={i} className="sheet mock-review-item">
                <div className="sheet-head">
                  <span className="sheet-meta">Question {i + 1}</span>
                  <span className={`mock-verdict${right ? "" : " is-wrong"}`}>
                    {right ? "Correct" : mine ? "Missed" : "Left blank"}
                  </span>
                </div>
                <p className="sheet-q mock-review-q">{q.question}</p>
                <div className="sheet-opts">
                  {OPTION_KEYS.map((opt) => {
                    const isRight = q.correct === opt;
                    const isMine = mine === opt;
                    const state = isRight ? " is-correct" : isMine ? " is-wrong" : " is-dim";
                    return (
                      <div key={opt} className={`opt${state}`}>
                        <span className="bubble">
                          {opt}
                          {isRight && <PenCircle />}
                          {isMine && !isRight && <PenCross />}
                        </span>
                        <span className="opt-text">
                          {q.options[opt]}
                          {isMine && <span className="sr-only"> (your answer)</span>}
                          {isRight && <span className="sr-only"> (correct answer)</span>}
                        </span>
                        {isRight ? <PenCheck /> : <span />}
                      </div>
                    );
                  })}
                </div>
                {q.explanation && (
                  <div className="sheet-why is-open">
                    <div className="why-inner">
                      <span className="why-mark">{right ? "Right." : "Here's why."}</span> {q.explanation}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
