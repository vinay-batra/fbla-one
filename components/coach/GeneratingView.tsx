"use client";

import type { BuildProgress } from "./engine";

type Props = {
  eventName: string;
  kind: "practice" | "drill" | "simulation";
  drillTopic: string | null;
  progress: BuildProgress;
  /** Questions from the mistake bank already placed on the paper. */
  fromBank: number;
  /** Total the student chose (bank + new). */
  total: number;
  /** Simulation only: the paper is still being written. */
  building: boolean;
  /** Simulation only: enough questions to start now. */
  canStart: boolean;
  onStart?: () => void;
  onCancel: () => void;
};

/**
 * The honest progress screen: two steps, writing and then checking each
 * answer with a second model, with real counts for both.
 */
export function GeneratingView({ eventName, kind, drillTopic, progress, fromBank, total, building, canStart, onStart, onCancel }: Props) {
  const { target, written, checked, kept, dropped, checker } = progress;
  const ready = kept + fromBank;
  const pct = total > 0 ? Math.min(100, Math.round((ready / total) * 100)) : 0;
  const writingDone = written >= target || kept >= target || !building;
  const checkerOff = checker === "off";

  // Coarse, so a screen reader hears progress without a count every second.
  const step = kind === "simulation" ? 10 : 5;
  const spoken = `${Math.floor(ready / step) * step} of ${total} questions ready`;

  const title =
    kind === "simulation" ? "Writing your full-length paper" : kind === "drill" ? "Building your drill" : "Building your practice test";

  return (
    <section className="sheet coach-gen" aria-labelledby="coach-gen-title">
      <div className="sheet-head">
        <span className="sheet-meta">{kind === "simulation" ? "Full simulation" : "Practice test"}</span>
        <span className="sheet-event">{eventName}</span>
      </div>

      <h2 id="coach-gen-title" className="coach-gen-title">{title}</h2>
      <p className="coach-gen-sub">
        {total} questions
        {drillTopic ? <>, all on <strong>{drillTopic}</strong></> : null}
        {fromBank > 0 ? <>, including {fromBank} from your mistakes</> : null}
      </p>

      <ol className="coach-gen-steps">
        <li className={writingDone ? "is-done" : "is-active"}>
          <span className="coach-gen-step-name">Writing questions</span>
          <span className="coach-gen-step-count">{written} written</span>
        </li>
        <li className={checkerOff ? "is-off" : written > 0 ? "is-active" : ""}>
          <span className="coach-gen-step-name">Checking each answer with a second model</span>
          <span className="coach-gen-step-count">
            {checkerOff ? "unavailable" : `${checked} checked, ${kept} kept`}
          </span>
        </li>
      </ol>

      {checkerOff ? (
        <p className="coach-gen-note">
          The second-model check is not answering right now, so the rest of this test has the calculator check only.
        </p>
      ) : dropped > 0 ? (
        <p className="coach-gen-note">
          {dropped} {dropped === 1 ? "question was" : "questions were"} set aside because the second model could not confirm the answer.{" "}
          {ready >= total ? "Each one was replaced." : "Replacements are being written."}
        </p>
      ) : null}

      <div className="coach-gen-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={ready} aria-label="Questions ready">
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="coach-gen-count">
        <strong>{ready}</strong> of {total} ready
      </p>
      <p className="sr-only" role="status" aria-live="polite">
        {spoken}
      </p>

      {kind === "simulation" && ready < total && (
        <p className="coach-gen-note">
          A full paper usually takes one to two minutes to write and check. You can start once the first 25 are ready; the
          rest keep arriving while you work.
        </p>
      )}

      <div className="sheet-foot coach-gen-foot">
        <button type="button" className="btn btn-ghost btn-sm btn-pill" onClick={onCancel}>
          Cancel
        </button>
        {kind === "simulation" && canStart && onStart && (
          <button type="button" className="btn btn-accent btn-pill" onClick={onStart}>
            {building ? `Start now with ${ready} ready` : "Start the 50:00 clock"}
          </button>
        )}
      </div>
    </section>
  );
}
