"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/Card";
import { PenCheck, PenCross } from "@/components/PenMarks";
import { toCsv, downloadCsv } from "@/lib/format";
import {
  READINESS_LABEL,
  READINESS_RULE,
  judgeModeLabel,
  type ReadinessRow,
  type ReadinessStatus,
} from "@/lib/chapter";
import type { ChapterController } from "./useChapterData";
import "./readiness.css";

// Advisor readiness report: one row per member for the event they registered
// for, with a transparent Ready / On track / Needs attention status. The rule
// itself lives in lib/chapter.ts (READINESS_RULE + computeReadinessRow); the
// "How status is decided" panel below is generated from those same numbers.

type SortKey = "status" | "name" | "event" | "tests" | "last7" | "avg" | "trend" | "judge" | "last";
type SortDir = "asc" | "desc";
type Filter = "all" | ReadinessStatus;

const STATUS_ORDER: Record<ReadinessStatus, number> = { attention: 0, "on-track": 1, ready: 2 };
const STATUSES: ReadinessStatus[] = ["attention", "on-track", "ready"];

const SORT_OPTIONS: { key: SortKey; label: string; defaultDir: SortDir }[] = [
  { key: "status", label: "Status", defaultDir: "asc" },
  { key: "name", label: "Member", defaultDir: "asc" },
  { key: "event", label: "Event", defaultDir: "asc" },
  { key: "tests", label: "Tests taken", defaultDir: "desc" },
  { key: "last7", label: "Tests this week", defaultDir: "desc" },
  { key: "avg", label: "Test average", defaultDir: "desc" },
  { key: "trend", label: "Trend", defaultDir: "desc" },
  { key: "judge", label: "Judge score", defaultDir: "desc" },
  { key: "last", label: "Last practice", defaultDir: "desc" },
];

/** Numeric or text sort value; null always sorts last whichever way you sort. */
function sortValue(r: ReadinessRow, key: SortKey): number | string | null {
  switch (key) {
    case "status": return STATUS_ORDER[r.status];
    case "name": return r.name.toLowerCase();
    case "event": return r.eventName?.toLowerCase() ?? null;
    case "tests": return r.testsTotal;
    case "last7": return r.testsLast7;
    case "avg": return r.avgTestPct;
    case "trend": return r.trendDelta;
    case "judge": return r.latestJudge?.score ?? null;
    case "last": return r.daysSinceLast;
  }
}

function compareRows(a: ReadinessRow, b: ReadinessRow, key: SortKey, dir: SortDir): number {
  const va = sortValue(a, key);
  const vb = sortValue(b, key);
  if (va == null && vb != null) return 1;
  if (vb == null && va != null) return -1;
  if (va != null && vb != null && va !== vb) {
    const c = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
    return dir === "asc" ? c : -c;
  }
  // Stable tie-breaks: most overdue first, then name.
  const da = a.daysSinceLast ?? Number.POSITIVE_INFINITY;
  const db = b.daysSinceLast ?? Number.POSITIVE_INFINITY;
  if (da !== db) return db - da;
  return a.name.localeCompare(b.name);
}

