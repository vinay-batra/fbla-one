"use client";

import { useEffect, useState } from "react";
import { getPracticeLogs, onStorageChange, type PracticeLog } from "@/lib/storage";
import { judgeModeLabel, parseJudgeNote } from "@/lib/chapter";
import { relativeTime } from "@/lib/format";
import "./judge-history.css";

const SHOW = 5;

/**
 * "Your last judged rounds" for one event, read from the saved practice
 * history (the same logs the tracker and dashboard show). Loaded after mount
 * so the server render and the first client render agree.
 */
export function JudgeHistory({ slug, eventName }: { slug: string; eventName: string }) {
  const [logs, setLogs] = useState<PracticeLog[] | null>(null);
  useEffect(() => {
    const load = () => setLogs(getPracticeLogs());
    load();
    return onStorageChange(load);
  }, []);
  if (!logs) return null;

  const rounds = logs.filter((l) => l.competitionSlug === slug && l.score != null && parseJudgeNote(l.notes));
  const shown = rounds.slice(0, SHOW);

  return (
    <section className="jh" aria-labelledby="jh-title">
      <div className="jh-head">
        <h2 id="jh-title" className="jh-title">Your last judged rounds</h2>
        {rounds.length > 0 && (
          <p className="jh-count">
            {rounds.length > SHOW ? `Latest ${SHOW} of ${rounds.length}` : `${rounds.length} ${rounds.length === 1 ? "round" : "rounds"}`}
          </p>
        )}
      </div>
      {shown.length === 0 ? (
        <p className="jh-empty">
          No judged rounds for {eventName} yet. Every score you get here is saved to your practice history.
        </p>
      ) : (
        <ol className="jh-list">
          {shown.map((l) => {
            const j = parseJudgeNote(l.notes)!;
            const weakest = (l.topicResults ?? []).slice().sort((a, b) => a.correct / a.total - b.correct / b.total)[0];
            return (
              <li key={l.id} className="jh-row">
                <span className="jh-score">
                  {l.score}
                  <span className="jh-of">/100</span>
                </span>
                <div className="jh-body">
                  <p className="jh-line">
                    <span className="jh-mode">{judgeModeLabel(j.mode)}</span>
                    {j.qaTotal != null && <span className="jh-qa">Q&amp;A {j.qaTotal}/100</span>}
                  </p>
                  {weakest && (
                    <p className="jh-weak">
                      Lowest row: {weakest.topic}, {weakest.correct}/{weakest.total}
                    </p>
                  )}
                </div>
                <time className="jh-when" dateTime={l.loggedAt}>{relativeTime(l.loggedAt)}</time>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
