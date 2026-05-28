"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/Card";
import { HeroBadge } from "@/components/HeroBadge";
import {
  getChapterName,
  setChapterName,
  onStorageChange,
  getDeadlines,
  addDeadline,
  removeDeadline,
  getRegistered,
  type Deadline,
} from "@/lib/storage";
import { getCompetition } from "@/lib/competitions";

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m - 1]} ${d}, ${y}`;
}

function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ChapterPage() {
  const [tick, setTick] = useState(0);
  useEffect(() => onStorageChange(() => setTick((t) => t + 1)), []);
  void tick;

  // Chapter name
  const chapter = getChapterName();
  const [chapterDraft, setChapterDraft] = useState(chapter);
  useEffect(() => setChapterDraft(chapter), [chapter]);

  // Deadline form
  const [showForm, setShowForm] = useState(false);
  const [dlTitle, setDlTitle] = useState("");
  const [dlDate, setDlDate] = useState("");
  const [dlSlug, setDlSlug] = useState("");
  const [dlNote, setDlNote] = useState("");

  const deadlines = getDeadlines().sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const registered = getRegistered();

  function submitDeadline(e: React.FormEvent) {
    e.preventDefault();
    if (!dlTitle.trim() || !dlDate) return;
    addDeadline({
      title: dlTitle.trim(),
      dueAt: dlDate,
      competitionSlug: dlSlug || null,
      note: dlNote.trim() || null,
    });
    setDlTitle("");
    setDlDate("");
    setDlSlug("");
    setDlNote("");
    setShowForm(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1240 }}>
      {/* Header */}
      <div>
        <p className="eyebrow" style={{ marginBottom: 8 }}>Chapter</p>
        <h1 style={{ fontSize: 28, letterSpacing: "-0.02em" }}>{chapter || "Set up your chapter"}</h1>
        <p style={{ fontSize: 14, color: "var(--text3)", marginTop: 6 }}>
          Manage your chapter info, track competition deadlines, and see your registered events.
        </p>
      </div>

      {/* Chapter name */}
      <Card>
        <CardHeader eyebrow="Your chapter" title="Chapter info" />
        <form
          onSubmit={(e) => { e.preventDefault(); setChapterName(chapterDraft.trim()); }}
          style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 6 }}
        >
          <label className="font-mono" style={{ display: "block", fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
            Chapter name
          </label>
          <input
            type="text"
            value={chapterDraft}
            onChange={(e) => setChapterDraft(e.target.value)}
            placeholder="e.g. Council Rock South FBLA"
            className="input-field"
          />
          <button type="submit" className="btn btn-accent btn-sm btn-pill" style={{ alignSelf: "flex-start" }}>
            Save chapter
          </button>
        </form>
      </Card>

      {/* Deadlines */}
      <Card>
        <CardHeader
          eyebrow="Calendar"
          title="Deadlines"
          tagline="Track sign-up dates, test days, and submission windows."
          right={
            <button
              type="button"
              className="btn btn-accent btn-sm btn-pill"
              onClick={() => setShowForm((p) => !p)}
            >
              {showForm ? "Cancel" : "Add deadline"}
            </button>
          }
        />

        {showForm && (
          <form
            onSubmit={submitDeadline}
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
              <label className="font-mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Title *
              </label>
              <input
                type="text"
                value={dlTitle}
                onChange={(e) => setDlTitle(e.target.value)}
                placeholder="e.g. Accounting I sign-up due"
                className="input-field"
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="font-mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Due date *
              </label>
              <input
                type="date"
                value={dlDate}
                onChange={(e) => setDlDate(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="font-mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Competition (optional)
              </label>
              <select
                value={dlSlug}
                onChange={(e) => setDlSlug(e.target.value)}
                className="input-field"
              >
                <option value="">No specific event</option>
                {registered.map((slug) => {
                  const comp = getCompetition(slug);
                  return (
                    <option key={slug} value={slug}>
                      {comp?.name ?? slug}
                    </option>
                  );
                })}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="font-mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Note (optional)
              </label>
              <input
                type="text"
                value={dlNote}
                onChange={(e) => setDlNote(e.target.value)}
                placeholder="Any extra context..."
                className="input-field"
              />
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
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
            <p className="empty-state-msg">Add your first deadline to start tracking sign-up dates and test days.</p>
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
                  {/* Date block */}
                  <div style={{ flexShrink: 0, textAlign: "center", minWidth: 52 }}>
                    <p className="font-mono" style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, color: isPast ? "var(--text3)" : "var(--text)" }}>
                      {dl.dueAt.split("-")[2]}
                    </p>
                    <p className="font-mono" style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 2 }}>
                      {formatDate(dl.dueAt).split(" ")[0]}
                    </p>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: isPast ? "var(--text3)" : "var(--text)" }}>
                        {dl.title}
                      </p>
                      {comp && <span className="chip chip-brand" style={{ fontSize: 10 }}>{comp.name}</span>}
                      <span
                        className="font-mono"
                        style={{
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 999,
                          background: isToday
                            ? "rgba(var(--green-rgb), 0.12)"
                            : isPast
                            ? "rgba(var(--text-muted-rgb, 90, 107, 138), 0.1)"
                            : "var(--accent-dim)",
                          color: isToday ? "var(--green)" : isPast ? "var(--text-muted)" : "var(--accent)",
                          fontWeight: 700,
                        }}
                      >
                        {isToday ? "Today" : isPast ? `${Math.abs(days)}d ago` : `in ${days}d`}
                      </span>
                    </div>
                    {dl.note && (
                      <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>{dl.note}</p>
                    )}
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removeDeadline(dl.id)}
                    aria-label="Remove deadline"
                    style={{
                      flexShrink: 0,
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: "0.5px solid var(--border)",
                      background: "transparent",
                      color: "var(--text3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* My events */}
      <Card>
        <CardHeader
          eyebrow="Registered"
          title="My events"
          tagline="Events you have added to your competition queue."
          right={
            <Link href="/competitions" className="btn btn-ghost btn-sm">
              Browse all
            </Link>
          }
        />
        {registered.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 8 }}>
            No events yet.{" "}
            <Link href="/competitions" style={{ color: "var(--accent)" }}>
              Browse competitions
            </Link>{" "}
            to add some.
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {registered.map((slug) => {
              const comp = getCompetition(slug);
              return (
                <Link
                  key={slug}
                  href={`/competitions/${slug}`}
                  className="chip chip-brand"
                  style={{ textDecoration: "none", fontSize: 12, padding: "5px 12px", borderRadius: 999 }}
                >
                  {comp?.name ?? slug}
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      {/* Advisor features coming soon */}
      <Card variant="accent">
        <HeroBadge>Coming soon - free for every chapter</HeroBadge>
        <h2 style={{ fontSize: 20, marginTop: 12, marginBottom: 12, letterSpacing: "-0.02em" }}>
          Full advisor dashboard on the way.
        </h2>
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
          {["Advisor view - see all member sign-ups across every event", "Member roster with officer and member roles", "Export rosters for regional registration"].map((line) => (
            <li key={line} style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--text2)", lineHeight: 1.55 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M5 12l5 5L20 7" />
              </svg>
              {line}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
