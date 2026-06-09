"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toCsv, downloadCsv } from "@/lib/format";

type Signup = { id: string; email: string; source: string | null; created_at: string };
type State = "loading" | "ok" | "forbidden" | "error";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminSignupsPage() {
  const [state, setState] = useState<State>("loading");
  const [signups, setSignups] = useState<Signup[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/signups")
      .then(async (r) => {
        if (!alive) return;
        if (r.status === 403) { setState("forbidden"); return; }
        if (!r.ok) { setState("error"); return; }
        const j = await r.json();
        setSignups(Array.isArray(j.signups) ? j.signups : []);
        setState("ok");
      })
      .catch(() => { if (alive) setState("error"); });
    return () => { alive = false; };
  }, []);

  const exportCsv = () => {
    const rows = [
      ["Email", "Source", "Signed up"],
      ...signups.map((s) => [s.email, s.source ?? "", s.created_at]),
    ];
    downloadCsv(`fbla-one-email-signups-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
  };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <p className="eyebrow">Admin</p>
      <h1 style={{ fontSize: 28, marginTop: 6, marginBottom: 6 }}>Email signups</h1>
      <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 24, lineHeight: 1.6 }}>
        Everyone who entered their email in the landing-page capture. Read-only and owner-only.
      </p>

      {state === "loading" && (
        <p style={{ fontSize: 14, color: "var(--text3)" }}>Loading...</p>
      )}

      {state === "forbidden" && (
        <div className="empty-state">
          <p className="empty-state-title">Not authorized</p>
          <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 6 }}>
            This page is restricted to the site owner. <Link href="/app" style={{ color: "var(--accent-text)" }}>Back to dashboard</Link>
          </p>
        </div>
      )}

      {state === "error" && (
        <div role="alert" className="empty-state">
          <p className="empty-state-title">Could not load signups</p>
          <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 6 }}>Please refresh and try again.</p>
        </div>
      )}

      {state === "ok" && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
            <span className="font-mono" style={{ fontSize: 13, color: "var(--text2)" }}>
              {signups.length} {signups.length === 1 ? "signup" : "signups"}
            </span>
            {signups.length > 0 && (
              <button type="button" onClick={exportCsv} className="btn btn-ghost btn-sm" style={{ gap: 6, display: "flex", alignItems: "center" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="M7 10l5 5 5-5" />
                  <path d="M12 15V3" />
                </svg>
                Export CSV
              </button>
            )}
          </div>

          {signups.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-title">No signups yet</p>
              <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 6 }}>
                Emails captured on the landing page will appear here.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto", border: "0.5px solid var(--border)", borderRadius: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={th}>Email</th>
                    <th style={th}>Source</th>
                    <th style={th}>Signed up</th>
                  </tr>
                </thead>
                <tbody>
                  {signups.map((s) => (
                    <tr key={s.id}>
                      <td style={td}>{s.email}</td>
                      <td style={{ ...td, color: "var(--text3)" }}>{s.source || "-"}</td>
                      <td style={{ ...td, color: "var(--text3)", whiteSpace: "nowrap" }}>{fmtDate(s.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 14px",
  fontSize: 9,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  borderBottom: "0.5px solid var(--border)",
  fontWeight: 700,
  background: "var(--bg2)",
};

const td: React.CSSProperties = {
  padding: "11px 14px",
  color: "var(--text)",
  borderBottom: "0.5px solid var(--border-dim)",
};
