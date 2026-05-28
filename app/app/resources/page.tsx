"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/Card";
import {
  getSavedResources,
  removeSavedResource,
  onStorageChange,
  type SavedResource,
} from "@/lib/storage";
import { getCompetition } from "@/lib/competitions";

const KIND_COLORS: Record<string, string> = {
  "FBLA Guide": "var(--brand)",
  "Course": "var(--green)",
  "Video": "var(--red)",
  "Practice": "var(--accent)",
  "Reference": "var(--text3)",
  "Article": "var(--text3)",
  "Book": "var(--text3)",
};

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function ResourcesPage() {
  const [tick, setTick] = useState(0);
  useEffect(() => onStorageChange(() => setTick((t) => t + 1)), []);
  void tick;

  const [filter, setFilter] = useState<string>("all");

  const all = getSavedResources();

  // Group by competition
  const slugs = Array.from(
    new Set(all.map((r) => r.competitionSlug ?? "__none__"))
  );

  const filtered =
    filter === "all"
      ? all
      : filter === "__none__"
      ? all.filter((r) => !r.competitionSlug)
      : all.filter((r) => r.competitionSlug === filter);

  const filterOptions = [
    { value: "all", label: `All (${all.length})` },
    ...slugs
      .filter((s) => s !== "__none__")
      .map((s) => {
        const comp = getCompetition(s);
        const count = all.filter((r) => r.competitionSlug === s).length;
        return { value: s, label: `${comp?.name ?? s} (${count})` };
      }),
    ...(all.some((r) => !r.competitionSlug)
      ? [{ value: "__none__", label: `General (${all.filter((r) => !r.competitionSlug).length})` }]
      : []),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900 }}>
      {/* Header */}
      <div>
        <p className="eyebrow" style={{ marginBottom: 8 }}>Library</p>
        <h1 style={{ fontSize: 28, letterSpacing: "-0.02em" }}>Saved resources</h1>
        <p style={{ fontSize: 14, color: "var(--text3)", marginTop: 6 }}>
          Everything you have bookmarked across all competition pages.
        </p>
      </div>

      {all.length === 0 ? (
        <Card>
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="empty-state-title">No saved resources yet</p>
            <p className="empty-state-msg">
              Browse competition pages and click the bookmark icon next to any study resource to save it here.
            </p>
            <Link href="/competitions" className="btn btn-accent btn-sm btn-pill" style={{ marginTop: 8 }}>
              Browse competitions
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {/* Filter bar */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilter(opt.value)}
                style={{
                  padding: "6px 13px",
                  borderRadius: 999,
                  border: filter === opt.value ? "1.5px solid var(--accent)" : "0.5px solid var(--border)",
                  background: filter === opt.value ? "var(--accent-dim)" : "transparent",
                  color: filter === opt.value ? "var(--accent)" : "var(--text2)",
                  fontSize: 12,
                  fontWeight: filter === opt.value ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Resource list */}
          <Card>
            <CardHeader
              eyebrow="Bookmarks"
              title={filter === "all" ? `${all.length} saved` : filterOptions.find(o => o.value === filter)?.label ?? ""}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 14 }}>
              {filtered.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--text3)", padding: "8px 0" }}>No resources in this category.</p>
              ) : (
                filtered.map((r: SavedResource) => {
                  const comp = r.competitionSlug ? getCompetition(r.competitionSlug) : null;
                  return (
                    <div
                      key={r.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 10px",
                        borderRadius: 8,
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg2)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      {/* Link icon */}
                      <div style={{ flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <path d="M15 3h6v6" />
                          <path d="M10 14L21 3" />
                        </svg>
                      </div>

                      {/* Main info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", textDecoration: "none" }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text)"; }}
                        >
                          {r.title}
                        </a>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, color: "var(--text3)" }}>{hostOf(r.url)}</span>
                          {comp && (
                            <Link
                              href={`/competitions/${comp.slug}`}
                              className="chip chip-brand"
                              style={{ fontSize: 10, padding: "2px 8px", textDecoration: "none" }}
                            >
                              {comp.name}
                            </Link>
                          )}
                          {r.note && (
                            <span style={{ fontSize: 11, color: "var(--text3)", fontStyle: "italic" }}>{r.note}</span>
                          )}
                        </div>
                      </div>

                      {/* Date */}
                      <span className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0 }}>
                        {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeSavedResource(r.id)}
                        aria-label="Remove resource"
                        style={{
                          flexShrink: 0, width: 26, height: 26, borderRadius: 6,
                          border: "0.5px solid var(--border)", background: "transparent",
                          color: "var(--text3)", display: "flex", alignItems: "center",
                          justifyContent: "center", cursor: "pointer",
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <p style={{ fontSize: 12, color: "var(--text3)" }}>
            Find more resources on any{" "}
            <Link href="/competitions" style={{ color: "var(--accent)" }}>competition page</Link>.
          </p>
        </>
      )}
    </div>
  );
}
