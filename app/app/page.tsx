"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/Card";
import { Sparkbars } from "@/components/Sparkbars";
import { StudyPlan } from "@/components/StudyPlan";
import { ChapterRankChip } from "@/components/ChapterRankChip";
import { getCompetition, FORMAT_LABEL } from "@/lib/competitions";
import {
  getRegistered,
  getPracticeLogs,
  getSavedResources,
  getDisplayName,
  getUpcomingDeadlines,
  onStorageChange,
  type PracticeLog,
} from "@/lib/storage";
import { relativeTime, dayKeyET } from "@/lib/format";
import type { Competition } from "@/lib/competitions";

// ── Score trend chart ──────────────────────────────────────────

function ScoreTrends({ logs, registeredCompetitions }: { logs: PracticeLog[]; registeredCompetitions: Competition[] }) {
  // Per-competition: last 8 scored logs, only comps with 2+ scored logs
  const entries = registeredCompetitions
    .map((comp) => {
      const compLogs = logs
        .filter((l) => l.competitionSlug === comp.slug && l.score != null && l.outOf != null && l.outOf > 0)
        .slice(0, 8);
      if (compLogs.length < 2) return null;
      const pcts = compLogs.map((l) => Math.round((l.score! / l.outOf!) * 100)).reverse();
      const latest = pcts[pcts.length - 1];
      const avg = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
      return { comp, pcts, latest, avg };
    })
    .filter(Boolean)
    .slice(0, 4) as { comp: Competition; pcts: number[]; latest: number; avg: number }[];

  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader
        eyebrow="AI Practice"
        title="Score trends"
        tagline="Your last 8 scored practice tests per event."
        right={
          <Link href="/app/coach" className="btn btn-ghost btn-sm">
            New test
          </Link>
        }
      />
      <div
        className="score-trends-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginTop: 18 }}
      >
        {entries.map(({ comp, pcts, latest, avg }) => (
          <Link
            key={comp.slug}
            href={`/app/coach?slug=${comp.slug}`}
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 10,
                border: "0.5px solid var(--border)",
                background: "var(--bg2)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-border)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <p style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>{comp.name}</p>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
                <Sparkbars values={pcts} variant="score" ariaLabel={`Last ${pcts.length} practice scores for ${comp.name}`} />
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p className="font-mono" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1, color: latest >= 80 ? "var(--green)" : latest >= 60 ? "var(--accent)" : "var(--red)" }}>
                    {latest}<span style={{ fontSize: 12 }}>%</span>
                  </p>
                  <p style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>avg {avg}%</p>
                </div>
              </div>
              <p style={{ fontSize: 10, color: "var(--text3)" }}>{pcts.length} test{pcts.length !== 1 ? "s" : ""} logged</p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const [tick, setTick] = useState(0);
  useEffect(() => onStorageChange(() => setTick((t) => t + 1)), []);

  const displayName = getDisplayName();

  // Derive everything once per storage change (tick), not on every render.
  const { logs, saved, logsThisWeek, streakDays, upcomingDeadlines, registeredCompetitions, lastPracticeBySlug } = useMemo(() => {
    void tick; // recompute when localStorage changes
    const registered = getRegistered();
    const logs = getPracticeLogs();
    const saved = getSavedResources();

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const logsThisWeek = logs.filter((l) => new Date(l.loggedAt).getTime() >= weekAgo).length;

    // Practice streak: consecutive days (ending today or yesterday) with >=1 log.
    const streakDays = (() => {
      // Use one fixed day-boundary basis (America/New_York) everywhere so the
      // streak and the public-chat daily cap agree on when a day rolls over.
      const days = new Set(logs.map((l) => dayKeyET(new Date(l.loggedAt))));
      if (days.size === 0) return 0;
      const oneDay = 86400000;
      const cur = new Date();
      cur.setHours(0, 0, 0, 0);
      const todayKey = dayKeyET(cur);
      // Count even if today has no log yet (start from yesterday).
      if (!days.has(todayKey)) cur.setTime(cur.getTime() - oneDay);
      let n = 0;
      while (days.has(dayKeyET(cur))) {
        n++;
        cur.setTime(cur.getTime() - oneDay);
      }
      return n;
    })();

    const upcomingDeadlines = getUpcomingDeadlines(3);

    const registeredCompetitions = registered
      .map((slug) => getCompetition(slug))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));

    const lastPracticeBySlug = new Map<string, string>();
    for (const log of logs) {
      if (!lastPracticeBySlug.has(log.competitionSlug)) {
        lastPracticeBySlug.set(log.competitionSlug, log.loggedAt);
      }
    }

    return { logs, saved, logsThisWeek, streakDays, upcomingDeadlines, registeredCompetitions, lastPracticeBySlug };
  }, [tick]);

  // Single-event model: you compete in ONE event. Surface it here on the
  // dashboard (there is no separate "My event" tab anymore).
  const myEvent = registeredCompetitions[0] ?? null;
  const myEventLogs = myEvent ? logs.filter((l) => l.competitionSlug === myEvent.slug) : [];
  const myEventScored = myEventLogs.filter((l) => l.score != null && l.outOf != null && l.outOf > 0);
  const myEventAvg = myEventScored.length
    ? Math.round(myEventScored.reduce((sum, l) => sum + (l.score! / l.outOf!) * 100, 0) / myEventScored.length)
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 1240 }}>
      {/* Greeting */}
      <div>
        <p className="eyebrow" style={{ marginBottom: 8 }}>
          {timeOfDay()}{displayName ? `, ${displayName}` : ""}
        </p>
        <h1 style={{ fontSize: 28, letterSpacing: "-0.02em" }}>
          {registeredCompetitions.length === 0
            ? "Pick your first event."
            : `Keep going. ${registeredCompetitions.length === 1 ? "1 event" : `${registeredCompetitions.length} events`} on your plate.`}
        </h1>
      </div>

      {/* Stats */}
      <div
        className="dash-stats"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
        }}
      >
        <Stat label="Day streak" value={String(streakDays)} sub={streakDays === 0 ? "Practice today to start" : streakDays === 1 ? "day in a row" : "days in a row"} href="/app/coach" />
        <Stat label="Logs this week" value={String(logsThisWeek)} sub={logsThisWeek === 0 ? "Log your first practice" : "keep going"} href="/app/tracker" />
        <Stat label="Total practice" value={String(logs.length)} sub="all-time" href="/app/tracker" />
        <Stat label="Saved resources" value={String(saved.length)} sub="across all events" href="/app/resources" />
      </div>

      {/* Road to Nationals: season milestones + practice pacing */}
      <StudyPlan />

      {/* Chapter standing (renders only for users in a chapter) */}
      <ChapterRankChip />

      {/* Upcoming deadlines strip (only shown when deadlines exist) */}
      {upcomingDeadlines.length > 0 && (
        <div
          style={{
            background: "var(--bg2)",
            border: "0.5px solid var(--accent-border)",
            borderRadius: 12,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span className="eyebrow" style={{ fontSize: 9, color: "var(--accent-text)" }}>Upcoming</span>
          </div>
          <div style={{ display: "flex", gap: 10, flex: 1, flexWrap: "wrap" }}>
            {upcomingDeadlines.map((dl) => {
              const days = Math.round(
                (new Date(dl.dueAt + "T00:00:00").getTime() - new Date().setHours(0, 0, 0, 0)) /
                  (1000 * 60 * 60 * 24)
              );
              const comp = dl.competitionSlug ? getCompetition(dl.competitionSlug) : null;
              return (
                <div
                  key={dl.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 10px",
                    borderRadius: 8,
                    background: "var(--card-bg)",
                    border: "0.5px solid var(--border)",
                  }}
                >
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: days === 0 ? "var(--green)" : "var(--accent)",
                    }}
                  >
                    {days === 0 ? "Today" : `${days}d`}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 500 }}>
                    {dl.title}
                    {comp && (
                      <span style={{ color: "var(--text3)" }}> - {comp.name}</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          <Link href="/app/chapter" style={{ fontSize: 12, color: "var(--accent-text)", fontWeight: 500, flexShrink: 0, whiteSpace: "nowrap" }}>
            View all
          </Link>
        </div>
      )}

      {/* Your event (single-event model) */}
      <Card className="tour-event">
        <CardHeader
          eyebrow="Your event"
          title="Your event"
          tagline={myEvent ? "The one event you're competing in this year." : "Pick the one event you're competing in."}
          right={
            <Link href="/competitions" className="btn btn-ghost btn-sm">
              {myEvent ? "Change event" : "Pick event"}
            </Link>
          }
        />

        {!myEvent ? (
          <div className="empty-state" style={{ marginTop: 8 }}>
            <div className="empty-state-icon">+</div>
            <p className="empty-state-title">No event picked yet</p>
            <p className="empty-state-msg">Choose the one event you're competing in. We'll track your prep for it.</p>
            <Link href="/competitions" className="btn btn-accent btn-sm btn-pill" style={{ marginTop: 8 }}>
              Browse competitions
            </Link>
          </div>
        ) : (
          <div
            className="dash-event-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto auto auto",
              gap: 14,
              alignItems: "center",
              padding: "16px 18px",
              border: "0.5px solid var(--border)",
              borderRadius: 12,
              background: "var(--bg2)",
              marginTop: 14,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <Link
                href={`/competitions/${myEvent.slug}`}
                style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", transition: "color 0.15s ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text)")}
              >
                {myEvent.name}
              </Link>
              <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>
                {myEvent.category} · {FORMAT_LABEL[myEvent.format]}
                {(() => { const last = lastPracticeBySlug.get(myEvent.slug); return last ? ` · last ${relativeTime(last)}` : ""; })()}
              </p>
            </div>

            <EventStat label="LOGS" value={String(myEventLogs.length)} />
            <EventStat label="AVG" value={myEventAvg != null ? `${myEventAvg}%` : "-"} accent={myEventAvg != null} />

            <Link href={`/competitions/${myEvent.slug}`} className="btn btn-accent btn-sm btn-pill cta-shimmer">
              Prep
            </Link>
            <Link href="/competitions" className="btn btn-ghost btn-sm">
              Change
            </Link>
          </div>
        )}
      </Card>

      {/* Score trends (only shown once there are 3+ scored logs) */}
      {logs.filter((l) => l.score != null && l.outOf != null && l.outOf > 0).length >= 3 && (
        <ScoreTrends logs={logs} registeredCompetitions={registeredCompetitions} />
      )}

      {/* Recent activity */}
      <div className="dash-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Card>
          <CardHeader eyebrow="Recent practice" title="Last 5 logs" />
          {logs.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 6 }}>
              No practice logs yet. Head to the{" "}
              <Link href="/app/tracker" style={{ color: "var(--accent-text)" }}>
                tracker
              </Link>{" "}
              to add one.
            </p>
          ) : (
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
              {logs.slice(0, 5).map((l) => {
                const c = getCompetition(l.competitionSlug);
                return (
                  <li
                    key={l.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "var(--bg2)",
                      border: "0.5px solid var(--border)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                        {c?.name ?? l.competitionSlug}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text3)" }}>{relativeTime(l.loggedAt)}</p>
                    </div>
                    {l.score != null && l.outOf != null && (
                      <span
                        className="font-mono"
                        style={{
                          fontSize: 12,
                          color: "var(--accent-text)",
                          fontWeight: 700,
                        }}
                      >
                        {l.score}/{l.outOf}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader eyebrow="Up next" title="Suggested actions" />
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
            <Suggestion done={registeredCompetitions.length > 0} text="Pick at least 1 competition" href="/competitions" />
            <Suggestion done={logs.length > 0} text="Log your first practice test" href="/app/tracker" />
            <Suggestion done={saved.length > 0} text="Save 3 study resources" href="/competitions" />
            <Suggestion done={Boolean(displayName)} text="Set your display name" href="/app/settings" />
          </ul>
        </Card>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dash-stats { grid-template-columns: 1fr 1fr !important; }
          .dash-2col { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .dash-event-row { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function EventStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ textAlign: "right", minWidth: 56 }}>
      <p className="font-mono" style={{ fontSize: 9, letterSpacing: "0.14em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
        {label}
      </p>
      <p className="font-mono" style={{ fontSize: 16, fontWeight: 700, color: accent ? "var(--accent)" : "var(--text)" }}>
        {value}
      </p>
    </div>
  );
}

function Stat({ label, value, sub, href }: { label: string; value: string; sub?: string; href?: string }) {
  const inner = (
    <>
      <p
        className="font-mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.18em",
          color: "var(--text3)",
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        {label}
      </p>
      <div className="metric-number" style={{ marginTop: 8, color: "var(--text)" }}>{value}</div>
      {sub && <p style={{ marginTop: 4, fontSize: 11, color: "var(--text3)" }}>{sub}</p>}
    </>
  );
  const baseStyle = {
    background: "var(--card-bg)",
    border: "0.5px solid var(--border)",
    borderRadius: 12,
    padding: "18px 18px",
    display: "block",
    textDecoration: "none",
    transition: "border-color 0.15s",
  };
  if (href) {
    return (
      <Link
        href={href}
        style={baseStyle}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-border)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
      >
        {inner}
      </Link>
    );
  }
  return <div style={{ ...baseStyle, cursor: "default" }}>{inner}</div>;
}

function Suggestion({ done, text, href }: { done: boolean; text: string; href: string }) {
  return (
    <li>
      <Link
        href={href}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderRadius: 8,
          border: "0.5px solid var(--border)",
          background: done ? "rgba(var(--green-rgb), 0.06)" : "var(--bg2)",
          transition: "all 0.15s ease",
          textDecoration: "none",
        }}
        onMouseEnter={(e) => {
          if (done) return;
          e.currentTarget.style.borderColor = "var(--accent-border)";
        }}
        onMouseLeave={(e) => {
          if (done) return;
          e.currentTarget.style.borderColor = "var(--border)";
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            border: done ? "none" : "1.5px solid var(--text3)",
            background: done ? "var(--green)" : "transparent",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {done && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5L20 7" />
            </svg>
          )}
        </span>
        <span
          style={{
            fontSize: 13,
            color: done ? "var(--text3)" : "var(--text)",
            textDecoration: done ? "line-through" : "none",
            fontWeight: 500,
            flex: 1,
          }}
        >
          {text}
        </span>
      </Link>
    </li>
  );
}

