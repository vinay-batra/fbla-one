"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ScrollReveal } from "@/components/ScrollReveal";
import { HeroBadge } from "@/components/HeroBadge";
import { Card } from "@/components/Card";
import {
  COMPETITIONS,
  CATEGORIES,
  FORMAT_LABEL,
  COMPETITION_STATS,
  type Competition,
  type CompetitionCategory,
} from "@/lib/competitions";

type Status = "all" | "complete" | "partial" | "coming-soon";

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
  const [status, setStatus] = useState<Status>("all");

  const filtered = useMemo(() => {
    let out: Competition[] = COMPETITIONS;
    if (category !== "all") out = out.filter((c) => c.category === category);
    if (status !== "all") out = out.filter((c) => c.contentStatus === status);
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
  }, [category, status, query]);

  return (
    <>
      {/* HERO */}
      <section style={{ padding: "80px 0 40px" }}>
        <div className="container" style={{ maxWidth: 900, marginInline: "auto", textAlign: "center" }}>
          <HeroBadge>{COMPETITION_STATS.total} events tracked</HeroBadge>
          <h1 style={{ marginTop: 20 }}>
            Every FBLA event,{" "}
            <span style={{ color: "var(--accent)" }}>one click away.</span>
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
            Browse competitions by category, format, or content depth. Each event has its own prep
            page with test topics, study resources, and the official rubric.
          </p>
        </div>
      </section>

      {/* FILTER BAR */}
      <section
        style={{
          position: "sticky",
          top: 64,
          zIndex: 40,
          background: "var(--nav-bg)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderTop: "0.5px solid var(--border)",
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

          {/* Status */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="input-field"
            style={{ height: 40, width: "auto" }}
            aria-label="Filter by content status"
          >
            <option value="all">Any content</option>
            <option value="complete">Full guides</option>
            <option value="partial">Partial</option>
            <option value="coming-soon">Coming soon</option>
          </select>

          <div
            className="font-mono"
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
                  setStatus("all");
                }}
                className="btn btn-ghost btn-sm btn-pill"
                style={{ marginTop: 8 }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div
              className="comp-list-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 16,
              }}
            >
              {filtered.map((c, i) => (
                <ScrollReveal key={c.slug} delay={Math.min(i * 0.02, 0.3)}>
                  <CompetitionCard c={c} />
                </ScrollReveal>
              ))}
            </div>
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
  const isSoon = c.contentStatus === "coming-soon";
  return (
    <Link href={`/competitions/${c.slug}`} style={{ textDecoration: "none" }}>
      <Card
        variant="hover"
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          opacity: isSoon ? 0.75 : 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
          <span className="chip chip-brand">{c.category}</span>
          {c.popular && <span className="chip chip-accent">Popular</span>}
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 8 }}>
          {c.name}
        </h3>
        <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6, flex: 1 }}>
          {c.description}
        </p>
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
          <span className="chip">{FORMAT_LABEL[c.format]}</span>
          {isSoon ? (
            <span className="chip">Coming soon</span>
          ) : (
            <span style={{ color: "var(--accent)", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
              Prep page
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
