import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SectionHeader } from "@/components/SectionHeader";
import { HeroBadge } from "@/components/HeroBadge";
import { Card } from "@/components/Card";
import {
  COMPETITION_STATS,
  CATEGORIES,
  getPopularCompetitions,
  FORMAT_LABEL,
} from "@/lib/competitions";

export default function Landing() {
  const popular = getPopularCompetitions().slice(0, 6);

  return (
    <>
      {/* ─── HERO ───────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          padding: "100px 0 120px",
          background: `
            radial-gradient(60% 70% at 15% 25%, rgba(var(--brand-rgb), 0.28) 0%, rgba(var(--brand-rgb), 0.10) 35%, transparent 65%),
            radial-gradient(55% 65% at 85% 78%, rgba(var(--accent-rgb), 0.18) 0%, rgba(var(--accent-rgb), 0.06) 38%, transparent 68%)
          `,
        }}
      >
        <div className="container" style={{ position: "relative" }}>
          <div style={{ maxWidth: 920, marginInline: "auto", textAlign: "center" }}>
            <ScrollReveal>
              <HeroBadge>For FBLA Chapters</HeroBadge>
            </ScrollReveal>
            <ScrollReveal delay={0.06}>
              <h1 style={{ marginTop: 22 }}>
                Everything your FBLA chapter needs,{" "}
                <span style={{ color: "var(--accent)" }}>in one place.</span>
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={0.12}>
              <p
                style={{
                  fontSize: 18,
                  marginTop: 22,
                  maxWidth: 660,
                  marginInline: "auto",
                  color: "var(--text2)",
                  lineHeight: 1.6,
                }}
              >
                Competition guides, study resources, prep tracker, deadline calendar,
                advisor dashboard. Stop juggling spreadsheets and Drive folders.
                Start winning.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.18}>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "center",
                  marginTop: 36,
                  flexWrap: "wrap",
                }}
              >
                <Link href="/auth" className="btn btn-accent btn-lg cta-shimmer">
                  Get started free
                </Link>
                <Link href="/competitions" className="btn btn-ghost btn-lg">
                  Browse competitions
                </Link>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.24}>
              <p
                className="font-mono"
                style={{
                  marginTop: 24,
                  fontSize: 11,
                  color: "var(--text-muted)",
                  letterSpacing: "0.08em",
                }}
              >
                ALWAYS FREE · NO CARD REQUIRED · BUILT FOR FBLA STUDENTS, BY AN FBLA STUDENT
              </p>
            </ScrollReveal>
          </div>

          {/* Hero stats strip */}
          <ScrollReveal delay={0.3}>
            <div
              className="hero-stats"
              style={{
                marginTop: 64,
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 1,
                background: "var(--border)",
                borderRadius: 16,
                overflow: "hidden",
                border: "0.5px solid var(--border)",
                maxWidth: 920,
                marginInline: "auto",
              }}
            >
              <StatBlock value={String(COMPETITION_STATS.total)} label="Competitions tracked" />
              <StatBlock value={String(COMPETITION_STATS.withContent)} label="Full study guides" />
              <StatBlock value={String(COMPETITION_STATS.categories)} label="Categories" />
              <StatBlock value="Aug 25" label="Officer-meeting launch" />
            </div>
          </ScrollReveal>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .hero-stats { grid-template-columns: repeat(2, 1fr) !important; }
          }
        `}</style>
      </section>

      {/* ─── FEATURES BENTO ─────────────────────────────────── */}
      <section style={{ padding: "60px 0" }}>
        <div className="container">
          <SectionHeader
            eyebrow="What's inside"
            title="Three things, done right."
            tagline="No fluff. The features your chapter actually opens every week."
          />

          <div
            className="bento-grid"
            style={{
              marginTop: 56,
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr",
              gap: 20,
            }}
          >
            <ScrollReveal>
              <FeatureCard
                badge="01"
                title="Competition guides"
                body={`A page for every event: what it is, what's on the test, the official rubric, and curated study resources. ${COMPETITION_STATS.withContent} events have full content today; the rest get fleshed out as the year goes.`}
                large
              />
            </ScrollReveal>
            <ScrollReveal delay={0.05}>
              <FeatureCard
                badge="02"
                title="Prep tracker"
                body="Log practice tests. Save resources. See your progress per competition. Know exactly where you stand before regionals."
              />
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <FeatureCard
                badge="03"
                title="Chapter management"
                body="Comp sign-up flow, deadline calendar with email reminders, and an advisor dashboard that shows who's signed up for what."
              />
            </ScrollReveal>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .bento-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>

      {/* ─── COMPETITIONS PREVIEW ───────────────────────────── */}
      <section style={{ padding: "100px 0 40px" }}>
        <div className="container">
          <SectionHeader
            eyebrow="Most picked"
            title="Start where most of your chapter does."
            tagline="The events members actually sign up for. Click any one to see the full prep page."
          />

          <div
            className="comp-grid"
            style={{
              marginTop: 56,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
          >
            {popular.map((c, i) => (
              <ScrollReveal key={c.slug} delay={i * 0.04}>
                <Link href={`/competitions/${c.slug}`} style={{ textDecoration: "none" }}>
                  <Card variant="hover" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8 }}>
                      <span className="chip chip-brand">{c.category}</span>
                      <span className="chip">{FORMAT_LABEL[c.format]}</span>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 8 }}>
                      {c.name}
                    </h3>
                    <p style={{ fontSize: 13.5, color: "var(--text2)", lineHeight: 1.6, flex: 1 }}>
                      {c.description}
                    </p>
                    <div
                      style={{
                        marginTop: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: "var(--accent)",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      View prep page
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Card>
                </Link>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={0.25}>
            <div style={{ marginTop: 36, textAlign: "center" }}>
              <Link href="/competitions" className="btn btn-ghost btn-pill">
                Browse all {COMPETITION_STATS.total} competitions
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </ScrollReveal>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .comp-grid { grid-template-columns: 1fr 1fr !important; }
          }
          @media (max-width: 600px) {
            .comp-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────── */}
      <section style={{ padding: "100px 0" }}>
        <div className="container">
          <SectionHeader eyebrow="How it works" title="Three steps to a winning chapter." />

          <div
            className="hiw-grid"
            style={{
              marginTop: 56,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }}
          >
            {[
              {
                step: "01",
                title: "Pick your events",
                body: `Browse the registry of ${COMPETITION_STATS.total} FBLA events. Filter by category or format. Sign up the ones you want to compete in.`,
              },
              {
                step: "02",
                title: "Prep with structure",
                body: "Each event has a study page with the test format, topics, and curated resources. Log practice tests as you go.",
              },
              {
                step: "03",
                title: "Win regionals",
                body: "Your advisor sees who's signed up for what. Deadlines auto-remind. Nothing falls through the cracks.",
              },
            ].map((s, i) => (
              <ScrollReveal key={s.step} delay={i * 0.06}>
                <Card style={{ height: "100%" }}>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      color: "var(--accent)",
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                    }}
                  >
                    {s.step}
                  </div>
                  <h3 style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em", marginTop: 12, marginBottom: 8 }}>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.65 }}>{s.body}</p>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .hiw-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>

      {/* ─── CATEGORIES ─────────────────────────────────────── */}
      <section style={{ padding: "80px 0" }}>
        <div className="container">
          <SectionHeader
            eyebrow="Every category"
            title="From accounting to cyber security."
            tagline="FBLA's seven competitive categories. Click in to see every event."
          />

          <div
            className="cat-grid"
            style={{
              marginTop: 48,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {CATEGORIES.map((cat, i) => (
              <ScrollReveal key={cat} delay={i * 0.03}>
                <Link
                  href={`/competitions?category=${encodeURIComponent(cat)}`}
                  className="category-tile"
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text)",
                      letterSpacing: "-0.005em",
                    }}
                  >
                    {cat}
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ──────────────────────────────────────── */}
      <section style={{ padding: "100px 0 80px" }}>
        <div className="container">
          <ScrollReveal>
            <div
              style={{
                position: "relative",
                background: "var(--card-bg)",
                border: "0.5px solid var(--accent-border)",
                borderRadius: 20,
                padding: "64px 32px",
                textAlign: "center",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at 50% 0%, rgba(var(--accent-rgb), 0.18) 0%, transparent 60%)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ position: "relative" }}>
                <HeroBadge>Ready to upgrade your chapter?</HeroBadge>
                <h2 style={{ marginTop: 16, marginBottom: 14 }}>
                  Get your chapter on <span style={{ color: "var(--accent)" }}>FBLA One.</span>
                </h2>
                <p style={{ maxWidth: 560, marginInline: "auto", color: "var(--text2)", fontSize: 16 }}>
                  Always free for FBLA students. No setup. No spreadsheets. Sign up and your
                  competitions are ready to track in under a minute.
                </p>
                <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <Link href="/auth" className="btn btn-accent btn-lg cta-shimmer">
                    Get started free
                  </Link>
                  <Link href="/competitions" className="btn btn-ghost btn-lg">
                    Browse competitions
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        background: "var(--card-bg)",
        padding: "28px 16px",
        textAlign: "center",
      }}
    >
      <div
        className="font-mono"
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: "var(--accent)",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        className="font-mono"
        style={{
          marginTop: 8,
          fontSize: 10,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--text3)",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function FeatureCard({
  badge,
  title,
  body,
  large,
}: {
  badge: string;
  title: string;
  body: string;
  large?: boolean;
}) {
  return (
    <Card variant="hover" style={{ height: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div
          className="font-mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.22em",
            color: "var(--accent)",
            fontWeight: 700,
          }}
        >
          {badge}
        </div>
        <h3
          style={{
            fontSize: large ? 26 : 21,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginTop: 14,
            marginBottom: 12,
          }}
        >
          {title}
        </h3>
        <p style={{ fontSize: 14.5, color: "var(--text2)", lineHeight: 1.65, flex: 1 }}>{body}</p>
      </div>
    </Card>
  );
}
