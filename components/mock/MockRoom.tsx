"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMockContext, getSession, type MockContext } from "@/lib/mock";
import { MockStage } from "./MockStage";
import { StudentRoom } from "./StudentRoom";

/** /app/mock/[id]: the host gets the projector, members get their paper. */
export function MockRoom({ sessionId }: { sessionId: string }) {
  const [ctx, setCtx] = useState<MockContext | null | undefined>(undefined);
  const [isHostOfThis, setIsHostOfThis] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    (async () => {
      const c = await getMockContext();
      if (!alive) return;
      setCtx(c);
      if (!c) return;
      const s = c.isHost ? await getSession(sessionId) : null;
      if (alive) setIsHostOfThis(Boolean(c.isHost && s && s.chapter_id === c.chapter?.id));
    })();
    return () => {
      alive = false;
    };
  }, [sessionId]);

  if (ctx === undefined || (ctx && isHostOfThis === undefined)) {
    return <p className="mock-muted mock-page" role="status">Opening the session...</p>;
  }
  if (!ctx) {
    return (
      <div className="mock-page">
        <div className="card mock-note">
          <p>Sign in to join this session.</p>
          <Link href="/auth" className="btn btn-accent btn-sm">Sign in</Link>
        </div>
      </div>
    );
  }
  if (isHostOfThis) return <MockStage sessionId={sessionId} />;
  return <StudentRoom sessionId={sessionId} userId={ctx.userId} />;
}
