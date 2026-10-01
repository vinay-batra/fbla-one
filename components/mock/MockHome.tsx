"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/app/PageHeader";
import { getCompetition } from "@/lib/competitions";
import { getMockContext, listChapterSessions, type MockContext, type MockSession } from "@/lib/mock";
import { HostSetup } from "./HostSetup";
import { JoinPanel } from "./JoinPanel";

const STATUS_LABEL: Record<MockSession["status"], string> = {
  lobby: "In the lobby",
  live: "Live now",
  ended: "Finished",
};

function sessionDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** /app/mock: advisors set up a session, members join one. */
export function MockHome() {
  const [ctx, setCtx] = useState<MockContext | null | undefined>(undefined);
  const [sessions, setSessions] = useState<MockSession[]>([]);

  useEffect(() => {
    let alive = true;
    getMockContext().then(async (c) => {
      if (!alive) return;
      setCtx(c);
      if (c?.chapter) {
        const list = await listChapterSessions(c.chapter.id);
        if (alive) setSessions(list);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const open = sessions.filter((s) => s.status !== "ended");
  const past = sessions.filter((s) => s.status === "ended");

  return (
    <div className="mock-page">
      <PageHeader
        eyebrow="Mock Regionals"
        title={<>One paper, <em>one clock.</em></>}
        sub="The advisor puts a code on the projector, the whole chapter sits the same test at once, and the room finds out who would place."
      />

      {ctx === undefined && <p className="mock-muted" role="status">Loading your chapter...</p>}

      {ctx === null && (
        <div className="card mock-note">
          <p>Mock Regionals runs inside a chapter, so it needs a free account.</p>
          <Link href="/auth?mode=signup&next=/app/mock" className="btn btn-accent btn-sm">Create free account</Link>
        </div>
      )}

      {ctx && !ctx.chapter && (
        <div className="card mock-note">
          <h3>Join your chapter first</h3>
          <p>Mock Regionals runs inside a chapter. Ask your advisor for the invite code, or create a chapter if you are the advisor.</p>
          <Link href="/app/chapter" className="btn btn-accent btn-sm">Go to Chapter</Link>
        </div>
      )}

      {ctx?.chapter && (
        <div className="mock-home-grid">
          <div className="sheet-stack">{ctx.isHost ? <HostSetup /> : <JoinPanel userId={ctx.userId} />}</div>

          <aside className="mock-side" aria-label="Sessions in your chapter">
            {open.length > 0 && (
              <section>
                <h3 className="mock-side-title">{ctx.isHost ? "Open sessions" : "Happening now"}</h3>
                <ul className="mock-list">
                  {open.map((s) => (
                    <li key={s.id}>
                      <Link href={`/app/mock/${s.id}`} className="mock-list-row">
                        <span className="mock-list-name">{getCompetition(s.event_slug)?.name ?? s.event_slug}</span>
                        <span className={`mock-status is-${s.status}`}>{STATUS_LABEL[s.status]}</span>
                        <span className="mock-list-meta">
                          {s.question_count} questions, {Math.round(s.duration_sec / 60)} min
                          {ctx.isHost ? `, code ${s.code}` : ""}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h3 className="mock-side-title">Past sessions</h3>
              {past.length === 0 ? (
                <p className="mock-muted">
                  {ctx.isHost
                    ? "Nothing yet. Your first session's results will be kept here."
                    : "When your chapter runs a session, the results live here."}
                </p>
              ) : (
                <ul className="mock-list">
                  {past.map((s) => (
                    <li key={s.id}>
                      <Link href={`/app/mock/${s.id}`} className="mock-list-row">
                        <span className="mock-list-name">{getCompetition(s.event_slug)?.name ?? s.event_slug}</span>
                        <span className="mock-list-meta">
                          {sessionDate(s.created_at)}, {s.question_count} questions
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
