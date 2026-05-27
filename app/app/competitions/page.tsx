"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/Card";
import { getCompetition, FORMAT_LABEL } from "@/lib/competitions";
import {
  getRegistered,
  getPracticeLogs,
  unregisterCompetition,
  onStorageChange,
} from "@/lib/storage";

export default function MyCompetitions() {
  const [tick, setTick] = useState(0);
  useEffect(() => onStorageChange(() => setTick((t) => t + 1)), []);
  void tick;

  const registered = getRegistered();
  const logs = getPracticeLogs();

  const comps = registered
    .map((slug) => getCompetition(slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1240 }}>
      <div>
        <p className="eyebrow" style={{ marginBottom: 8 }}>Your registered events</p>
        <h1 style={{ fontSize: 28, letterSpacing: "-0.02em" }}>My competitions</h1>
      </div>

      <Card>
        <CardHeader
          title="Registered"
          tagline={`${comps.length} ${comps.length === 1 ? "event" : "events"} on your plate`}
          right={
            <Link href="/competitions" className="btn btn-accent btn-sm btn-pill cta-shimmer">
              Browse more
            </Link>
          }
        />

        {comps.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 8 }}>
            <div className="empty-state-icon">+</div>
            <p className="empty-state-title">No competitions registered</p>
            <p className="empty-state-msg">Add events you plan to compete in. We'll track your prep progress.</p>
            <Link href="/competitions" className="btn btn-accent btn-sm btn-pill" style={{ marginTop: 8 }}>
              Browse competitions
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            {comps.map((c) => {
              const compLogs = logs.filter((l) => l.competitionSlug === c.slug);
              const avgScore = compLogs.length
                ? Math.round(
                    (compLogs
                      .filter((l) => l.score != null && l.outOf != null)
                      .reduce((sum, l) => sum + (l.score! / l.outOf!) * 100, 0)) /
                      Math.max(1, compLogs.filter((l) => l.score != null && l.outOf != null).length)
                  )
                : null;
              return (
                <div
                  key={c.slug}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto auto auto",
                    gap: 14,
                    alignItems: "center",
                    padding: "14px 18px",
                    border: "0.5px solid var(--border)",
                    borderRadius: 12,
                    background: "var(--bg2)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <Link
                      href={`/competitions/${c.slug}`}
                      style={{
                        fontSize: 14.5,
                        fontWeight: 600,
                        color: "var(--text)",
                        transition: "color 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text)")}
                    >
                      {c.name}
                    </Link>
                    <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>
                      {c.category} · {FORMAT_LABEL[c.format]}
                    </p>
                  </div>

                  <div style={{ textAlign: "right", minWidth: 64 }}>
                    <p
                      className="font-mono"
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.14em",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                      }}
                    >
                      LOGS
                    </p>
                    <p className="font-mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
                      {compLogs.length}
                    </p>
                  </div>

                  <div style={{ textAlign: "right", minWidth: 64 }}>
                    <p
                      className="font-mono"
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.14em",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                      }}
                    >
                      AVG
                    </p>
                    <p
                      className="font-mono"
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: avgScore != null ? "var(--accent)" : "var(--text3)",
                      }}
                    >
                      {avgScore != null ? `${avgScore}%` : "—"}
                    </p>
                  </div>

                  <Link
                    href={`/competitions/${c.slug}`}
                    className="btn btn-ghost btn-sm"
                  >
                    Prep
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove ${c.name} from your registered events?`)) {
                        unregisterCompetition(c.slug);
                      }
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ color: "var(--red)" }}
                    aria-label={`Remove ${c.name}`}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
