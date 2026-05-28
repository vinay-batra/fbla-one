"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUpcomingDeadlines, onStorageChange } from "@/lib/storage";
import { getCompetition } from "@/lib/competitions";

const DISMISSED_KEY = "fbla_dismissed_deadline_alerts";

function getDismissedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return new Set(JSON.parse(raw ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function persistDismiss(id: string) {
  const ids = getDismissedIds();
  ids.add(id);
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
  } catch {}
}

export function DeadlineAlert() {
  const [tick, setTick] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDismissed(getDismissedIds());
    return onStorageChange(() => setTick((t) => t + 1));
  }, []);

  void tick;

  const alerts = getUpcomingDeadlines(10).filter((dl) => {
    if (dismissed.has(dl.id)) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dl.dueAt + "T00:00:00");
    const days = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days <= 3;
  });

  if (alerts.length === 0) return null;

  function dismiss(id: string) {
    persistDismiss(id);
    setDismissed(getDismissedIds());
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
      {alerts.map((dl) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(dl.dueAt + "T00:00:00");
        const days = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const isToday = days === 0;
        const color = isToday ? "var(--red)" : "var(--accent)";
        const bg = isToday ? "rgba(var(--red-rgb), 0.08)" : "var(--accent-dim)";
        const borderColor = isToday ? "rgba(var(--red-rgb), 0.4)" : "var(--accent-border)";
        const comp = dl.competitionSlug ? getCompetition(dl.competitionSlug) : null;

        return (
          <div
            key={dl.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 16px",
              borderRadius: 10,
              background: bg,
              border: `0.5px solid ${borderColor}`,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>

            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{dl.title}</span>
              {comp && (
                <span style={{ fontSize: 12, color: "var(--text3)", marginLeft: 6 }}>
                  {comp.name}
                </span>
              )}
            </div>

            <span
              className="font-mono"
              style={{ fontSize: 10, fontWeight: 700, color, flexShrink: 0 }}
            >
              {isToday ? "TODAY" : `${days}d left`}
            </span>

            <Link
              href="/app/chapter"
              style={{ fontSize: 11, color: "var(--text3)", flexShrink: 0 }}
            >
              View
            </Link>

            <button
              type="button"
              onClick={() => dismiss(dl.id)}
              aria-label="Dismiss"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: 2,
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
