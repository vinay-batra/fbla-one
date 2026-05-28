"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/Card";
import { COMPETITIONS, getCompetition, FORMAT_LABEL } from "@/lib/competitions";
import {
  getRegistered,
  getPracticeLogs,
  getSavedResources,
  getDisplayName,
  getUpcomingDeadlines,
  onStorageChange,
} from "@/lib/storage";

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
  const registered = getRegistered();
  const logs = getPracticeLogs();
  const saved = getSavedResources();

  // tick is intentionally referenced to keep memos invalidated when storage changes
  void tick;

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const logsThisWeek = logs.filter((l) => new Date(l.loggedAt).getTime() >= weekAgo).length;

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 1240 }}>
      {/* Greeting */}
      <div>
        <p className="eyebrow" style={{ marginBottom: 8 }}>
          {timeOfDay()}{displayName ? `, ${displayName}` : ""}
        </p>
        <h1 style={{ fontSize: 28, letterSpacing: "-0.02em" }}>
          {registeredCompetitions.length === 0
            ? "Pick your first competition."
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
        <Stat label="Registered" value={String(registeredCompetitions.length)} sub={`of ${COMPETITIONS.length} events`} />
        <Stat label="Logs this week" value={String(logsThisWeek)} sub={logsThisWeek === 0 ? "Log your first practice" : "keep going"} />
        <Stat label="Total practice" value={String(logs.length)} sub="all-time" />
        <Stat label="Saved resources" value={String(saved.length)} sub="across all events" />
      </div>

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
            <span className="eyebrow" style={{ fontSize: 9, color: "var(--accent)" }}>Upcoming</span>
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
          <Link href="/app/chapter" style={{ fontSize: 12, color: "var(--accent)", fontWeight: 500, flexShrink: 0, whiteSpace: "nowrap" }}>
            View all
          </Link>
        </div>
      )}

      {/* Active competitions */}
      <Card>
        <CardHeader
          eyebrow="Your queue"
          title="Active competitions"
          tagline="Click any event to jump to its prep page."
          right={
            <Link href="/competitions" className="btn btn-ghost btn-sm">
              Add more
            </Link>
          }
        />

        {registeredCompetitions.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 8 }}>
            <div className="empty-state-icon">+</div>
            <p className="empty-state-title">No competitions yet</p>
            <p className="empty-state-msg">Browse the full registry and add the events you're competing in.</p>
            <Link href="/competitions" className="btn btn-accent btn-sm btn-pill" style={{ marginTop: 8 }}>
              Browse competitions
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginTop: 14 }}>
            {registeredCompetitions.map((c) => {
              const last = lastPracticeBySlug.get(c.slug);
              const compLogs = logs.filter((l) => l.competitionSlug === c.slug);
              return (
                <Link key={c.slug} href={`/competitions/${c.slug}`} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      padding: 18,
                      borderRadius: 12,
                      border: "0.5px solid var(--border)",
                      background: "var(--bg2)",
                      transition: "all 0.2s ease",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent-border)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <span className="chip chip-brand">{c.category}</span>
                    <h3 style={{ fontSize: 15, fontWeight: 700 }}>{c.name}</h3>
                    <p style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.5 }}>
                      {FORMAT_LABEL[c.format]} · {compLogs.length} {compLogs.length === 1 ? "log" : "logs"}
                      {last && ` · last ${relativeTime(last)}`}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      {/* Recent activity */}
      <div className="dash-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Card>
          <CardHeader eyebrow="Recent practice" title="Last 5 logs" />
          {logs.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 6 }}>
              No practice logs yet. Head to the{" "}
              <Link href="/app/tracker" style={{ color: "var(--accent)" }}>
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
                          color: "var(--accent)",
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
      `}</style>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        background: "var(--card-bg)",
        border: "0.5px solid var(--border)",
        borderRadius: 12,
        padding: "18px 18px",
      }}
    >
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
    </div>
  );
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

function relativeTime(iso: string): string {
  const date = new Date(iso);
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  return date.toLocaleDateString();
}
