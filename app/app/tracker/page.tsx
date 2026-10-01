"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { getCompetition } from "@/lib/competitions";
import {
  addPracticeLog,
  getPracticeLogs,
  removePracticeLog,
  getRegistered,
  onStorageChange,
  type PracticeLog,
} from "@/lib/storage";
import { AI_LOG_PREFIX, isJudgeNote, isScoredTest, parseJudgeNote } from "@/lib/chapter";
import { PageHeader } from "@/components/app/PageHeader";
import { EventCombobox } from "@/components/dashboard/EventCombobox";
import { ScoreChart, logKind, eventName } from "@/components/dashboard/ScoreChart";

/**
 * Practice history. Graded tests and Judge rounds save here on their own (the
 * coach and the judge write practice logs), so the list comes first and the
 * by-hand form is tucked behind a button.
 */

const LOG_CAP = 100;

type Filter = "all" | "tests" | "judge" | "mistakes" | "hand";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "tests", label: "Tests" },
  { key: "judge", label: "Judge rounds" },
  { key: "mistakes", label: "Mistake reviews" },
  { key: "hand", label: "By hand" },
];

function kindOf(l: PracticeLog): Exclude<Filter, "all"> {
  if (isJudgeNote(l.notes)) return "judge";
  if (l.notes.startsWith("Mistake review")) return "mistakes";
  if (l.notes.startsWith(AI_LOG_PREFIX)) return "tests";
  return "hand";
}

