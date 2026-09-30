"use client";

import { useEffect, useState } from "react";
import { formatClock } from "./rubric";

/**
 * Seconds left until `endAt` (a Date.now() timestamp), negative once past it.
 * Deadline-based rather than a decrementing counter, so a throttled background
 * tab never drifts from real time.
 */
export function useCountdown(endAt: number | null): number {
  // The interval only forces a re-render; the clock is read during render, so
  // the first frame after a timer starts can never show a stale time.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (endAt === null) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 250);
    return () => window.clearInterval(id);
  }, [endAt]);
  if (endAt === null) return 0;
  return (endAt - Date.now()) / 1000;
}

type Props = {
  /** Small label above the clock, e.g. "Prep time". */
  label: string;
  totalSec: number;
  /** Seconds left; negative means overtime. */
  remainingSec: number;
  /** Shown under the clock. */
  caption?: string;
};

function spokenClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  const parts = [];
  if (m) parts.push(`${m} minute${m === 1 ? "" : "s"}`);
  if (r || !m) parts.push(`${r} second${r === 1 ? "" : "s"}`);
  return parts.join(" ");
}

export function Timer({ label, totalSec, remainingSec, caption }: Props) {
  // Ceil so the clock reads 7:00 at the start and 0:00 exactly at time.
  const left = Math.ceil(remainingSec);
  const over = left < 0;
  const low = !over && left <= 60;
  const used = totalSec > 0 ? Math.min(1, Math.max(0, 1 - remainingSec / totalSec)) : 1;

  return (
    <div className={`judge-timer${low ? " judge-timer-low" : ""}${over ? " judge-timer-over" : ""}`}>
      <p className="judge-timer-label">{over ? `${label}: over time` : label}</p>
      <p
        className="judge-timer-clock"
        role="timer"
        aria-label={over ? `${label}: ${spokenClock(-left)} over time` : `${label}: ${spokenClock(left)} left`}
      >
        {over && <span className="judge-timer-sign" aria-hidden="true">+</span>}
        <span aria-hidden="true">{formatClock(Math.abs(left))}</span>
      </p>
      <div className="judge-timer-track" aria-hidden="true">
        <span className="judge-timer-fill" style={{ transform: `scaleX(${used})` }} />
      </div>
      {caption && <p className="judge-timer-caption">{caption}</p>}
    </div>
  );
}
