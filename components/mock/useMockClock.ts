"use client";

import { useEffect, useState } from "react";
import { getServerOffset } from "@/lib/mock";

/**
 * A ticking clock aligned to the database clock, so every student's countdown
 * and the projector agree with ends_at (a laptop that is two minutes fast would
 * otherwise auto-submit early). `synced` turns true once the offset is known.
 */
export function useMockClock(tickMs = 500): { now: number; synced: boolean } {
  const [offset, setOffset] = useState(0);
  const [synced, setSynced] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    getServerOffset().then((o) => {
      if (!alive) return;
      setOffset(o);
      setSynced(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(id);
  }, [tickMs]);

  return { now: now + offset, synced };
}
