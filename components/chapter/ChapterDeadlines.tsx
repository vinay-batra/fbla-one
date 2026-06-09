"use client";

import { Card, CardHeader } from "@/components/Card";
import { addDeadline, removeDeadline, type Deadline } from "@/lib/storage";
import { getCompetition } from "@/lib/competitions";
import { daysUntil } from "@/lib/format";
import { formatDate } from "./chapterHelpers";
import type { ChapterController } from "./useChapterData";

// Deadline calendar: shared across the chapter when in one (advisor writes,
// members read), personal otherwise. Extracted from app/app/chapter/page.tsx
// (issue #47).

export function ChapterDeadlines({ c }: { c: ChapterController }) {
  const { deadlines, canManage, compOptions, deadlineTagline } = c;

  function submitDeadline(e: React.FormEvent) {
    e.preventDefault();
    if (!c.dlTitle.trim() || !c.dlDate) return;
    addDeadline({ title: c.dlTitle.trim(), dueAt: c.dlDate, competitionSlug: c.dlSlug || null, note: c.dlNote.trim() || null });
    c.setDlTitle(""); c.setDlDate(""); c.setDlSlug(""); c.setDlNote("");
    c.setShowDlForm(false);
  }

  return (
    <Card>
      <CardHeader
        eyebrow="Calendar"
        title="Deadlines"
        tagline={deadlineTagline}
        right={
          canManage ? (
            <button
              type="button"
              className="btn btn-accent btn-sm btn-pill"
              onClick={() => c.setShowDlForm((p) => !p)}
            >
              {c.showDlForm ? "Cancel" : "Add deadline"}
            </button>
          ) : undefined
        }
      />

      {c.showDlForm && canManage && (
        <form
          onSubmit={submitDeadline}
          className="dl-form-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginTop: 16,
            padding: 16,
            background: "var(--bg2)",
            borderRadius: 10,
            border: "0.5px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="font-mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Title *</label>
            <input type="text" value={c.dlTitle} onChange={(e) => c.setDlTitle(e.target.value)} placeholder="e.g. Accounting I sign-up due" className="input-field" required />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="font-mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Due date *</label>
            <input type="date" value={c.dlDate} onChange={(e) => c.setDlDate(e.target.value)} className="input-field" required />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="font-mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Competition (optional)</label>
            <select value={c.dlSlug} onChange={(e) => c.setDlSlug(e.target.value)} className="input-field">
              <option value="">No specific event</option>
              {compOptions.map((cmp) => (
                <option key={cmp.slug} value={cmp.slug}>{cmp.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="font-mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Note (optional)</label>
            <input type="text" value={c.dlNote} onChange={(e) => c.setDlNote(e.target.value)} placeholder="Any extra context..." className="input-field" />
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => c.setShowDlForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-accent btn-sm btn-pill">Add deadline</button>
          </div>
        </form>
      )}

      {deadlines.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 12 }}>
          <div className="empty-state-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <p className="empty-state-title">No deadlines yet</p>
          <p className="empty-state-msg">{canManage ? "Add your first deadline to start tracking sign-up dates and test days." : "Your advisor has not added any chapter deadlines yet."}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          {deadlines.map((dl: Deadline) => {
            const days = daysUntil(dl.dueAt);
            const isPast = days < 0;
            const isToday = days === 0;
            const comp = dl.competitionSlug ? getCompetition(dl.competitionSlug) : null;
            return (
              <div
                key={dl.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "14px 16px",
                  borderRadius: 10,
                  border: "0.5px solid var(--border)",
                  background: isPast ? "transparent" : "var(--bg2)",
                  opacity: isPast ? 0.55 : 1,
                }}
              >
                <div style={{ flexShrink: 0, textAlign: "center", minWidth: 52 }}>
                  <p className="font-mono" style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, color: isPast ? "var(--text3)" : "var(--text)" }}>
                    {dl.dueAt.split("-")[2]}
                  </p>
                  <p className="font-mono" style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 2 }}>
                    {formatDate(dl.dueAt).split(" ")[0]}
                  </p>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: isPast ? "var(--text3)" : "var(--text)" }}>{dl.title}</p>
                    {comp && <span className="chip chip-brand" style={{ fontSize: 10 }}>{comp.name}</span>}
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 10,
                        padding: "2px 7px",
                        borderRadius: 999,
                        background: isToday ? "rgba(var(--green-rgb), 0.12)" : isPast ? "rgba(90, 107, 138, 0.1)" : "var(--accent-dim)",
                        color: isToday ? "var(--green)" : isPast ? "var(--text-muted)" : "var(--accent)",
                        fontWeight: 700,
                      }}
                    >
                      {isToday ? "Today" : isPast ? `${Math.abs(days)}d ago` : `in ${days}d`}
                    </span>
                  </div>
                  {dl.note && <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>{dl.note}</p>}
                </div>

                {canManage && (
                  <button
                    type="button"
                    onClick={() => removeDeadline(dl.id)}
                    aria-label="Remove deadline"
                    style={{
                      flexShrink: 0, width: 28, height: 28, borderRadius: 6,
                      border: "0.5px solid var(--border)", background: "transparent",
                      color: "var(--text3)", display: "flex", alignItems: "center",
                      justifyContent: "center", cursor: "pointer",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
