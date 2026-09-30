"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ScrollReveal } from "@/components/ScrollReveal";
import { HeroBadge } from "@/components/HeroBadge";
import { Card } from "@/components/Card";
import { PenUnderline } from "@/components/PenUnderline";
import {
  COMPETITIONS,
  CATEGORIES,
  FORMAT_LABEL,
  type CompetitionFormat,
  COMPETITION_STATS,
  type Competition,
  type CompetitionCategory,
} from "@/lib/competitions";

type FormatFilter = "all" | CompetitionFormat;

export default function CompetitionsListPage() {
  return (
    <Suspense fallback={null}>
      <CompetitionsList />
    </Suspense>
  );
}

function CompetitionsList() {
  const sp = useSearchParams();
  const initialCategory = (sp.get("category") as CompetitionCategory) || "all";

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CompetitionCategory | "all">(initialCategory);
  const [format, setFormat] = useState<FormatFilter>("all");

  const filtered = useMemo(() => {
    let out: Competition[] = COMPETITIONS;
    if (category !== "all") out = out.filter((c) => c.category === category);
    if (format !== "all") out = out.filter((c) => c.format === format);
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          (c.topics ?? []).some((t) => t.toLowerCase().includes(q))
      );
    }
    // sort: popular first, then alphabetical
    return [...out].sort((a, b) => {
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [category, format, query]);

  return (
    <>
      {/* HERO */}
      <section style={{ padding: "80px 0 40px" }}>
        <div className="container" style={{ maxWidth: 900, marginInline: "auto", textAlign: "center" }}>
          <HeroBadge>{COMPETITION_STATS.total} events tracked</HeroBadge>
          <h1 style={{ marginTop: 20 }}>
            {COMPETITION_STATS.total} events.{" "}
            <PenUnderline>Find yours.</PenUnderline>
          </h1>
          <p
            style={{
              marginTop: 18,
              fontSize: 16,
              color: "var(--text2)",
              maxWidth: 640,
              marginInline: "auto",
              lineHeight: 1.6,
            }}
          >
            Filter by category or by how the event is judged: a test, a role play, or a presentation. Each event has its own prep
            page with test topics, study resources, and a link to the official FBLA event guidelines.
          </p>
        </div>
      </section>

      {/* FILTER BAR - sticks flush to the very top with an opaque background.
          (Was top:64 + translucent: when the nav hides on scroll, that left a
          64px gap above the bar where the scrolling grid showed through.) */}
      <section
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "var(--bg)",
          borderBottom: "0.5px solid var(--border)",
          padding: "16px 0",
        }}
      >
        <div className="container" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {/* Search */}
          <div
            style={{
              position: "relative",
              flex: "1 1 240px",
              maxWidth: 380,
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text3)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: "absolute", left: 14, pointerEvents: "none" }}
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="search"
              aria-label="Search competitions"
              placeholder="Search competitions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 40, height: 40 }}
            />
          </div>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CompetitionCategory | "all")}
            className="input-field"
            style={{ height: 40, width: "auto", maxWidth: 240 }}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Format: the first thing a student needs to know about an event */}
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as FormatFilter)}
            className="input-field"
            style={{ height: 40, width: "auto" }}
            aria-label="Filter by event format"
          >
            <option value="all">Any format</option>
            {(Object.keys(FORMAT_LABEL) as CompetitionFormat[])
              .filter((f) => COMPETITIONS.some((c) => c.format === f))
              .map((f) => (
                <option key={f} value={f}>
                  {FORMAT_LABEL[f]}
                </option>
              ))}
          </select>

          <div
            className="font-mono"
            aria-live="polite"
            style={{
              marginLeft: "auto",
              fontSize: 11,
              letterSpacing: "0.14em",
              color: "var(--text3)",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            {filtered.length} of {COMPETITIONS.length}
          </div>
        </div>
      </section>

      {/* GRID */}
      <section style={{ padding: "40px 0 100px" }}>
        <div className="container">
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ marginTop: 40 }}>
              <div className="empty-state-icon">?</div>
              <p className="empty-state-title">No competitions match</p>
              <p className="empty-state-msg">
                Try clearing the search or selecting a different category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                  setFormat("all");
                }}
                className="btn btn-ghost btn-sm btn-pill"
                style={{ marginTop: 8 }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            /* One reveal for the whole grid, not one per card. Wrapping each of
               the 76 cards meant 76 IntersectionObservers, a wall of blank
               space when scrolling quickly, and a re-triggered fade on every
               search keystroke as newly-matched cards mounted hidden. */
            <ScrollReveal>
              <div
                className="comp-list-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 16,
                }}
              >
                {filtered.map((c) => (
                  <CompetitionCard key={c.slug} c={c} />
                ))}
              </div>
            </ScrollReveal>
          )}
        </div>

        <style>{`
          @media (max-width: 900px) {
            .comp-list-grid { grid-template-columns: 1fr 1fr !important; }
          }
          @media (max-width: 600px) {
            .comp-list-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>
    </>
  );
}

function CompetitionCard({ c }: { c: Competition }) {
  return (
    <Link href={`/competitions/${c.slug}`} style={{ textDecoration: "none" }}>
      <Card variant="hover" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Format leads: whether it is a test, a role play or a presentation is
            the first thing a student picks an event by. */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          <span className="chip chip-format">{FORMAT_LABEL[c.format]}</span>
          <span className="chip">{c.isTeam ? "Team" : "Individual"}</span>
          {c.popular && <span className="chip chip-brand" style={{ marginLeft: "auto" }}>Popular</span>}
        </div>
        <h2 style={{ fontSize: 19, fontWeight: 500, marginBottom: 8 }}>{c.name}</h2>
        <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6, flex: 1 }}>{c.description}</p>
        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            paddingTop: 14,
            borderTop: "0.5px solid var(--border)",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--text3)" }}>{c.category}</span>
          <span style={{ color: "var(--accent)", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
            Prep page
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </Card>
    </Link>
  );
}
