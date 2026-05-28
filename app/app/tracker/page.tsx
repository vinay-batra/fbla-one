"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/Card";
import { COMPETITIONS, getCompetition } from "@/lib/competitions";
import {
  addPracticeLog,
  getPracticeLogs,
  removePracticeLog,
  getRegistered,
  onStorageChange,
} from "@/lib/storage";

export default function Tracker() {
  const [tick, setTick] = useState(0);
  useEffect(() => onStorageChange(() => setTick((t) => t + 1)), []);
  void tick;

  const logs = getPracticeLogs();
  const registered = getRegistered();
  const options = registered.length > 0 ? COMPETITIONS.filter((c) => registered.includes(c.slug)) : COMPETITIONS;

  const [slug, setSlug] = useState<string>(options[0]?.slug ?? "");
  const [score, setScore] = useState<string>("");
  const [outOf, setOutOf] = useState<string>("100");
  const [duration, setDuration] = useState<string>("60");
  const [notes, setNotes] = useState<string>("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    addPracticeLog({
      competitionSlug: slug,
      score: score ? Number(score) : null,
      outOf: outOf ? Number(outOf) : null,
      durationMin: duration ? Number(duration) : null,
      notes,
    });
    setScore("");
    setNotes("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1240 }}>
      <div>
        <p className="eyebrow" style={{ marginBottom: 8 }}>Practice tracker</p>
        <h1 style={{ fontSize: 28, letterSpacing: "-0.02em" }}>Log a practice test</h1>
      </div>

      <div className="tracker-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 18 }}>
        <Card>
          <CardHeader eyebrow="New log" title="Add practice" />
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 6 }}>
            <Field label="Competition">
              <select
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="input-field"
                required
              >
                {options.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Score">
                <input
                  type="number"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="input-field"
                  placeholder="e.g. 82"
                  min={0}
                  step={1}
                />
              </Field>
              <Field label="Out of">
                <input
                  type="number"
                  value={outOf}
                  onChange={(e) => setOutOf(e.target.value)}
                  className="input-field"
                  placeholder="100"
                  min={1}
                  step={1}
                />
              </Field>
            </div>

            <Field label="Duration (min)">
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="input-field"
                min={0}
                step={1}
              />
            </Field>

            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
                placeholder="What did you study? What needs more work?"
                rows={3}
                style={{ resize: "vertical", minHeight: 80, padding: "11px 14px", lineHeight: 1.55 }}
              />
            </Field>

            <button type="submit" className="btn btn-accent btn-lg cta-shimmer">
              Save log
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader
            title="History"
            tagline={`${logs.length} ${logs.length === 1 ? "entry" : "entries"} total`}
          />
          {logs.length === 0 ? (
            <div className="empty-state" style={{ marginTop: 8 }}>
              <div className="empty-state-icon">!</div>
              <p className="empty-state-title">No logs yet</p>
              <p className="empty-state-msg">Add your first practice test on the left to start tracking.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 8 }}>
                <thead>
                  <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
                    <Th>When</Th>
                    <Th>Competition</Th>
                    <Th right>Score</Th>
                    <Th right>%</Th>
                    <Th right>Min</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => {
                    const c = getCompetition(l.competitionSlug);
                    const pct = l.score != null && l.outOf != null && l.outOf > 0
                      ? Math.round((l.score / l.outOf) * 100)
                      : null;
                    return (
                      <tr key={l.id} style={{ borderBottom: "0.5px solid var(--border)" }}>
                        <Td style={{ color: "var(--text3)", fontSize: 12 }}>
                          {new Date(l.loggedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </Td>
                        <Td>
                          {c ? (
                            <Link href={`/competitions/${c.slug}`} style={{ color: "var(--text)", fontWeight: 500 }}>
                              {c.name}
                            </Link>
                          ) : (
                            l.competitionSlug
                          )}
                        </Td>
                        <Td right mono>
                          {l.score != null && l.outOf != null ? `${l.score} / ${l.outOf}` : "-"}
                        </Td>
                        <Td right mono accent={pct != null && pct >= 80}>
                          {pct != null ? `${pct}%` : "-"}
                        </Td>
                        <Td right mono>{l.durationMin ?? "-"}</Td>
                        <Td right>
                          <button
                            type="button"
                            onClick={() => removePracticeLog(l.id)}
                            aria-label="Delete log"
                            className="mi-btn"
                            style={{
                              width: 24, height: 24, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
                              color: "var(--text3)",
                              transition: "color 0.15s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text3)")}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M3 6h18" />
                              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            </svg>
                          </button>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .tracker-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        className="font-mono"
        style={{
          display: "block",
          fontSize: 9,
          letterSpacing: "0.18em",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <th
      className="font-mono"
      style={{
        textAlign: right ? "right" : "left",
        fontSize: 9,
        letterSpacing: "0.14em",
        color: "var(--text-muted)",
        textTransform: "uppercase",
        fontWeight: 700,
        padding: "10px 12px",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  right,
  mono,
  accent,
  style,
}: {
  children?: React.ReactNode;
  right?: boolean;
  mono?: boolean;
  accent?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <td
      style={{
        textAlign: right ? "right" : "left",
        padding: "10px 12px",
        fontFamily: mono ? "var(--font-mono)" : "var(--font-body)",
        color: accent ? "var(--accent)" : "var(--text2)",
        fontWeight: accent ? 700 : 400,
        ...style,
      }}
    >
      {children}
    </td>
  );
}
