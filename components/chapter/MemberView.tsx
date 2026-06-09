"use client";

import { Card, CardHeader } from "@/components/Card";
import { COMPETITIONS } from "@/lib/competitions";
import { formatDate } from "./chapterHelpers";
import type { ChapterController } from "./useChapterData";

// Member-facing chapter sections: "Your assignments" (own progress) and the
// effort-ranked chapter leaderboard. Extracted from app/app/chapter/page.tsx
// (issue #47).

export function MemberView({ c }: { c: ChapterController }) {
  const { hasChapter, isAdvisor, assignments, leaderboard, userId, myAssignmentProgress } = c;
  return (
    <>
      {/* ── ASSIGNMENTS (member) ── */}
      {hasChapter && !isAdvisor && assignments.length > 0 && (
        <Card>
          <CardHeader eyebrow="From your advisor" title="Your assignments" tagline="Practice targets your advisor set for the chapter." />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
            {assignments.map((a) => {
              const done = Math.min(myAssignmentProgress(a), a.target_count);
              const complete = done >= a.target_count;
              const ev = a.event_slug ? (COMPETITIONS.find((cmp) => cmp.slug === a.event_slug)?.name ?? a.event_slug) : "Any event";
              const pct = Math.round((done / a.target_count) * 100);
              return (
                <div key={a.id} style={{ padding: "14px 16px", border: `0.5px solid ${complete ? "rgba(var(--green-rgb),0.35)" : "var(--border)"}`, borderRadius: 12, background: complete ? "rgba(var(--green-rgb),0.06)" : "var(--bg2)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <p style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)" }}>{a.title}</p>
                      <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>{ev} · {a.target_count} test{a.target_count !== 1 ? "s" : ""}{a.due_at ? ` · due ${formatDate(a.due_at)}` : ""}</p>
                    </div>
                    {complete && (
                      <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: "rgba(var(--green-rgb),0.14)", color: "var(--green)", whiteSpace: "nowrap" }}>DONE</span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--bg3)", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: complete ? "var(--green)" : "var(--accent)", borderRadius: 999 }} />
                    </div>
                    <span className="font-mono" style={{ fontSize: 11, color: "var(--text2)", whiteSpace: "nowrap" }}>{done}/{a.target_count}</span>
                  </div>
                  {!complete && (
                    <a href={a.event_slug ? `/app/coach?slug=${a.event_slug}` : "/app/coach"} className="btn btn-ghost btn-sm btn-pill" style={{ marginTop: 12 }}>
                      Practice now
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── LEADERBOARD (member-visible) ── */}
      {hasChapter && !isAdvisor && leaderboard.length > 0 && (
        <Card>
          <CardHeader eyebrow="Chapter leaderboard" title="Who's putting in the work" tagline="Ranked by practice tests taken. Climb the board by practicing - effort, not scores." />
          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 12 }}>
            {leaderboard.map((row, i) => {
              const me = row.userId === userId;
              const rankColor = i === 0 ? "var(--medal-gold)" : i === 1 ? "var(--medal-silver)" : i === 2 ? "var(--medal-bronze)" : "var(--text3)";
              return (
                <div key={row.userId} style={{
                  display: "grid", gridTemplateColumns: "32px 1fr auto auto", alignItems: "center", gap: 12,
                  padding: "11px 14px", borderRadius: 10,
                  background: me ? "var(--accent-dim)" : "transparent",
                  border: me ? "0.5px solid var(--accent-border)" : "0.5px solid transparent",
                }}>
                  <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: rankColor, textAlign: "center" }}>{i + 1}</span>
                  <span style={{ fontSize: 14, color: "var(--text)", fontWeight: me ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {row.name}{me && <span style={{ color: "var(--accent-text)", fontWeight: 700 }}> · You</span>}
                  </span>
                  {row.last7 > 0 && (
                    <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "rgba(var(--green-rgb),0.12)", color: "var(--green)", whiteSpace: "nowrap" }}>+{row.last7} this week</span>
                  )}
                  <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", minWidth: 60, textAlign: "right" }}>{row.tests} <span style={{ fontSize: 10, color: "var(--text3)", fontWeight: 400 }}>tests</span></span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </>
  );
}
