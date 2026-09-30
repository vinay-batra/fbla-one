import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ChapterShowcase } from "@/components/ChapterShowcase";
import { HeroCta } from "@/components/HeroCta";
import { EmailCta } from "@/components/EmailCta";
import { ExamSheet } from "@/components/landing/ExamSheet";
import { EventIndex } from "@/components/landing/EventIndex";
import { COMPETITION_STATS } from "@/lib/competitions";

const HOME_TITLE = "ChapterPrep - Practice Tests for Every FBLA Objective Event";
// Kept under ~160 characters so search results do not truncate it.
const HOME_DESCRIPTION =
  "Unlimited practice tests for every FBLA objective event, with instant explanations and score tracking. Study guides, deadlines and an advisor dashboard. Free.";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: "/",
    siteName: "ChapterPrep",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ChapterPrep" }],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: ["/og-image.png"],
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ChapterPrep",
  url: "https://chapterprep.com",
  description:
    "Free practice tests, study guides, a deadline calendar and chapter tools for FBLA competitive events.",
  publisher: {
    "@type": "Organization",
    name: "ChapterPrep",
    url: "https://chapterprep.com",
    logo: { "@type": "ImageObject", url: "https://chapterprep.com/icon-512.png" },
  },
};

/** "How it works", set as a book's table of contents. */
const CONTENTS = [
  {
    n: "I",
    title: "Find your event",
    value: `${COMPETITION_STATS.total} events`,
    body: "Every 2025-26 competitive event, each with its format, the topics it covers, and study resources worth your time.",
  },
  {
    n: "II",
    title: "Take a practice test",
    value: "up to 50 questions",
    body: "Built around your event's topic outline, graded instantly, and every answer explained, so you learn it instead of guessing it.",
  },
  {
    n: "III",
    title: "Drill what you miss",
    value: "scored by topic",
    body: "Each test is scored topic by topic, and one tap turns your weakest topic into its own focused test.",
  },
  {
    n: "IV",
    title: "Bring your chapter",
    value: "free, always",
    body: "Your adviser sets goals, sees who is practicing, and exports regional registration in one file.",
  },
];

export default function Landing() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

      {/* --- HERO -------------------------------------------------------- */}
      <section className="ed-hero">
        <div className="container ed-hero-grid">
          <div className="ed-hero-copy">
            <div className="ed-rise">
              <p className="ed-kicker">Practice for FBLA competitive events</p>
            </div>
            <div className="ed-rise ed-d1">
              <h1 className="ed-display">
                Walk into regionals already{" "}
                <span className="pen-underline">
                  knowing the test.
                  {/* Two real pen strokes drawn along a fixed path: a firm pass,
                      then a lighter second pass, the way people underline twice
                      for emphasis. Replaces a background that grew from zero
                      width and visibly stretched the curve as it went. */}
                  <svg className="pen-underline-svg" viewBox="0 0 300 18" preserveAspectRatio="none" aria-hidden="true">
                    <path className="pu-1" pathLength={1} d="M4 10C52 5 104 13 156 8s96-5 140-3" />
                    <path className="pu-2" pathLength={1} d="M22 15c58-4 128-3 262-6" />
                  </svg>
                </span>
              </h1>
            </div>
            <div className="ed-rise ed-d2">
              {/* Numbers live in the ledger right below; this line carries the
                  promise, not the stats. */}
              <p className="ed-lede">
                Practice tests built from your event&apos;s topic outline, with every answer
                explained. By competition day, the real test feels familiar.
              </p>
            </div>
            <div className="ed-rise ed-d3">
              <div className="ed-actions">
                <HeroCta wrap={false} signedOutLabel="Start practicing" className="ed-btn" />
                <Link href="/competitions" className="ed-textlink">
                  Browse all {COMPETITION_STATS.total} events <span aria-hidden="true">→</span>
                </Link>
              </div>
              <p className="ed-fine">Made by a chapter Competition Chair who needed it first.</p>
            </div>
          </div>

          <div className="ed-rise ed-d4">
            {/* No 3D tilt here: an answerable sheet must not move under the
                cursor. The tilt rotated the card as the pointer moved, so the
                hovered answer slid out from under it and the hover state and
                cursor flickered. */}
            <ExamSheet />
          </div>
        </div>
      </section>

      {/* --- LEDGER: the numbers, written as a sentence ------------------ */}
      <section className="ed-ledger" aria-label="At a glance">
        <div className="container">
          <p>
            <strong>{COMPETITION_STATS.total}</strong> events indexed
            <span className="ed-sep" aria-hidden="true">·</span>
            <strong>{COMPETITION_STATS.aiEligible}</strong> with practice tests
            <span className="ed-sep" aria-hidden="true">·</span>
            up to <strong>50</strong> questions a test
            <span className="ed-sep" aria-hidden="true">·</span>
            <strong>free</strong> for every chapter
          </p>
        </div>
      </section>

      {/* --- CONTENTS (how it works) ------------------------------------- */}
      <section className="ed-section">
        <div className="container ed-contents-grid">
          <ScrollReveal>
            <div className="ed-section-head">
              <p className="ed-kicker">How it works</p>
              <h2 className="ed-h2">Contents</h2>
              <p className="ed-muted">Four chapters, from picking your event to bringing your whole team along.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.08}>
            <ol className="toc">
              {CONTENTS.map((c) => (
                <li key={c.n} className="toc-row">
                  <div className="toc-line">
                    <span className="toc-n">{c.n}</span>
                    <span className="toc-title">{c.title}</span>
                    <span className="toc-leader" aria-hidden="true" />
                    <span className="toc-value">{c.value}</span>
                  </div>
                  <p className="toc-body">{c.body}</p>
                </li>
              ))}
            </ol>
          </ScrollReveal>
        </div>
      </section>

      {/* --- OFFICERS + ADVISERS ----------------------------------------- */}
      <ChapterShowcase />

      {/* --- INDEX: every event ------------------------------------------ */}
      <section className="ed-section ed-section-index">
        <div className="container">
          <ScrollReveal>
            <div className="ed-section-head ed-section-head-wide">
              <p className="ed-kicker">Index</p>
              <h2 className="ed-h2">Every event, in one place.</h2>
              <p className="ed-muted">
                All {COMPETITION_STATS.total} FBLA competitive events for 2025-26, each with its own
                prep page. Practice tests are available for the events marked{"\u00a0"}
                <span className="index-mark index-mark-inline" aria-hidden="true" />
                <span className="sr-only"> with a dot</span>.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.06}>
            <EventIndex />
          </ScrollReveal>
        </div>
      </section>

      {/* --- CLOSE ------------------------------------------------------- */}
      <section className="ed-close">
        <div className="container">
          <ScrollReveal>
            <div className="ed-close-inner">
              <h2 className="ed-display ed-display-close">Regionals don&apos;t wait.</h2>
              <p className="ed-lede ed-lede-center">
                Pick your event and take your first practice test in under a minute. Or leave your
                email for prep tips before competition season.
              </p>
              <EmailCta />
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
