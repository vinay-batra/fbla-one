"use client";

// Shared helpers, constants, and small presentational primitives for the
// Chapter page module. Extracted verbatim from the former monolithic
// app/app/chapter/page.tsx (issue #47) - no behavior change.

import { getCompetition, COMPETITIONS, FORMAT_LABEL } from "@/lib/competitions";
import { toCsv, downloadCsv } from "@/lib/format";
import type { MemberRow } from "@/lib/chapter";

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m - 1]} ${d}, ${y}`;
}

export function memberName(m: MemberRow): string {
  return m.display_name?.trim() || m.email?.split("@")[0] || "Anonymous";
}

export function exportSignupsCSV(members: MemberRow[], chapterName: string) {
  const headers = ["Member Name", "Email", "Competition", "Category", "Format"];
  const rows: string[][] = [];
  for (const m of members) {
    for (const slug of m.registrations) {
      const comp = getCompetition(slug);
      rows.push([
        memberName(m),
        m.email ?? "",
        comp?.name ?? slug,
        comp?.category ?? "",
        comp ? FORMAT_LABEL[comp.format] : "",
      ]);
    }
  }
  if (rows.length === 0) {
    for (const m of members) rows.push([memberName(m), m.email ?? "", "", "", ""]);
  }
  const csv = toCsv([headers, ...rows]);
  downloadCsv(`${chapterName.replace(/\s+/g, "-").toLowerCase()}-signups-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}

export function exportRosterCSV(members: MemberRow[], chapterName: string) {
  const headers = ["Name", "Email", "Role", "Events Count", "Registered Events"];
  const rows = members.map((m) => [
    memberName(m),
    m.email ?? "",
    m.role,
    String(m.registrations.length),
    m.registrations.map((slug) => getCompetition(slug)?.name ?? slug).join("; "),
  ]);
  const csv = toCsv([headers, ...rows]);
  downloadCsv(`${chapterName.replace(/\s+/g, "-").toLowerCase()}-roster-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}

export function roleBadgeStyle(role: string): React.CSSProperties {
  if (role === "advisor") return { background: "var(--accent-dim)", color: "var(--accent-text)" };
  if (role === "officer") return { background: "var(--brand-dim)", color: "var(--brand)" };
  return { background: "var(--bg3)", color: "var(--text3)" };
}

export const LB_TH: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 12px",
  fontSize: 9,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  borderBottom: "0.5px solid var(--border)",
  fontWeight: 700,
};

export const LB_TD: React.CSSProperties = { padding: "10px 12px", verticalAlign: "top" };

// Derived once at module load: full event option list + name-sorted list, so we
// don't rebuild/sort all 55 events on every render tick.
export const ALL_COMP_OPTIONS: { slug: string; name: string }[] = COMPETITIONS.map((c) => ({ slug: c.slug, name: c.name }));
export const SORTED_COMPETITIONS = [...COMPETITIONS].sort((a, b) => a.name.localeCompare(b.name));

export function MiniStat({ label, value, sub, small }: { label: string; value: string; sub?: string; small?: boolean }) {
  return (
    <div style={{ padding: "14px 14px", borderRadius: 10, border: "0.5px solid var(--border)", background: "var(--bg2)" }}>
      <p className="font-mono" style={{ fontSize: 9, letterSpacing: "0.16em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
        {label}
      </p>
      <p className="font-mono" style={{ fontSize: small ? 14 : 22, fontWeight: 700, color: "var(--text)", marginTop: 8, lineHeight: 1.15, wordBreak: "break-word" }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 10, color: "var(--text3)", marginTop: 3 }}>{sub}</p>}
    </div>
  );
}
