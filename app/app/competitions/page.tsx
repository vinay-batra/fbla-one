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
  const [confirmRemove, setConfirmRemove] = useState<{ slug: string; name: string } | null>(null);

  const registered = getRegistered();
  const logs = getPracticeLogs();

  const comps = registered
    .map((slug) => getCompetition(slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1240 }}>
      <div>
        <p className="eyebrow" style={{ marginBottom: 8 }}>Your event</p>
        <h1 style={{ fontSize: 28, letterSpacing: "-0.02em" }}>My event</h1>
      </div>

      <Card>
        <CardHeader
          title="Your event"
          tagline={comps.length ? "The event you're competing in this year" : "Pick the one event you're competing in"}
          right={
            <Link href="/competitions" className="btn btn-accent btn-sm btn-pill cta-shimmer">
              {comps.length ? "Change event" : "Pick event"}
            </Link>
          }
        />

        {comps.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 8 }}>
            <div className="empty-state-icon">+</div>
            <p className="empty-state-title">No event picked yet</p>
            <p className="empty-state-msg">Choose the event you're competing in. We'll track your prep for it.</p>
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
                      .filter((l) => l.score != null && l.outOf != null && l.outOf > 0)
                      .reduce((sum, l) => sum + (l.score! / l.outOf!) * 100, 0)) /
                      Math.max(1, compLogs.filter((l) => l.score != null && l.outOf != null && l.outOf > 0).length)
                  )
                : null;
              return (
                <div
                  key={c.slug}
                  className="mycomp-row"
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
                      {avgScore != null ? `${avgScore}%` : "-"}
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
                    onClick={() => setConfirmRemove({ slug: c.slug, name: c.name })}
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
      <style>{`
        @media (max-width: 680px) {
          .mycomp-row { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* Styled remove confirmation (replaces the native browser confirm) */}
      {confirmRemove && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmRemove(null); }}
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div
            role="dialog" aria-modal="true" aria-labelledby="remove-title"
            style={{
              width: "min(400px, 100%)", background: "var(--card-bg)",
              border: "0.5px solid var(--border2)", borderRadius: 16,
              boxShadow: "var(--shadow-lg)", padding: "24px 24px 20px", animation: "fadeUp 0.18s ease",
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(var(--red-rgb),0.12)", border: "1px solid rgba(var(--red-rgb),0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              </svg>
            </div>
            <h2 id="remove-title" style={{ fontSize: 18, letterSpacing: "-0.01em", marginBottom: 6 }}>Remove this event?</h2>
            <p style={{ fontSize: 13.5, color: "var(--text3)", lineHeight: 1.6, marginBottom: 20 }}>
              <strong style={{ color: "var(--text2)" }}>{confirmRemove.name}</strong> will be removed from your registered events. Your practice history stays saved.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setConfirmRemove(null)} className="btn btn-ghost btn-pill btn-sm">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { unregisterCompetition(confirmRemove.slug); setConfirmRemove(null); }}
                className="btn btn-pill btn-sm"
                style={{ background: "var(--red)", color: "#fff" }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
