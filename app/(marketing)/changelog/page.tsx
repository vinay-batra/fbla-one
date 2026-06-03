import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { HeroBadge } from "@/components/HeroBadge";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "Every FBLA One release in order. From the first build to AI practice tests, chapter tools, and the public AI assistant.",
  alternates: { canonical: "/changelog" },
};

// Six chapters, six bullets each, equal-size cards. Each bullet is a thematic
// summary of a release window, not a single commit.
type Era = {
  num: string;
  name: string;
  versions: string;
  dateRange: string;
  intro: string;
  highlights: string[];
  tags: string[];
};

const ERAS: Era[] = [
  {
    num: "01",
    name: "Foundations",
    versions: "v0.1 - v0.2",
    dateRange: "May 27, 2026",
    intro:
      "The first build: a Corvo-grade design system and a complete registry of every FBLA competitive event.",
    highlights: [
      "Full theme system, light and dark, CSS variables, no Tailwind",
      "55-event registry with categories, formats, and topic outlines",
      "Marketing site: landing, FAQ, privacy, and terms, all scroll-revealed",
      "Filterable competitions grid plus a prep page for every event",
      "Authenticated app shell: dashboard, tracker, chapter, settings",
      "localStorage-first storage layer mapped to the future database schema",
    ],
    tags: ["Launch", "Design", "Registry"],
  },
  {
    num: "02",
    name: "Live & Connected",
    versions: "v0.3",
    dateRange: "May 28, 2026",
    intro:
      "FBLA One went live at fbla.one, wired to real auth, a database, and cross-device sync.",
    highlights: [
      "Deployed to fbla.one on Vercel with SSL and push-to-deploy",
      "Supabase auth: Google OAuth, email/password, and magic link",
      "Registrations, practice logs, and saved resources sync across devices",
      "Caught and fixed a critical table-grant bug via a live integration test",
      "Production audit: sitemap, robots, OG image, JSON-LD, PWA manifest",
      "Branded error and 404 states, app-side profile creation on sign in",
    ],
    tags: ["Launch", "Auth", "Supabase"],
  },
  {
    num: "03",
    name: "The AI Practice Engine",
    versions: "v1.0",
    dateRange: "May 28 - Jun 1, 2026",
    intro:
      "The core feature shipped: unlimited AI practice tests calibrated to every objective event.",
    highlights: [
      "Claude streams realistic 100-question tests matched to each topic outline",
      "Four-phase coach UI: idle, generating, taking, and reviewing",
      "45 eligible objective events, each with full wrong-answer rationales",
      "Demo mode lets advisors try the platform with no sign-up required",
      "Scores log automatically after every test and feed the dashboard",
      "Bookmark study resources on any event and manage them in one place",
    ],
    tags: ["AI", "Practice", "Demo"],
  },
  {
    num: "04",
    name: "Chapter Tools",
    versions: "v1.0",
    dateRange: "Jun 1 - Jun 2, 2026",
    intro:
      "Everything an advisor needs to run a chapter, in place of a group chat and a spreadsheet.",
    highlights: [
      "Advisor dashboard with create-or-join, invite codes, and a roster",
      "Leaderboard ranking members by practice volume then average score",
      "Chapter-shared deadline calendar with three-day countdown alerts",
      "Eight-week stats: active members, chapter average, and top event",
      "CSV exports of members, registrations, and practice activity",
      "Score-trend charts and a first-visit onboarding walkthrough",
    ],
    tags: ["Chapter", "Advisor", "Calendar"],
  },
  {
    num: "05",
    name: "Hardening & Polish",
    versions: "v1.1 - v1.2",
    dateRange: "Jun 2 - Jun 3, 2026",
    intro:
      "A security and accessibility pass, the real brand mark, and a Supabase-backed feedback loop.",
    highlights: [
      "Fixed an infinite-recursion RLS bug, verified live 18/18",
      "Invite-validated join RPC closed the world-readable invite holes",
      "Accessibility: dialog roles, focus traps, Escape, WCAG AA contrast",
      "Completed long descriptions and resources for all 55 events",
      "Shipped the real navy-and-gold shield logo across nav and favicons",
      "Supabase-backed feedback button, verified live with real inserts",
    ],
    tags: ["Security", "A11y", "Brand"],
  },
  {
    num: "06",
    name: "Public AI & Redesign",
    versions: "v1.3",
    dateRange: "Jun 3, 2026",
    intro:
      "An ask-anything AI helper, a cleaner bug-report flow, and a sharper, product-led landing page.",
    highlights: [
      "Floating AI chat answers FBLA questions, five free a day per visitor",
      "Report-a-bug flag button restyled to sit beside the chat bubble",
      "Hero redesign: layered background, gradient headline, live preview",
      "Landing reordered: hero, how-it-works, most-picked events, sign-up",
      "Removed repetitive feature and category sections for a tighter story",
      "Added this changelog and a Features link to navigate home anywhere",
    ],
    tags: ["AI", "Redesign", "Polish"],
  },
];

