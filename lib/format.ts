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
  return date.toLocaleDateString();
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
