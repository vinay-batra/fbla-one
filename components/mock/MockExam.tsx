"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  OPTION_KEYS,
  formatCountdown,
  saveDraft,
  submitAnswers,
  type AnswerMap,
  type Option,
  type PaperQuestion,
} from "@/lib/mock";

const DRAFT_KEY = (id: string) => `fbla_mock_draft_${id}`;

function readLocalDraft(sessionId: string): AnswerMap {
  try {
    const raw = localStorage.getItem(DRAFT_KEY(sessionId));
    return raw ? (JSON.parse(raw) as AnswerMap) : {};
  } catch {
    return {};
  }
}

/**
 * The student's paper during a live session: one question at a time on the
 * exam sheet, a grid to jump around, a countdown to the shared ends_at, draft
 * autosave (localStorage + the participant row) and auto-submit at zero. The
 * paper carries no answer key; grading happens server-side in mock_submit.
 */
export function MockExam({
  sessionId,
  userId,
  eventName,
  questions,
  initialAnswers,
  endsAt,
  now,
  clockSynced,
  onTurnedIn,
}: {
  sessionId: string;
  userId: string;
  eventName: string;
  questions: PaperQuestion[];
  initialAnswers: AnswerMap;
  endsAt: number;
  now: number;
  clockSynced: boolean;
  onTurnedIn: (note: string) => void;
}) {
  const [answers, setAnswers] = useState<AnswerMap>(() => ({ ...initialAnswers, ...readLocalDraft(sessionId) }));
  const [idx, setIdx] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const saveTimer = useRef<number | null>(null);
  const firedAuto = useRef(false);
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const remaining = endsAt - now;
  const answered = Object.keys(answers).length;
  const blanks = questions.length - answered;
  const q = questions[idx];

  const choose = useCallback(
    (opt: Option) => {
      if (submitting) return;
      setConfirming(false);
      setAnswers((prev) => {
        const next = { ...prev, [String(idx)]: opt };
        try {
          localStorage.setItem(DRAFT_KEY(sessionId), JSON.stringify(next));
        } catch {}
        if (saveTimer.current) window.clearTimeout(saveTimer.current);
        saveTimer.current = window.setTimeout(() => saveDraft(sessionId, userId, next), 1200);
        return next;
      });
    },
    [idx, sessionId, userId, submitting]
  );

  const turnIn = useCallback(
    async (auto: boolean) => {
      if (submitting) return;
      setSubmitting(true);
      setError("");
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      const res = await submitAnswers(sessionId, answersRef.current);
      if ("error" in res) {
        if (auto || /not accepting/i.test(res.error)) {
          // Time was called first. The advisor's board grades the autosaved draft.
          try {
            localStorage.removeItem(DRAFT_KEY(sessionId));
          } catch {}
          onTurnedIn("Time was called. Your saved answers were turned in for you.");
          return;
        }
        if (/already submitted/i.test(res.error)) {
          onTurnedIn("Your paper is already turned in.");
          return;
        }
        setError(res.error);
        setSubmitting(false);
        return;
      }
      try {
        localStorage.removeItem(DRAFT_KEY(sessionId));
      } catch {}
      onTurnedIn(auto ? "Time. Your paper was turned in automatically." : "Turned in. Pencils down.");
    },
    [sessionId, submitting, onTurnedIn]
  );

  // Pencils down at zero (only once the clock is aligned to the server, so a
  // laptop set fast cannot turn a paper in early).
  useEffect(() => {
    if (clockSynced && remaining <= 0 && !firedAuto.current) {
      firedAuto.current = true;
      turnIn(true);
    }
  }, [clockSynced, remaining, turnIn]);

  // Keyboard: A-D to answer, arrows to move (ignored while typing elsewhere).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
      const k = e.key.toUpperCase();
      if ((OPTION_KEYS as string[]).includes(k)) choose(k as Option);
      else if (e.key === "ArrowRight") setIdx((i) => Math.min(i + 1, questions.length - 1));
      else if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose, questions.length]);

  useEffect(() => () => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
  }, []);

  if (!q) return null;
  const picked = answers[String(idx)];
  const low = remaining <= 60_000;

  return (
    <div className="mock-exam">
      <div className="mock-exam-bar">
        <div>
          <p className="mock-exam-event">{eventName}</p>
          <p className="mock-muted">
            {answered} of {questions.length} answered
          </p>
        </div>
        <p className={`mock-clock${low ? " is-low" : ""}`} role="timer" aria-label={`Time remaining ${formatCountdown(remaining)}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2 2M9 2h6" />
          </svg>
          {formatCountdown(remaining)}
        </p>
      </div>

      <div className="mock-grid" role="group" aria-label="Jump to a question">
        {questions.map((_, i) => {
          const done = answers[String(i)] !== undefined;
          return (
            <button
              key={i}
              type="button"
              className={`mock-grid-cell${done ? " is-answered" : ""}${i === idx ? " is-current" : ""}`}
              aria-current={i === idx ? "step" : undefined}
              aria-label={`Question ${i + 1}${done ? ", answered" : ", blank"}`}
              onClick={() => setIdx(i)}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="sheet-stack">
        <div key={idx} className="sheet turn-in mock-exam-sheet">
          <div className="sheet-head">
            <span className="sheet-meta">
              Question {idx + 1} <span className="sheet-of">of {questions.length}</span>
            </span>
            <span className="sheet-event">Mock Regionals</span>
          </div>
          <p className="sheet-q">{q.question}</p>
          <div className="sheet-opts" role="group" aria-label="Answer choices">
            {OPTION_KEYS.map((opt) => (
              <button
                key={opt}
                type="button"
                className="opt"
                aria-pressed={picked === opt}
                disabled={submitting}
                onClick={() => choose(opt)}
              >
                <span className="bubble">{opt}</span>
                <span className="opt-text">{q.options[opt]}</span>
                <span />
              </button>
            ))}
          </div>
          <div className="sheet-foot">
            <button
              type="button"
              className="sheet-next"
              disabled={idx === 0}
              onClick={() => setIdx((i) => Math.max(i - 1, 0))}
            >
              <span aria-hidden="true">&larr;</span> Previous
            </button>
            {idx < questions.length - 1 ? (
              <button type="button" className="sheet-next" onClick={() => setIdx((i) => i + 1)}>
                Next <span aria-hidden="true">&rarr;</span>
              </button>
            ) : (
              <span className="sheet-hint">Last question</span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="mock-alert">
          {error}
        </p>
      )}

      <div className="mock-turnin">
        <p className="mock-muted">
          {blanks > 0
            ? `${blanks} ${blanks === 1 ? "question is" : "questions are"} still blank. A blank counts as wrong.`
            : "Every question has an answer. Check your work, then turn it in."}
        </p>
        <button
          type="button"
          className="btn btn-accent btn-lg"
          disabled={submitting}
          onClick={() => {
            if (blanks > 0 && !confirming) {
              setConfirming(true);
              return;
            }
            turnIn(false);
          }}
        >
          {submitting ? "Turning in..." : confirming ? `Turn in with ${blanks} blank` : "Turn in my paper"}
        </button>
      </div>
    </div>
  );
}
