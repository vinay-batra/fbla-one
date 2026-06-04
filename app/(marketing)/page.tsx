import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SectionHeader } from "@/components/SectionHeader";
import { HeroBadge } from "@/components/HeroBadge";
import { HeroCta } from "@/components/HeroCta";
import { Card } from "@/components/Card";
import {
  COMPETITION_STATS,
  getPopularCompetitions,
  FORMAT_LABEL,
} from "@/lib/competitions";

export const metadata: Metadata = {
  title: { absolute: "FBLA One - AI Practice Tests for Every FBLA Objective Event" },
  description:
    "Generate unlimited AI practice tests for every FBLA objective event. 100 questions, instant explanations, score tracking. Plus study guides, deadline calendar, and advisor dashboard -- all free.",
  alternates: { canonical: "/" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "FBLA One",
  url: "https://fbla.one",
  description: "AI-powered FBLA prep: unlimited practice tests, study guides, deadline calendar, and chapter management.",
  publisher: {
    "@type": "Organization",
    name: "FBLA One",
    url: "https://fbla.one",
    logo: "https://fbla.one/icon-512.png",
  },
};

export default function Landing() {
  const popular = getPopularCompetitions().slice(0, 6);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      {/* --- HERO ------------------------------------------------ */}
      <section className="hero-section">
        {/* Layered ambient background: brand + accent orbs, dotted grid, top fade */}
        <div className="hero-bg" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 940, marginInline: "auto", textAlign: "center" }}>
            <ScrollReveal>
              <HeroBadge>AI-Powered FBLA Prep</HeroBadge>
            </ScrollReveal>
            <ScrollReveal delay={0.06}>
              <h1 className="hero-headline" style={{ marginTop: 22 }}>
                Practice smarter.{" "}
                <span className="hero-accent">Score higher.</span>
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={0.12}>
              <p
                style={{
                  fontSize: 18,
                  marginTop: 22,
                  maxWidth: 640,
                  marginInline: "auto",
                  color: "var(--text2)",
                  lineHeight: 1.65,
                }}
              >
                Unlimited AI practice tests for every FBLA objective event. 100 questions,
                instant explanations, score tracking. Plus study guides, a deadline calendar,
                and an advisor dashboard. All free.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.18}>
              <HeroCta />
            </ScrollReveal>
          </div>

          {/* Product preview: a live-feel AI practice question in a framed window */}
          <ScrollReveal delay={0.3}>
            <div className="hero-preview">
              <div className="hero-preview-bar">
                <span className="hero-dot" style={{ background: "var(--red)" }} />
                <span className="hero-dot" style={{ background: "var(--accent)" }} />
                <span className="hero-dot" style={{ background: "var(--green)" }} />
                <span className="font-mono hero-preview-url">fbla.one/app/coach</span>
              </div>
              <div className="hero-preview-body">
                <div className="hero-preview-meta">
                  <span className="eyebrow" style={{ color: "var(--accent)" }}>AI Practice Test</span>
                  <span className="font-mono hero-preview-count">Question 7 / 100 · Accounting I</span>
                </div>
                <p className="hero-preview-q">
                  A company purchases supplies on account. Which accounts are affected, and how?
                </p>
                <div className="hero-preview-opts">
                  <div className="hero-opt">
                    <span className="hero-opt-key">A</span>
                    Debit Supplies, credit Cash
                  </div>
                  <div className="hero-opt hero-opt--correct">
                    <span className="hero-opt-key hero-opt-key--correct">B</span>
                    Debit Supplies, credit Accounts Payable
                    <svg className="hero-opt-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <div className="hero-opt">
                    <span className="hero-opt-key">C</span>
                    Debit Accounts Payable, credit Supplies
                  </div>
                  <div className="hero-opt">
                    <span className="hero-opt-key">D</span>
                    Debit Cash, credit Supplies
                  </div>
                </div>
                <div className="hero-preview-explain">
                  <span className="font-mono hero-explain-tag">WHY</span>
                  Buying on account means you owe later, so Accounts Payable (a liability) is
                  credited while Supplies (an asset) is debited.
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Hero stats strip */}
          <ScrollReveal delay={0.36}>
            <div
              className="hero-stats"
              style={{
                marginTop: 48,
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 1,
                background: "var(--border)",
                borderRadius: 16,
                overflow: "hidden",
                border: "0.5px solid var(--border)",
                maxWidth: 940,
                marginInline: "auto",
              }}
            >
              <StatBlock value="55" label="Competitions tracked" />
              <StatBlock value="45" label="AI practice test events" />
              <StatBlock value="100" label="Questions per test" />
              <StatBlock value="Free" label="Always, forever" />
            </div>
          </ScrollReveal>
        </div>

        <style>{`
          .hero-section {
            position: relative;
            padding: 96px 0 110px;
            overflow: hidden;
          }
          .hero-bg {
            position: absolute;
            inset: 0;
            pointer-events: none;
            background:
              radial-gradient(58% 60% at 14% 18%, rgba(var(--brand-rgb), 0.30) 0%, rgba(var(--brand-rgb), 0.10) 36%, transparent 66%),
              radial-gradient(52% 58% at 88% 30%, rgba(var(--accent-rgb), 0.22) 0%, rgba(var(--accent-rgb), 0.06) 40%, transparent 70%);
          }
          .hero-grid {
            position: absolute;
            inset: 0;
            pointer-events: none;
            background-image:
              linear-gradient(rgba(var(--brand-rgb), 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(var(--brand-rgb), 0.05) 1px, transparent 1px);
            background-size: 46px 46px;
            -webkit-mask-image: radial-gradient(72% 62% at 50% 30%, #000 0%, transparent 78%);
            mask-image: radial-gradient(72% 62% at 50% 30%, #000 0%, transparent 78%);
          }
          .hero-headline {
            font-size: clamp(40px, 6vw, 68px);
            line-height: 1.04;
          }
          .hero-accent {
            background: linear-gradient(118deg, var(--accent) 0%, var(--brand) 118%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
          }
          /* Light mode: the gold->navy gradient turns muddy, so use the clean
             solid gold every other accent word on the site uses. */
          [data-theme="light"] .hero-accent {
            background: none;
            -webkit-text-fill-color: var(--accent);
            color: var(--accent);
          }
          .hero-preview {
            margin: 60px auto 0;
            max-width: 720px;
            background: var(--card-bg);
            border: 0.5px solid var(--border2);
            border-radius: 18px;
            box-shadow: var(--shadow-lg);
            overflow: hidden;
            text-align: left;
            animation: heroFloat 7s ease-in-out infinite;
          }
          @keyframes heroFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-7px); }
          }
          .hero-preview-bar {
            display: flex;
            align-items: center;
            gap: 7px;
            padding: 12px 16px;
            border-bottom: 0.5px solid var(--border);
            background: var(--bg2);
          }
          .hero-dot { width: 10px; height: 10px; border-radius: 50%; opacity: 0.85; }
          .hero-preview-url {
            margin-left: 12px;
            font-size: 11px;
            color: var(--text3);
            letter-spacing: 0.02em;
          }
          .hero-preview-body { padding: 24px 26px 26px; }
          .hero-preview-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 14px;
          }
          .hero-preview-count { font-size: 11px; color: var(--text3); }
          .hero-preview-q {
            font-family: var(--font-display);
            font-size: 19px;
            font-weight: 600;
            color: var(--text);
            line-height: 1.45;
            margin: 0 0 18px;
            letter-spacing: -0.01em;
          }
          .hero-preview-opts { display: flex; flex-direction: column; gap: 9px; }
          .hero-opt {
            position: relative;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 14px;
            border: 0.5px solid var(--border);
            border-radius: 11px;
            background: var(--bg2);
            color: var(--text2);
            font-size: 14px;
          }
          .hero-opt--correct {
            border-color: rgba(var(--green-rgb), 0.45);
            background: rgba(var(--green-rgb), 0.08);
            color: var(--text);
            font-weight: 500;
          }
          .hero-opt-key {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            flex-shrink: 0;
            border-radius: 7px;
            background: var(--bg3);
            border: 0.5px solid var(--border);
            font-family: var(--font-mono);
            font-size: 12px;
            font-weight: 700;
            color: var(--text3);
          }
          .hero-opt-key--correct {
            background: rgba(var(--green-rgb), 0.16);
            border-color: rgba(var(--green-rgb), 0.4);
            color: var(--green);
          }
          .hero-opt-check { margin-left: auto; flex-shrink: 0; }
          .hero-preview-explain {
            margin-top: 16px;
            padding: 13px 15px;
            border-radius: 11px;
            border: 0.5px solid var(--accent-border);
            background: var(--accent-dim);
            font-size: 13px;
            line-height: 1.6;
            color: var(--text2);
          }
          .hero-explain-tag {
            display: inline-block;
            margin-right: 9px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.18em;
            color: var(--accent);
          }
          @media (max-width: 768px) {
            .hero-stats { grid-template-columns: repeat(2, 1fr) !important; }
            .hero-preview { animation: none; }
            .hero-preview-body { padding: 20px; }
            .hero-preview-q { font-size: 17px; }
          }
          @media (prefers-reduced-motion: reduce) {
            .hero-preview { animation: none; }
          }
        `}</style>
      </section>

      {/* --- HOW IT WORKS -------------------------------------- */}
      <section style={{ padding: "56px 0 80px" }}>
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
                title: "Register for your events",
                body: `Browse all ${COMPETITION_STATS.total} FBLA competitions. Filter by category or format. Add the events you plan to compete in to your personal queue.`,
              },
              {
                step: "02",
                title: "Train with AI",
                body: "Generate a 10, 25, or 50-question practice test for any objective event, calibrated to its exact FBLA topic outline. Every wrong answer comes with a full explanation, so you actually learn the material instead of just memorizing.",
              },
              {
                step: "03",
                title: "Track and win",
                body: "Your scores log automatically after every test. Your advisor sees who is prepping and for what. Nothing falls through the cracks before regionals.",
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

      {/* --- COMPETITIONS PREVIEW ------------------------------- */}
      <section style={{ padding: "80px 0 40px" }}>
        <div className="container">
          <SectionHeader
            eyebrow="Most picked"
            title="Start where most of your chapter does."
            tagline="Click any event to open the full prep page and launch an AI practice test."
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

      {/* --- FINAL CTA ----------------------------------------- */}
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
                  Get your chapter on{" "}
                  <span style={{ color: "var(--accent)" }}>FBLA One.</span>
                </h2>
                <p style={{ maxWidth: 560, marginInline: "auto", color: "var(--text2)", fontSize: 16 }}>
                  Free for every FBLA member. Sign up in under a minute -- no credit card, no setup.
                  AI practice tests, study guides, and chapter management, all in one place.
                </p>
                <div style={{ marginTop: 8 }}>
                  <HeroCta signedOutLabel="Get started free" />
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