function lastPracticeText(days: number | null): string {
  if (days == null) return "Never";
  if (days === 0) return "Today";
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function trendText(delta: number | null): { word: string; dir: "up" | "down" | "flat" | null } {
  if (delta == null) return { word: "Not enough tests", dir: null };
  if (delta >= READINESS_RULE.trendMinDelta) return { word: `Up ${delta}`, dir: "up" };
  if (delta <= -READINESS_RULE.trendMinDelta) return { word: `Down ${Math.abs(delta)}`, dir: "down" };
  return { word: "Steady", dir: "flat" };
}

/** Neutralize spreadsheet formula injection in member-controlled text cells. */
function safeCell(v: string): string {
  return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
}

function exportReadinessCSV(rows: ReadinessRow[], chapterName: string) {
  const headers = [
    "Member", "Email", "Event", "Status", "Why",
    "Tests total", "Tests last 7 days",
    `Test average (last ${READINESS_RULE.avgWindow}) %`, "Trend (points)",
    "Latest Judge score (of 100)", "Judge Q&A (of 100)", "Judge rounds",
    "Weakest topics", "Days since last practice",
  ];
  const body = rows.map((r) => [
    safeCell(r.name),
    safeCell(r.email ?? ""),
    safeCell(r.eventName ?? ""),
    READINESS_LABEL[r.status],
    safeCell(r.reasons.join("; ")),
    String(r.testsTotal),
    String(r.testsLast7),
    r.avgTestPct != null ? String(r.avgTestPct) : "",
    r.trendDelta != null ? String(r.trendDelta) : "",
    r.latestJudge ? String(r.latestJudge.score) : "",
    r.latestJudge?.qaTotal != null ? String(r.latestJudge.qaTotal) : "",
    String(r.judgeRounds),
    safeCell(r.weakTopics.map((t) => `${t.topic} (${t.pct}%)`).join("; ")),
    r.daysSinceLast != null ? String(r.daysSinceLast) : "",
  ]);
  const csv = toCsv([headers, ...body]);
  downloadCsv(`${chapterName.replace(/\s+/g, "-").toLowerCase()}-readiness-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}

export function ReadinessReport({ c }: { c: ChapterController }) {
  const { readiness, chapter } = c;
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filter, setFilter] = useState<Filter>("all");

  const all = useMemo(() => readiness?.rows ?? [], [readiness]);
  const counts = useMemo(() => {
    const m: Record<ReadinessStatus, number> = { attention: 0, "on-track": 0, ready: 0 };
    for (const r of all) m[r.status] += 1;
    return m;
  }, [all]);
  const rows = useMemo(
    () => all.filter((r) => filter === "all" || r.status === filter).sort((a, b) => compareRows(a, b, sortKey, sortDir)),
    [all, filter, sortKey, sortDir]
  );

  if (!readiness) return null;

  function sortBy(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(SORT_OPTIONS.find((o) => o.key === key)?.defaultDir ?? "asc");
    }
  }

  const R = READINESS_RULE;
  const sortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? "";
  const th = (key: SortKey, label: string, className?: string) => (
    <th
      scope="col"
      className={className}
      aria-sort={sortKey === key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button type="button" className="rd-sort" onClick={() => sortBy(key)}>
        {label}
        <span className="rd-sort-arrow" aria-hidden="true">
          {sortKey === key ? (sortDir === "asc" ? "↑" : "↓") : ""}
        </span>
      </button>
    </th>
  );

  return (
    <Card className="rd">
      <CardHeader
        eyebrow="Road to regionals"
        title="Readiness report"
        tagline="Every member, the event they registered for, and whether their practice says they are ready."
      />

      {all.length === 0 ? (
        <p className="rd-empty">No members yet. Once members join and practice, each one gets a row here.</p>
      ) : (
        <>
          <div className="rd-filters" role="group" aria-label="Filter by status">
            <button type="button" className="rd-filter" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
              All <span className="rd-filter-n">{all.length}</span>
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className={`rd-filter rd-filter-${s}`}
                aria-pressed={filter === s}
                onClick={() => setFilter(s)}
              >
                {READINESS_LABEL[s]} <span className="rd-filter-n">{counts[s]}</span>
              </button>
            ))}
            <button
              type="button"
              className="btn btn-ghost btn-sm rd-export"
              onClick={() => exportReadinessCSV(rows, chapter?.name ?? "chapter")}
              disabled={rows.length === 0}
              title="Download the rows shown, in the order shown"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M7 10l5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
              Export CSV
            </button>
          </div>

          {/* Phone and tablet: the table becomes cards, sorted with a select. */}
          <div className="rd-mobile-sort">
            <label htmlFor="rd-sort-select" className="rd-mobile-sort-label">Sort by</label>
            <select
              id="rd-sort-select"
              className="input-field rd-mobile-select"
              value={sortKey}
              onChange={(e) => {
                const key = e.target.value as SortKey;
                setSortKey(key);
                setSortDir(SORT_OPTIONS.find((o) => o.key === key)?.defaultDir ?? "asc");
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-ghost btn-sm rd-dir"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              aria-label={`${sortLabel}, ${sortDir === "asc" ? "ascending" : "descending"}. Reverse the order.`}
            >
              {sortDir === "asc" ? "Ascending" : "Descending"}
            </button>
          </div>

          {!readiness.topicsAvailable && (
            <p className="rd-note">Weakest topics are not available yet. Everything else is live.</p>
          )}

          {rows.length === 0 ? (
            <p className="rd-empty">No members match this filter.</p>
          ) : (
            <>
              <div className="rd-table-wrap">
                <table className="rd-table">
                  <caption className="sr-only">
                    Readiness by member, sorted by {sortLabel.toLowerCase()} {sortDir === "asc" ? "ascending" : "descending"}
                  </caption>
                  <thead>
                    <tr>
                      {th("name", "Member")}
                      {th("event", "Event")}
                      {th("tests", "Tests")}
                      {th("avg", `Avg (last ${R.avgWindow})`)}
                      {th("trend", "Trend")}
                      {th("judge", "Judge")}
                      <th scope="col"><span className="rd-th-static">Weakest topics</span></th>
                      {th("last", "Last practice")}
                      {th("status", "Status")}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <p className="rd-name">{r.name}</p>
                          {r.email && <p className="rd-sub">{r.email}</p>}
                        </td>
                        <td><EventCell r={r} /></td>
                        <td>
                          <p className="rd-num">{r.testsTotal}</p>
                          <p className="rd-sub">{r.testsLast7} this week</p>
                        </td>
                        <td><AvgCell r={r} /></td>
                        <td><TrendCell r={r} /></td>
                        <td><JudgeCell r={r} /></td>
                        <td><TopicsCell r={r} available={readiness.topicsAvailable} /></td>
                        <td><span className="rd-days">{lastPracticeText(r.daysSinceLast)}</span></td>
                        <td><StatusCell r={r} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="rd-cards">
                {rows.map((r) => (
                  <li key={r.id} className={`rd-card rd-card-${r.status}`}>
                    <div className="rd-card-head">
                      <div className="rd-card-who">
                        <p className="rd-name">{r.name}</p>
                        <EventCell r={r} />
                      </div>
                      <StatusCell r={r} compact />
                    </div>
                    <dl className="rd-card-grid">
                      <div>
                        <dt>Tests</dt>
                        <dd><span className="rd-num">{r.testsTotal}</span> <span className="rd-sub">{r.testsLast7} this week</span></dd>
                      </div>
                      <div>
                        <dt>Avg (last {R.avgWindow})</dt>
                        <dd><AvgCell r={r} /> <TrendCell r={r} inline /></dd>
                      </div>
                      <div>
                        <dt>Judge</dt>
                        <dd><JudgeCell r={r} /></dd>
                      </div>
                      <div>
                        <dt>Last practice</dt>
                        <dd><span className="rd-days">{lastPracticeText(r.daysSinceLast)}</span></dd>
                      </div>
                    </dl>
                    <div className="rd-card-topics">
                      <p className="rd-card-label">Weakest topics</p>
                      <TopicsCell r={r} available={readiness.topicsAvailable} />
                    </div>
                    <ul className="rd-reasons">
                      {r.reasons.map((why) => <li key={why}>{why}</li>)}
                    </ul>
                  </li>
                ))}
              </ul>
            </>
          )}

          <details className="rd-rule">
            <summary>How status is decided</summary>
            <p>
              Every number is for the member&apos;s registered event. A practice session is an AI practice test, a logged
              test, or an AI Judge round. Test average is the last {R.avgWindow} scored tests. Judge scores are rubric
              points out of 100, so they are never averaged with test percentages.
            </p>
            <dl className="rd-rule-list">
              <div>
                <dt className="rd-status-attention">{READINESS_LABEL.attention}</dt>
                <dd>
                  Any one of: no event picked, no practice for the event, no practice in more than {R.staleDays} days,
                  fewer than {R.minSessions} practice sessions, a test average under {R.testAttentionPct}%, or a latest
                  Judge score under {R.judgeAttention}.
                </dd>
              </div>
              <div>
                <dt className="rd-status-ready">{READINESS_LABEL.ready}</dt>
                <dd>
                  All of: at least {R.readySessions} practice sessions, practice within the last {R.readyRecentDays} days,
                  a test average of {R.testReadyPct}% or more when the event has a test, and a latest Judge score of{" "}
                  {R.judgeReady} or more when the event is judged.
                </dd>
              </div>
              <div>
                <dt className="rd-status-on-track">{READINESS_LABEL["on-track"]}</dt>
                <dd>Everyone else: nothing is alarming, but at least one Ready bar is not met yet. The row says which.</dd>
              </div>
            </dl>
            <p>
              Trend compares the average of the latest {R.trendWindow} scored tests with up to {R.trendWindow} before
              them, so it needs at least {R.trendWindow + 1} scored tests; a change under {R.trendMinDelta} points reads
              as steady. Weakest topics need at least {R.weakMinSeen}{" "}
              questions answered and come from AI practice tests.
            </p>
          </details>
        </>
      )}
    </Card>
  );
}

function EventCell({ r }: { r: ReadinessRow }) {
  if (!r.eventName) return <span className="rd-muted">No event</span>;
  return <span className="rd-event">{r.eventName}</span>;
}

function AvgCell({ r }: { r: ReadinessRow }) {
  if (r.avgTestPct == null) return <span className="rd-muted">{r.expectsTest || r.testsTotal > 0 ? "No scores" : "No test"}</span>;
  const tone =
    r.avgTestPct >= READINESS_RULE.testReadyPct ? "good" : r.avgTestPct < READINESS_RULE.testAttentionPct ? "low" : "mid";
  return <span className={`rd-num rd-tone-${tone}`}>{r.avgTestPct}%</span>;
}

function TrendCell({ r, inline }: { r: ReadinessRow; inline?: boolean }) {
  const t = trendText(r.trendDelta);
  if (!t.dir) return inline ? null : <span className="rd-muted">{t.word}</span>;
  return (
    <span className={`rd-trend rd-trend-${t.dir}`}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {t.dir === "up" ? <path d="M4 16l6-6 4 4 6-7" /> : t.dir === "down" ? <path d="M4 8l6 6 4-4 6 7" /> : <path d="M4 12h16" />}
      </svg>
      {t.word}
    </span>
  );
}

function JudgeCell({ r }: { r: ReadinessRow }) {
  if (!r.latestJudge) return <span className="rd-muted">{r.expectsJudge ? "No round yet" : "Not judged"}</span>;
  const j = r.latestJudge;
  const tone = j.score >= READINESS_RULE.judgeReady ? "good" : j.score < READINESS_RULE.judgeAttention ? "low" : "mid";
  return (
    <span className="rd-judge">
      <span className={`rd-num rd-tone-${tone}`}>{j.score}</span>
      <span className="rd-sub"> of 100</span>
      <span className="rd-sub rd-block">
        {judgeModeLabel(j.mode)}{j.qaTotal != null ? `, Q&A ${j.qaTotal}` : ""}
      </span>
    </span>
  );
}

function TopicsCell({ r, available }: { r: ReadinessRow; available: boolean }) {
  if (!available) return <span className="rd-muted">Not available yet</span>;
  if (r.weakTopics.length === 0) return <span className="rd-muted">Not enough data</span>;
  return (
    <ul className="rd-topics">
      {r.weakTopics.map((t) => (
        <li key={t.topic} className="chip rd-topic" title={`${t.correct} of ${t.total} correct`}>
          <span className="rd-topic-name">{t.topic}</span>
          <span className="rd-topic-pct">{t.pct}%</span>
        </li>
      ))}
    </ul>
  );
}

function StatusCell({ r, compact }: { r: ReadinessRow; compact?: boolean }) {
  return (
    <div className="rd-status">
      <span className={`rd-pill rd-pill-${r.status}`}>
        {r.status === "ready" && (
          <span className="report-mark rd-mark"><PenCheck /></span>
        )}
        {r.status === "attention" && (
          <span className="report-mark rd-mark"><PenCross /></span>
        )}
        {READINESS_LABEL[r.status]}
      </span>
      {!compact && (
        <ul className="rd-reasons">
          {r.reasons.map((why) => <li key={why}>{why}</li>)}
        </ul>
      )}
    </div>
  );
}
