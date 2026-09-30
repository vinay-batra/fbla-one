import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { HeroCta } from "@/components/HeroCta";
import { PenCheck } from "@/components/PenMarks";
import { ExamSheet } from "@/components/landing/ExamSheet";
import { PenUnderline } from "@/components/PenUnderline";
import { RotatingWord } from "@/components/landing/RotatingWord";
import { WhyDifferent } from "@/components/landing/WhyDifferent";
import { EventIndex } from "@/components/landing/EventIndex";
import { JumpLink } from "@/components/landing/JumpLink";
import { EventFinder } from "@/components/eventfinder/EventFinder";
import { QUESTIONS } from "@/components/eventfinder/questions";
import "@/components/eventfinder/finder.css";
import { COMPETITION_STATS } from "@/lib/competitions";

const HOME_TITLE = "ChapterPrep: Practice Tests for Every FBLA Objective Event";
// Kept under ~160 characters so search results do not truncate it.
const HOME_DESCRIPTION =
  "Free FBLA practice tests built from each event's topic outline, an AI judge for role plays and presentations, and a live mock regionals for your chapter.";

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
                Walk into{" "}
                <RotatingWord words={["regionals", "states", "nationals"]} />{" "}
                <PenUnderline delay={0.65}>already knowing the test.</PenUnderline>
              </h1>
            </div>
            <div className="rise rise-2">
              {/* The three things that set ChapterPrep apart, above the fold, so a
                  visitor who came for the judge or for their chapter sees it here.
                  The numbers live in the ledger right below. */}
              <p className="ed-lede">Everything you need to prep for FBLA competition, free.</p>
              <ul className="ed-claims">
                <li>
                  <span className="ed-claim-mark" aria-hidden="true"><PenCheck /></span>
                  Practice tests built from your event&apos;s topic outline
                </li>
                <li>
                  <span className="ed-claim-mark" aria-hidden="true"><PenCheck /></span>
                  An AI judge that scores your role play on the rating sheet
                </li>
                <li>
                  <span className="ed-claim-mark" aria-hidden="true"><PenCheck /></span>
                  A mock regionals your whole chapter takes live
                </li>
              </ul>
            </div>
            <div className="rise rise-3">
              <div className="ed-actions">
                <HeroCta wrap={false} signedOutLabel="Start practicing" className="ed-btn" />
                <Link href="/for-advisors" className="ed-btn ed-btn-outline">
                  For advisors
                </Link>
              </div>
              <p className="ed-finder">
                <Link href="/competitions">Browse all {COMPETITION_STATS.total} events</Link>, or{" "}
                <JumpLink to="find-your-event">take the one-minute quiz</JumpLink> to find yours.
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
          {/* Each item stays on one line, and each dot rides with the item
              before it, so a wrap never splits a phrase or starts a line with a
              dot. On phones the dots hide and the items space out instead. */}
          <p>
            <span className="ed-ledger-item"><strong>{COMPETITION_STATS.total}</strong> events indexed<span className="ed-sep" aria-hidden="true">·</span></span>{" "}
            <span className="ed-ledger-item"><strong>{COMPETITION_STATS.aiEligible}</strong> with practice tests<span className="ed-sep" aria-hidden="true">·</span></span>{" "}
            <span className="ed-ledger-item"><strong>{COMPETITION_STATS.judged}</strong> with an AI judge<span className="ed-sep" aria-hidden="true">·</span></span>{" "}
            <span className="ed-ledger-item">Every answer checked twice<span className="ed-sep" aria-hidden="true">·</span></span>{" "}
            <span className="ed-ledger-item">Always free</span>
          </p>
        </div>
      </section>

      {/* --- FIND YOUR EVENT: the quiz, answerable right here -------------- */}
      <section className="ed-section ed-finder-section" id="find-your-event">
        <div className="container">
          <ScrollReveal>
            <div className="ed-section-head ed-section-head-wide">
              <p className="ed-kicker">Find your event</p>
              <h2 className="ed-h2">Which event is made for you?</h2>
              <p className="ed-muted">
                {QUESTIONS.length} quick questions. We score all {COMPETITION_STATS.total} events against
                your answers and show the three that fit best, with the reason for each. No account needed.
              </p>
            </div>
          </ScrollReveal>
          <div className="ef-embed">
            <EventFinder />
          </div>
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
                Take your first practice test in under a minute, or set up your whole chapter.
              </p>
              <div className="ed-close-actions">
                <HeroCta wrap={false} signedOutLabel="Start practicing free" className="ed-btn" />
                <Link href="/for-advisors" className="ed-btn ed-btn-outline">
                  For advisors
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
