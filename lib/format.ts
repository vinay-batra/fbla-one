// Shared formatting + small DOM helpers, de-duplicated from the dashboard,
// chapter page, and study plan (each had drifting private copies).

/** "just now" / "5 min ago" / "3h ago" / "2d ago" / "1w ago" / locale date. */
export function relativeTime(iso: string): string {
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
  // Explicit, unambiguous options (matches the rest of the app) so the fallback
  // isn't an all-numeric, locale-ambiguous date (6/8/2026 vs 08/06/2026).
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Sortable YYYY-MM-DD day key in a fixed US timezone (America/New_York) so day
 * boundaries are consistent across features (streaks, the public-chat daily cap)
 * regardless of the user's local timezone. FBLA is a US-national org.
 */
export function dayKeyET(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

/** Whole days from local midnight today to a YYYY-MM-DD date (negative = past). */
export function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/** Green / gold / red by score percentage. */
export function scoreColor(pct: number): string {
  return pct >= 80 ? "var(--green)" : pct >= 60 ? "var(--accent)" : "var(--red)";
}

/** Quote-escape a matrix of cells into a CSV string. */
export function toCsv(rows: string[][]): string {
  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

/** Trigger a browser download of CSV text. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
