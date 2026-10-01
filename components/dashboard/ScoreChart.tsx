"use client";

import { getCompetition } from "@/lib/competitions";
import type { Competition } from "@/lib/competitions";
import type { PracticeLog } from "@/lib/storage";
import { AI_LOG_PREFIX, isScoredTest, parseJudgeNote, judgeModeLabel, READINESS_RULE } from "@/lib/chapter";

/** What kind of practice a log was, in plain words. */
export function logKind(l: PracticeLog): string {
  const judge = parseJudgeNote(l.notes);
  if (judge) return `AI Judge, ${judgeModeLabel(judge.mode).toLowerCase()}`;
  if (l.notes.startsWith("Mistake review")) return "Mistake review";
  if (l.notes.startsWith(`${AI_LOG_PREFIX} (full simulation)`)) return "Full simulation";
  if (l.notes.startsWith(AI_LOG_PREFIX)) return "Practice test";
  return "Logged by hand";
}

/** The event's name, or its slug when the registry no longer has it. */
export function eventName(slug: string): string {
  return getCompetition(slug)?.name ?? slug;
}

// ── Score chart: every scored test for the event ────────────────

export function ScoreChart({ comp, logs }: { comp: Competition; logs: PracticeLog[] }) {
  const pts = logs
    .filter((l) => l.competitionSlug === comp.slug && isScoredTest(l))
    .slice(0, 12)
    .reverse()
    .map((l) => Math.round((l.score! / l.outOf!) * 100));
  if (pts.length < 2) return null;

  const W = 960, H = 220, L = 34, R = 24, T = 26, B = 14;
  const x = (i: number) => L + (i * (W - L - R)) / (pts.length - 1);
  const y = (v: number) => T + ((100 - v) * (H - T - B)) / 100;
  const line = pts.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(pts.length - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`;
  const ready = READINESS_RULE.testReadyPct;
  const last = pts[pts.length - 1];

  return (
    <section className="db-chart-card" aria-labelledby="db-chart-title">
      <div className="db-chart-top">
        <h2 id="db-chart-title" className="db-chart-title">Your scores</h2>
        <span className="db-chart-sub">Last {pts.length} scored tests in {comp.name}</span>
      </div>
      <svg className="db-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Scores, oldest to newest: ${pts.join("%, ")}%`}>
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line className="grid" x1={L} x2={W - R} y1={y(v)} y2={y(v)} />
            <text className="axis" x={L - 8} y={y(v) + 4} textAnchor="end">{v}</text>
          </g>
        ))}
        <line className="ready" x1={L} x2={W - R} y1={y(ready)} y2={y(ready)} />
        <text className="ready-label" x={L + 6} y={y(ready) - 7}>Ready at {ready}%</text>
        <path className="area" d={area} />
        <path className="line" d={line} />
        {pts.map((v, i) => (
          <circle key={i} className={`dot${i === pts.length - 1 ? " is-last" : ""}`} cx={x(i)} cy={y(v)} r={i === pts.length - 1 ? 5 : 3.6} />
        ))}
        <text className="last-label" x={x(pts.length - 1)} y={y(last) - 12} textAnchor="middle">{last}%</text>
      </svg>
    </section>
  );
}

