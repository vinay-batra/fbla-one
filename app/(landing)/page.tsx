import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { HeroCta } from "@/components/HeroCta";
import { EmailCta } from "@/components/EmailCta";
import { ExamSheet } from "@/components/landing/ExamSheet";
import { PenUnderline } from "@/components/PenUnderline";
import { WhyDifferent } from "@/components/landing/WhyDifferent";
import { EventIndex } from "@/components/landing/EventIndex";
import { COMPETITION_STATS } from "@/lib/competitions";

const HOME_TITLE = "ChapterPrep: Practice Tests for Every FBLA Objective Event";
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
    "Free FBLA practice: tests checked by a second model, an AI judge for role plays and presentations, a mistake bank, and Mock Regionals for chapters.",
  publisher: {
    "@type": "Organization",
    name: "ChapterPrep",
    url: "https://chapterprep.com",
    logo: { "@type": "ImageObject", url: "https://chapterprep.com/icon-512.png" },
  },
};

export default function Landing() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

      {/* --- HERO -------------------------------------------------------- */}
      <section className="ed-hero">
        <div className="container ed-hero-grid">
          <div className="ed-hero-copy">
            <div className="rise">
              <p className="ed-kicker">Practice for FBLA competitive events</p>
            </div>
            <div className="rise rise-1">
              <h1 className="ed-display">
                Walk into regionals{" "}
                <PenUnderline delay={0.65}>already knowing the test.</PenUnderline>
              </h1>
            </div>
            <div className="rise rise-2">
              {/* Numbers live in the ledger right below; this line carries the
                  promise, not the stats. */}
              <p className="ed-lede">
                Practice tests built from your event&apos;s topic outline, with every answer
                explained. By competition day, the real test feels familiar.
              </p>
            </div>
            <div className="rise rise-3">
              <div className="ed-actions">
                <HeroCta wrap={false} signedOutLabel="Start practicing" className="ed-btn" />
                <Link href="/competitions" className="ed-textlink">
                  Browse all {COMPETITION_STATS.total} events <span aria-hidden="true">→</span>
                </Link>
              </div>
              <p className="ed-finder">
                Not sure which event is yours?{" "}
                <Link href="/find-your-event">Take the one-minute quiz</Link>
              </p>
            </div>
          </div>

          <div className="rise rise-4">
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
            <strong>{COMPETITION_STATS.judged}</strong> with an AI judge
            <span className="ed-sep" aria-hidden="true">·</span>
            every answer checked twice
            <span className="ed-sep" aria-hidden="true">·</span>
            always free
          </p>
        </div>
      </section>

      {/* Contents, written as the answer to "why not just ask a chatbot?" */}
      <section className="ed-section">
        <ScrollReveal>
          <WhyDifferent />
        </ScrollReveal>
      </section>

      {/* --- INDEX: every event ------------------------------------------ */}
      <section className="ed-section ed-section-index">
        <div className="container">
          <ScrollReveal>
            <div className="ed-section-head ed-section-head-wide">
              <p className="ed-kicker">Index</p>
              <h2 className="ed-h2">Every event, in one place.</h2>
              <p className="ed-muted">
                All {COMPETITION_STATS.total} FBLA competitive events for 2026-27, each with its own
                prep page. The tag says how each is decided: <strong>T</strong> a test,{" "}
                <strong>R</strong> a test and then a role play, <strong>P</strong> a presentation or
                interview.
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
              <h2 className="ed-display ed-display-close">Winners don&apos;t wait.</h2>
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
