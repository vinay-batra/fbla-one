"use client";

import { useEffect, useState } from "react";
import {
  getMilestones,
  setMilestone,
  getPracticeLogs,
  onStorageChange,
  type MilestoneLevel,
} from "@/lib/storage";
import { daysUntil } from "@/lib/format";

const STAGES: { level: MilestoneLevel; label: string; note: string }[] = [
  { level: "regionals", label: "Regionals", note: "Qualify here" },
  { level: "states", label: "States", note: "Place to advance" },
  { level: "nationals", label: "Nationals", note: "The goal" },
];

function fmt(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m - 1]} ${d}`;
}

export function StudyPlan() {
  const [tick, setTick] = useState(0);
  useEffect(() => onStorageChange(() => setTick((t) => t + 1)), []);
  void tick;

  const milestones = getMilestones();
  const logs = getPracticeLogs();
  const weekAgo = Date.now() - 7 * 86400000;
  const logsThisWeek = logs.filter((l) => new Date(l.loggedAt).getTime() >= weekAgo).length;

  // Next upcoming stage = soonest milestone still in the future.
  const upcoming = STAGES
    .map((s) => ({ ...s, iso: milestones[s.level] }))
    .filter((s) => s.iso && daysUntil(s.iso) >= 0)
    .sort((a, b) => (a.iso! < b.iso! ? -1 : 1))[0];

  const anySet = STAGES.some((s) => milestones[s.level]);
  const days = upcoming ? daysUntil(upcoming.iso!) : null;
  // Ramp the suggested cadence as the next competition approaches.
  const targetPerWeek = days != null && days <= 14 ? 5 : 3;
  const onTrack = logsThisWeek >= targetPerWeek;

  return (
    <div style={{ position: "relative", background: "var(--card-bg)", border: "0.5px solid var(--accent-border)", borderRadius: 16, padding: "22px 24px", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 100% 0%, rgba(var(--accent-rgb),0.10) 0%, transparent 55%)", pointerEvents: "none" }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 6 }}>Road to Nationals</p>
            {upcoming ? (
              <h2 style={{ fontSize: 24, letterSpacing: "-0.02em" }}>
                <span style={{ color: "var(--accent)" }}>{days}</span> {days === 1 ? "day" : "days"} to {upcoming.label}
              </h2>
            ) : (
              <h2 style={{ fontSize: 22, letterSpacing: "-0.02em" }}>{anySet ? "Set your next date" : "Plan your season"}</h2>
            )}
            <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 4, lineHeight: 1.5 }}>
              {upcoming
                ? `Then it is on to ${STAGES[STAGES.findIndex((s) => s.level === upcoming.level) + 1]?.label ?? "Nationals"}. Keep the streak going.`
                : "Add your competition dates below. The goal is Nationals."}
            </p>
          </div>
          {upcoming && (
            <div style={{ textAlign: "right" }}>
              <p className="font-mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>This week</p>
              <p className="font-mono" style={{ fontSize: 22, fontWeight: 700, color: onTrack ? "var(--green)" : "var(--accent)", lineHeight: 1.1, marginTop: 2 }}>{logsThisWeek}<span style={{ fontSize: 14, color: "var(--text3)" }}>/{targetPerWeek}</span></p>
              <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{onTrack ? "on pace" : "tests to stay ready"}</p>
            </div>
          )}
        </div>

        {/* Stage stepper with inline date pickers */}
        <div className="sp-stages" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 20 }}>
          {STAGES.map((s, i) => {
            const iso = milestones[s.level];
            const passed = iso ? daysUntil(iso) < 0 : false;
            const isNext = upcoming?.level === s.level;
            return (
              <div key={s.level} style={{
                padding: "12px 14px", borderRadius: 12,
                border: isNext ? "1px solid var(--accent)" : "0.5px solid var(--border)",
                background: isNext ? "var(--accent-dim)" : "var(--bg2)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)", background: passed ? "var(--green)" : isNext ? "var(--accent)" : "var(--bg3)", color: passed || isNext ? "#0a1322" : "var(--text3)" }}>
                    {passed ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0a1322" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{s.label}</span>
                </div>
                <input
                  type="date"
                  value={iso ?? ""}
                  onChange={(e) => setMilestone(s.level, e.target.value || null)}
                  className="input-field"
                  style={{ width: "100%", fontSize: 12, padding: "6px 8px", colorScheme: "dark" }}
                  aria-label={`${s.label} date`}
                />
                <p style={{ fontSize: 10.5, color: "var(--text3)", marginTop: 6 }}>{iso ? (passed ? "Done" : `${fmt(iso)} · ${daysUntil(iso)}d`) : s.note}</p>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`@media (max-width:560px){ .sp-stages { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
