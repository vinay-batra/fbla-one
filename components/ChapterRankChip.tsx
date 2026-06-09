"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { getLeaderboardCached } from "@/lib/leaderboard-cache";

/**
 * Compact "you're #X of Y in your chapter" nudge for the dashboard. Renders
 * nothing for users who aren't in a chapter (the RPC returns no rows).
 */
export function ChapterRankChip() {
  const [info, setInfo] = useState<{ rank: number; total: number } | null>(null);

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) return;
    let cancelled = false;
    // getSession() reads the stored session (no network round-trip), and the
    // cached leaderboard is shared with the chapter page so the RPC fires once.
    Promise.all([supa.auth.getSession(), getLeaderboardCached()]).then(([{ data }, lb]) => {
      const uid = data.session?.user?.id;
      if (cancelled || !uid || lb.length < 2) return; // need at least 2 to be a "leaderboard"
      const idx = lb.findIndex((r) => r.userId === uid);
      if (idx < 0) return;
      setInfo({ rank: idx + 1, total: lb.length });
    });
    return () => { cancelled = true; };
  }, []);

  if (!info) return null;
  const top = info.rank === 1;

  return (
    <Link
      href="/app/chapter"
      style={{
        display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
        background: "var(--card-bg)", border: "0.5px solid var(--border)", borderRadius: 14,
        textDecoration: "none", transition: "border-color 0.15s, background 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-border)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent-dim)", border: "0.5px solid var(--accent-border)" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="font-mono" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Chapter rank</p>
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginTop: 2 }}>
          #{info.rank} <span style={{ color: "var(--text3)", fontWeight: 400 }}>of {info.total}</span>
          <span style={{ color: "var(--text3)", fontWeight: 400, fontSize: 13 }}> · {top ? "leading your chapter" : "keep climbing"}</span>
        </p>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}
