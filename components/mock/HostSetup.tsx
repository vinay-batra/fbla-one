"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { COMPETITIONS, getCompetition, isAiTestable } from "@/lib/competitions";
import {
  QUESTION_COUNTS,
  TIME_LIMITS_MIN,
  createMockSession,
  generateMockQuestions,
} from "@/lib/mock";

const ELIGIBLE = COMPETITIONS.filter(isAiTestable).sort((a, b) => a.name.localeCompare(b.name));

// Roughly a minute per question, like the real objective tests.
const DEFAULT_MINUTES: Record<number, number> = { 10: 10, 20: 20, 30: 30 };

type Stage = "form" | "writing" | "saving";

/** Advisor setup: pick an event, a length and a time limit, then write the paper. */
export function HostSetup() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [count, setCount] = useState<number>(20);
  const [minutes, setMinutes] = useState<number>(20);
  const [minutesTouched, setMinutesTouched] = useState(false);
  const [stage, setStage] = useState<Stage>("form");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const comp = useMemo(() => (slug ? getCompetition(slug) : undefined), [slug]);

  function pickCount(n: number) {
    setCount(n);
    if (!minutesTouched) setMinutes(DEFAULT_MINUTES[n] ?? n);
  }

  async function build() {
    if (!slug) return;
    setError("");
    setProgress(0);
    setStage("writing");
    const abort = new AbortController();
    abortRef.current = abort;
    try {
      const questions = await generateMockQuestions(slug, count, setProgress, abort.signal);
      setStage("saving");
      const res = await createMockSession(slug, questions, minutes * 60);
      if ("error" in res) throw new Error(res.error);
      router.push(`/app/mock/${res.id}`);
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setStage("form");
        return;
      }
      setError((e as Error).message || "Something went wrong. Try again.");
      setStage("form");
    }
  }

  if (stage !== "form") {
    const pct = Math.min(100, Math.round((progress / count) * 100));
    return (
      <section className="sheet mock-setup" aria-live="polite">
        <div className="sheet-head">
          <span className="sheet-meta">Writing the paper</span>
          <span className="sheet-event">{comp?.name}</span>
        </div>
        <p className="mock-writing-title">
          {stage === "saving" ? "Printing the answer key..." : `Question ${Math.min(progress + 1, count)} of ${count}`}
        </p>
        <div className="mock-progress" role="progressbar" aria-valuemin={0} aria-valuemax={count} aria-valuenow={progress} aria-label="Questions written">
          <span style={{ width: `${pct}%` }} />
        </div>
        <p className="mock-muted">
          Every question is checked against the event outline, and every computed answer is re-worked on a calculator
          before it goes in the key. This takes about a minute.
        </p>
        {stage === "writing" && (
          <div className="sheet-foot">
            <span className="sheet-hint">Keep this tab open.</span>
            <button type="button" className="sheet-next" onClick={() => abortRef.current?.abort()}>
              Cancel
            </button>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="sheet mock-setup" aria-labelledby="mock-setup-title">
      <div className="sheet-head">
        <span className="sheet-meta">Host a session</span>
        <span className="sheet-event">Advisor</span>
      </div>
      <h2 id="mock-setup-title" className="mock-setup-title">Set the paper</h2>

      {error && (
        <p role="alert" className="mock-alert">
          {error}
        </p>
      )}

      <div className="mock-field">
        <label htmlFor="mock-event" className="mock-label">Event</label>
        <select id="mock-event" className="input-field" value={slug} onChange={(e) => setSlug(e.target.value)}>
          <option value="">Choose an objective-test event</option>
          {ELIGIBLE.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        {comp?.topics && (
          <p className="mock-muted mock-topics">
            Covers {comp.topics.slice(0, 4).join(", ")}
            {comp.topics.length > 4 ? `, and ${comp.topics.length - 4} more topics` : ""}.
          </p>
        )}
      </div>

      <fieldset className="mock-field">
        <legend className="mock-label">Questions</legend>
        <div className="mock-seg" role="radiogroup" aria-label="Number of questions">
          {QUESTION_COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={count === n}
              className="mock-seg-btn"
              onClick={() => pickCount(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mock-field">
        <legend className="mock-label">Time limit</legend>
        <div className="mock-seg" role="radiogroup" aria-label="Time limit in minutes">
          {TIME_LIMITS_MIN.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={minutes === m}
              className="mock-seg-btn"
              onClick={() => {
                setMinutes(m);
                setMinutesTouched(true);
              }}
            >
              {m} min
            </button>
          ))}
        </div>
      </fieldset>

      <div className="sheet-foot mock-setup-foot">
        <span className="sheet-hint">
          Members join with a code or a QR on the projector. The clock starts when you press Start.
        </span>
        <button type="button" className="btn btn-accent btn-lg" disabled={!slug} onClick={build}>
          Write the paper
        </button>
      </div>
    </section>
  );
}