export default function History() {
  const [tick, setTick] = useState(0);
  useEffect(() => onStorageChange(() => setTick((t) => t + 1)), []);
  const { logs, myEvent } = useMemo(() => {
    void tick;
    return {
      logs: getPracticeLogs(),
      myEvent: getRegistered().map((s) => getCompetition(s)).find(Boolean) ?? null,
    };
  }, [tick]);

  const [filter, setFilter] = useState<Filter>("all");
  const [showAll, setShowAll] = useState(false);
  const [adding, setAdding] = useState(false);

  const shown = logs.filter((l) => filter === "all" || kindOf(l) === filter);
  const scored = logs.filter((l) => isScoredTest(l));
  const avg = scored.length
    ? Math.round(scored.slice(0, 10).reduce((s, l) => s + (l.score! / l.outOf!) * 100, 0) / Math.min(scored.length, 10))
    : null;
  const minutes = logs.reduce((s, l) => s + (l.durationMin ?? 0), 0);
  const judgeRounds = logs.filter((l) => isJudgeNote(l.notes)).length;

  return (
    <div className="app-page">
      <PageHeader
        eyebrow="History"
        title={<>Every test, <em>every score.</em></>}
        sub="Graded tests and judge rounds save here on their own."
        right={
          <button type="button" className="db-ghost" onClick={() => setAdding((v) => !v)} aria-expanded={adding}>
            {adding ? "Close" : "Add one by hand"}
          </button>
        }
      />

      {adding && <ManualLog defaultSlug={myEvent?.slug ?? ""} onDone={() => setAdding(false)} />}

      {logs.length === 0 ? (
        <section className="db-sheet">
          <div className="db-sheet-body hs-empty">
            <h2 className="db-cover-title">Nothing here <em>yet.</em></h2>
            <p className="db-cover-note">Your first graded test lands here with its score and topics.</p>
            <div className="db-actions">
              <Link href="/app/coach" className="db-begin">Take a practice test</Link>
              <Link href="/app/judge" className="db-ghost">Try a judge round</Link>
            </div>
          </div>
        </section>
      ) : (
        <>
          <div className="db-stats">
            <div className="db-stat">
              <div className="db-stat-num">{logs.length}</div>
              <div className="db-stat-label">Practice sessions</div>
            </div>
            <div className="db-stat">
              <div className="db-stat-num">{avg != null ? `${avg}%` : "None yet"}</div>
              <div className="db-stat-label">Test average, last {Math.min(scored.length, 10) || 10}</div>
            </div>
            <div className="db-stat">
              <div className="db-stat-num">{judgeRounds}</div>
              <div className="db-stat-label">{judgeRounds === 1 ? "Judge round" : "Judge rounds"}</div>
            </div>
            {minutes > 0 && (
              <div className="db-stat">
                <div className="db-stat-num">{minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`}</div>
                <div className="db-stat-label">Time practiced</div>
              </div>
            )}
          </div>

          {myEvent && <ScoreChart comp={myEvent} logs={logs} />}

          <div className="db-ledger">
            <div className="db-ledger-head">
              <h2>All practice</h2>
              <div className="hs-filters" role="group" aria-label="Show">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className="hs-filter"
                    aria-pressed={filter === f.key}
                    onClick={() => { setFilter(f.key); setShowAll(false); }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            {shown.length === 0 ? (
              <p className="hs-none">Nothing in this view yet.</p>
            ) : (
              <ul>
                {(showAll ? shown : shown.slice(0, LOG_CAP)).map((l) => {
                  const judge = parseJudgeNote(l.notes);
                  // A Judge round is rubric points, not a percentage, so it gets no %.
                  const pct = !judge && l.score != null && l.outOf ? Math.round((l.score / l.outOf) * 100) : null;
                  return (
                    <li key={l.id} className="hs-row">
                      <span className="db-ledger-name">
                        {eventName(l.competitionSlug)}
                        <span className="db-ledger-kind">
                          {logKind(l)}
                          {judge?.qaTotal != null ? `, Q&A ${judge.qaTotal}/100` : ""}
                          {l.durationMin ? `, ${l.durationMin} min` : ""}
                        </span>
                      </span>
                      <span className="db-ledger-when">
                        {new Date(l.loggedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                      <span className="db-ledger-score">
                        {l.score != null && l.outOf != null ? `${l.score}/${l.outOf}` : "Done"}
                        {pct != null && <span className={`hs-pct${pct >= 80 ? " is-good" : ""}`}>{pct}%</span>}
                      </span>
                      <button
                        type="button"
                        className="hs-delete"
                        onClick={() => removePracticeLog(l.id)}
                        aria-label={`Delete ${logKind(l).toLowerCase()} for ${eventName(l.competitionSlug)}`}
                        title="Delete"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {!showAll && shown.length > LOG_CAP && (
              <div className="hs-more">
                <button type="button" className="db-linkbtn" onClick={() => setShowAll(true)}>
                  Show all {shown.length}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ManualLog({ defaultSlug, onDone }: { defaultSlug: string; onDone: () => void }) {
  const [slug, setSlug] = useState(defaultSlug);
  const [score, setScore] = useState("");
  const [outOf, setOutOf] = useState("100");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  const [formError, setFormError] = useState("");
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    // A score above the maximum would count as over 100% in averages and readiness.
    if (score && outOf && Number(score) > Number(outOf)) {
      setFormError(`The score can't be higher than ${outOf}.`);
      return;
    }
    setFormError("");
    addPracticeLog({
      competitionSlug: slug,
      score: score ? Number(score) : null,
      outOf: outOf && Number(outOf) > 0 ? Number(outOf) : null,
      durationMin: duration ? Number(duration) : null,
      notes,
    });
    onDone();
  };

  return (
    <section className="db-sheet" aria-labelledby="hs-add-title">
      <div className="db-sheet-head">
        <span id="hs-add-title" className="db-sheet-kicker">Add practice by hand</span>
        <span className="db-sheet-kicker">For a paper test, a study session or a real competition</span>
      </div>
      <form className="db-sheet-body hs-form" onSubmit={onSubmit}>
        <div className="cp-field hs-wide">
          <label htmlFor="hs-event" className="db-field-label">Event</label>
          <EventCombobox id="hs-event" value={slug} onChange={setSlug} className="is-compact" />
        </div>
        <label className="cp-field">
          <span className="db-field-label">Score</span>
          <input className="input-field" type="number" min={0} step={1} placeholder="e.g. 82" value={score} onChange={(e) => setScore(e.target.value)} />
        </label>
        <label className="cp-field">
          <span className="db-field-label">Out of</span>
          <input className="input-field" type="number" min={1} step={1} value={outOf} onChange={(e) => setOutOf(e.target.value)} />
        </label>
        <label className="cp-field">
          <span className="db-field-label">Minutes</span>
          <input className="input-field" type="number" min={0} step={1} placeholder="e.g. 50" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </label>
        <label className="cp-field hs-wide">
          <span className="db-field-label">Notes</span>
          <textarea className="input-field" rows={3} placeholder="What did you study? What needs more work?" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ resize: "vertical", lineHeight: 1.55 }} />
        </label>
        <div className="hs-wide">
          {formError && <p className="ch-error" role="alert" style={{ marginBottom: 10 }}>{formError}</p>}
          <button type="submit" className="db-begin" disabled={!slug}>Save to history</button>
        </div>
      </form>
    </section>
  );
}
