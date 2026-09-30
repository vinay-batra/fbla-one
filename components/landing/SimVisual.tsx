"use client";

import { useEffect, useState } from "react";

/**
 * The full simulation, as a live miniature: a 50:00 clock that counts down
 * while its slide is showing, and the 100-bubble answer grid filling in.
 */
const TOTAL = 50 * 60;
const START = TOTAL - 17 * 60 - 42; // a few questions in

function clock(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function SimVisual({ active }: { active?: boolean }) {
  const [left, setLeft] = useState(START);

  useEffect(() => {
    if (!active) return;
    if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setLeft((l) => (l > 1 ? l - 1 : START)), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  // One more bubble fills roughly every 25 seconds of the demo clock.
  const answered = Math.min(100, 37 + Math.floor((START - left) / 25));

  return (
    <div className="sheet-stack">
      <div className="sheet sim-sheet" aria-label="Example full simulation">
        <div className="sheet-head">
          <span className="sheet-meta">Full simulation</span>
          <span className="sheet-event">Business Law</span>
        </div>
        <div className="sim-top">
          <span className="sim-clock" aria-hidden="true">
            {clock(left)}
          </span>
          <span className="sim-meta">
            <strong>{answered}</strong> of 100 answered
            <br />
            Turns itself in at 0:00
          </span>
        </div>
        <div className="sim-grid" aria-hidden="true">
          {Array.from({ length: 100 }, (_, i) => (
            <span key={i} className={i < answered ? "is-on" : i === answered ? "is-now" : ""} />
          ))}
        </div>
      </div>
    </div>
  );
}
