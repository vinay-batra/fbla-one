"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSession, listParticipants, type MockParticipant, type MockSession } from "@/lib/mock";

/**
 * Polls a session row (and optionally its participants). The project does not
 * use Supabase Realtime, so the projector polls every 2 seconds and students a
 * little slower. Polling pauses while the tab is hidden, except on the
 * projector, which must keep updating even when another window has focus.
 */
export function useMockSession(
  sessionId: string,
  opts: { intervalMs: number; withParticipants: boolean; keepWhenHidden?: boolean }
) {
  const { intervalMs, withParticipants, keepWhenHidden = false } = opts;
  const [session, setSession] = useState<MockSession | null>(null);
  const [participants, setParticipants] = useState<MockParticipant[]>([]);
  const [loaded, setLoaded] = useState(false);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const [s, p] = await Promise.all([
        getSession(sessionId),
        withParticipants ? listParticipants(sessionId) : Promise.resolve(null),
      ]);
      setSession(s);
      if (p) setParticipants(p);
    } finally {
      busy.current = false;
      setLoaded(true);
    }
  }, [sessionId, withParticipants]);

  useEffect(() => {
    refresh();
    const id = window.setInterval(() => {
      if (!keepWhenHidden && typeof document !== "undefined" && document.hidden) return;
      refresh();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [refresh, intervalMs, keepWhenHidden]);

  return { session, participants, loaded, refresh };
}