export default function ChangelogPage() {
  return (
    <>
      {/* --- HERO ------------------------------------------------ */}
      <section
        style={{
          position: "relative",
          padding: "120px 0 36px",
          textAlign: "center",
          background: `
            radial-gradient(55% 60% at 18% 18%, rgba(var(--brand-rgb), 0.24) 0%, transparent 62%),
            radial-gradient(50% 55% at 85% 24%, rgba(var(--accent-rgb), 0.16) 0%, transparent 66%)
          `,
        }}
      >
        <div className="container">
          <ScrollReveal>
            <HeroBadge>What&apos;s new</HeroBadge>
          </ScrollReveal>
          <ScrollReveal delay={0.06}>
            <h1 style={{ marginTop: 22 }}>
              Every release,{" "}
              <span style={{ color: "var(--accent)" }}>in order.</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.12}>
            <p
              style={{
                fontSize: 18,
                marginTop: 20,
                maxWidth: 560,
                marginInline: "auto",
                color: "var(--text2)",
                lineHeight: 1.6,
              }}
            >
              Built fast for FBLA chapters. Here is everything shipped so far,
              one chapter at a time.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* --- HORIZONTAL TIMELINE -------------------------------- */}
      <section style={{ padding: "20px 0 90px" }}>
        <ScrollReveal>
          <div
            className="cl-scroll-hint container"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginBottom: 32,
            }}
          >
            <span
              className="font-mono"
              style={{
                fontSize: 10,
                letterSpacing: "0.22em",
                color: "var(--text3)",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Six chapters · scroll
            </span>
            <svg width="22" height="10" viewBox="0 0 22 10" fill="none">
              <path
                d="M2 5h17M14 1l4 4-4 4"
                stroke="var(--text3)"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </ScrollReveal>

        <div className="cl-rail">
          {ERAS.map((era, i) => {
            const isLast = i === ERAS.length - 1;
            const isFirst = i === 0;
            return (
              <div key={era.num} className="cl-era">
                {/* Timeline strip: line + dot above the card */}
                <div style={{ position: "relative", height: 34, marginBottom: 20 }}>
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: isFirst ? "50%" : 0,
                      right: isLast ? "50%" : -28,
                      height: 1.5,
                      background: "rgba(var(--accent-rgb), 0.4)",
                      transform: "translateY(-50%)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: 15,
                      height: 15,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      border: "4px solid var(--bg)",
                      boxShadow:
                        "0 0 0 3px rgba(var(--accent-rgb), 0.18), 0 0 14px rgba(var(--accent-rgb), 0.35)",
                    }}
                  />
                </div>

                {/* Card */}
                <div className="cl-card">
                  <div className="cl-card-meta">
                    <span className="font-mono cl-chapter">CHAPTER {era.num}</span>
                    <span className="font-mono cl-versions">{era.versions}</span>
                  </div>

                  <h3 className="font-display cl-name">{era.name}</h3>
                  <p className="font-mono cl-date">{era.dateRange}</p>
                  <p className="cl-intro">{era.intro}</p>

                  <ul className="cl-list">
                    {era.highlights.map((h, hi) => (
                      <li key={hi} className="cl-item">
                        <span className="cl-bullet" />
                        {h}
                      </li>
                    ))}
                  </ul>

                  <div className="cl-tags">
                    {era.tags.map((t) => (
                      <span key={t} className="cl-tag">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* --- FINAL CTA ----------------------------------------- */}
      <section style={{ padding: "20px 0 90px" }}>
        <div className="container">
          <ScrollReveal>
            <div
              style={{
                position: "relative",
                background: "var(--card-bg)",
                border: "0.5px solid var(--accent-border)",
                borderRadius: 20,
                padding: "56px 32px",
                textAlign: "center",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at 50% 0%, rgba(var(--accent-rgb), 0.16) 0%, transparent 60%)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ position: "relative" }}>
                <h2 style={{ marginBottom: 14 }}>
                  More is on the{" "}
                  <span style={{ color: "var(--accent)" }}>way.</span>
                </h2>
                <p style={{ maxWidth: 520, marginInline: "auto", color: "var(--text2)", fontSize: 16 }}>
                  FBLA One is free for every member and shipping new features every
                  week. Get your chapter on it today.
                </p>
                <div style={{ marginTop: 30, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <Link href="/auth" className="btn btn-accent btn-lg cta-shimmer">
                    Get started free
                  </Link>
                  <Link href="/" className="btn btn-ghost btn-lg">
                    Back to features
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <style>{`
        .cl-rail {
          display: flex;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x mandatory;
          gap: 28px;
          padding: 4px max(24px, calc((100vw - 1240px) / 2)) 24px;
          scroll-padding-left: 24px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: rgba(var(--accent-rgb), 0.4) transparent;
        }
        .cl-rail::-webkit-scrollbar { height: 6px; }
        .cl-rail::-webkit-scrollbar-track { background: transparent; }
        .cl-rail::-webkit-scrollbar-thumb { background: rgba(var(--accent-rgb), 0.35); border-radius: 4px; }
        .cl-rail::-webkit-scrollbar-thumb:hover { background: rgba(var(--accent-rgb), 0.6); }

        .cl-era {
          flex-shrink: 0;
          scroll-snap-align: center;
          width: 384px;
        }
        /* Fixed-size cards so every chapter box is identical. */
        .cl-card {
          width: 100%;
          height: 540px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          background: var(--card-bg);
          border: 0.5px solid var(--border2);
          border-radius: 18px;
          padding: 26px 28px 24px;
          box-shadow: var(--shadow-md);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s ease;
        }
        .cl-card:hover {
          transform: translateY(-6px);
          border-color: var(--accent-border);
          box-shadow: var(--shadow-lg);
        }
        .cl-card-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .cl-chapter { font-size: 10px; font-weight: 700; color: var(--text3); letter-spacing: 0.22em; }
        .cl-versions {
          font-size: 10px;
          font-weight: 700;
          color: var(--accent);
          background: rgba(var(--accent-rgb), 0.08);
          border: 1px solid rgba(var(--accent-rgb), 0.25);
          border-radius: 6px;
          padding: 3px 9px;
          letter-spacing: 0.04em;
        }
        .cl-name { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.12; margin-bottom: 6px; color: var(--text); }
        .cl-date { font-size: 11px; color: var(--text3); margin-bottom: 14px; letter-spacing: 0.03em; }
        .cl-intro { font-size: 13.5px; color: var(--text2); line-height: 1.6; margin-bottom: 16px; font-style: italic; }
        .cl-list { list-style: none; padding: 0; margin: 0 0 16px; display: flex; flex-direction: column; gap: 9px; flex: 1; }
        .cl-item { font-size: 12.5px; color: var(--text2); line-height: 1.5; padding-left: 16px; position: relative; }
        .cl-bullet { position: absolute; left: 0; top: 6px; width: 5px; height: 5px; border-radius: 50%; background: var(--accent); }
        .cl-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: auto; }
        .cl-tag {
          padding: 3px 10px;
          background: rgba(var(--accent-rgb), 0.08);
          border: 1px solid rgba(var(--accent-rgb), 0.35);
          border-radius: 20px;
          font-size: 10px;
          color: var(--accent);
          letter-spacing: 0.04em;
        }
        @media (max-width: 768px) {
          .cl-rail { gap: 0; scroll-padding-left: 20px; padding-left: 20px; padding-right: 20px; }
          .cl-era { width: min(84vw, 360px); margin-right: 28px; }
          .cl-era:last-child { margin-right: 0; }
          .cl-card { height: 560px; }
        }
      `}</style>
    </>
  );
}
