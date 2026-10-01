"use client";

import { useState } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { HeroBadge } from "@/components/HeroBadge";
import { COMPETITION_STATS } from "@/lib/competitions";
import { DAILY_LIMITS } from "@/lib/ai-limits";
import { PenUnderline } from "@/components/PenUnderline";

type QA = { q: string; a: string };
type Section = { title: string; items: QA[] };

const SECTIONS: Section[] = [
  {
    title: "Getting Started",
    items: [
      {
        q: "What is ChapterPrep?",
        a: "Free prep for FBLA competitive events: practice tests built from each event's topic outline, an AI judge for role plays and presentations, a guide and study resources for every event, and tools for advisors to run their chapter, including a live mock regionals.",
      },
      {
        q: "Who is it for?",
        a: "Two audiences: FBLA members preparing for competitions, and FBLA advisors running their chapter. Students get the practice tools; advisors also get the chapter tools: invites, assignments, the readiness report and hosting Mock Regionals.",
      },
      {
        q: "Is it really free?",
        a: "Yes. ChapterPrep is free for every student and every chapter, forever. No paid tiers, no upsells, no card required.",
      },
      {
        q: "Do I need an account?",
        a: "You can browse all competition guides without an account. To use AI practice tests, track your prep, save resources, or join a chapter, you need a free account. Creating one takes under a minute and it is always free.",
      },
    ],
  },
  {
    title: "Competitions & content",
    items: [
      {
        q: "How many events do you cover?",
        a: `All ${COMPETITION_STATS.total} FBLA competitive events are in the registry. ${COMPETITION_STATS.withContent} of them have full prep content today: event description, test format details, topic list, and curated study resources.${COMPETITION_STATS.withContent < COMPETITION_STATS.total ? " The rest are listed with a prep page on the way." : ""} Every event with an objective test also supports AI practice test generation.`,
      },
      {
        q: "Why do some events say the topic is released annually?",
        a: "Presentation events (and the role play finals) use year-specific topics, cases, or scenarios released by FBLA. The platform covers the underlying skills and knowledge for all of them (how to build a business plan, how to shoot and edit a video, how to analyze an ethics scenario) even though the specific topic changes each year.",
      },
      {
        q: "Are the study resources official FBLA materials?",
        a: "No. We link to free, high-quality external resources (Khan Academy, AccountingCoach, Investopedia, Professor Messer, MDN, etc.) that match each event's topic outline. We are not affiliated with Future Business Leaders of America, Inc.",
      },
      {
        q: "Can I suggest a resource?",
        a: "Yes. Send the event name and the resource URL through the feedback button (the flag) in the corner of any page. Good ones get added.",
      },
    ],
  },
  {
    title: "AI Practice Tests",
    items: [
      {
        q: "How does the AI practice test work?",
        a: "Pick your event and a length (10, 25 or 50 questions), or the full 100-question simulation on a 50-minute clock. ChapterPrep writes multiple-choice questions from that event's topic outline, a second AI checks each answer before you see it, and after you submit every question comes with an explanation. Questions you miss come back in later tests until you get them right twice.",
      },
      {
        q: "How accurate are the AI-generated questions?",
        a: "Every question is built from the event's official topic list, and a second AI answers it on its own without the key; only questions where both agree reach you. If the checker is unavailable the test tells you. AI can still be wrong, so treat the questions as a study tool, not official FBLA materials, and use them alongside the official event guidelines.",
      },
      {
        q: "Which events support AI practice tests?",
        a: `${COMPETITION_STATS.aiEligible} events: every event that includes the 50-minute, 100-question objective (multiple-choice) test. That covers the test-only events, the role play events (everyone takes the test before the role play final), and Future Business Leader and Business Ethics. Presentation, production, and chapter events have no multiple-choice test, so AI practice tests do not apply to those.`,
      },
      {
        q: "Do my scores get saved?",
        a: "Yes. Every graded test is saved to your practice history automatically. The dashboard shows your average, your weakest topics and your score trend for your event.",
      },
      {
        q: "Is there a limit on how many tests I can generate?",
        a: `Yes, a generous daily one so the site can stay free: ${DAILY_LIMITS.questions.account} practice questions, ${DAILY_LIMITS.judge.account} AI Judge actions and ${DAILY_LIMITS.chat.account} chat messages a day per account. Limits reset at midnight Eastern, and a normal study day stays well under them.`,
      },
    ],
  },
  {
    title: "Privacy & Security",
    items: [
      {
        q: "Do you sell student data?",
        a: "No. Your data is never sold or shared with advertisers. It is only processed by the services that run the site (Supabase, Vercel and Anthropic), and your chapter advisor can see your practice results. The privacy policy has the details.",
      },
      {
        q: "Where is my data stored?",
        a: "Supabase (Postgres, hosted on AWS US-East). Practice logs, saved resources, and account info live there. We use industry-standard encryption at rest and in transit.",
      },
      {
        q: "Can I delete my account?",
        a: "Yes, from Settings. Deleting your account permanently removes your profile, event registration, practice history, missed-question bank and saved resources.",
      },
    ],
  },
  {
    title: "Chapters & advisors",
    items: [
      {
        q: "How do advisors set up a chapter?",
        a: "Sign up as an advisor, open Chapter, name your chapter and press Create chapter. You get an invite link, a QR code and an 8-character code. Members who open the link or scan the code join automatically; anyone can also type the code under Join your chapter.",
      },
      {
        q: "What can advisors see?",
        a: "Advisors see every member who joined, their event, and a readiness report: practice volume, test average, trend, latest judge score, weakest topics and a Ready, On track or Needs attention status. Members only see practice counts for each other on the leaderboard, never scores.",
      },
      {
        q: "Can I export member sign-ups for regionals?",
        a: "Yes. The advisor view has two export buttons: a full member roster CSV and a competition sign-ups CSV with one row per member per event, which is the shape regional registration forms want.",
      },
      {
        q: "Is ChapterPrep affiliated with FBLA?",
        a: "No. Independent platform built by an FBLA student. Not endorsed by or affiliated with Future Business Leaders of America, Inc.",
      },
    ],
  },
];

/**
 * FAQPage structured data. The answers are already in the DOM, so this is the
 * cheapest structured-data win available and makes the page eligible for rich
 * results. Built from SECTIONS so it can never drift from the rendered copy.
 */
const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: SECTIONS.flatMap((section) =>
    section.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    }))
  ),
};

export default function FAQ() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <section style={{ padding: "100px 0 40px" }}>
        <div className="container" style={{ maxWidth: 820, marginInline: "auto", textAlign: "center" }}>
          <ScrollReveal>
            <HeroBadge>Frequently asked</HeroBadge>
          </ScrollReveal>
          <ScrollReveal delay={0.05}>
            <h1 style={{ marginTop: 22 }}>
              What students and advisors <PenUnderline>ask first.</PenUnderline>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p style={{ marginTop: 18, fontSize: 17, color: "var(--text2)", lineHeight: 1.6 }}>
              Don&apos;t see your question?{" "}
              <button
                type="button"
                className="faq-ask-ai"
                onClick={() => window.dispatchEvent(new Event("chapterprep:open-chat"))}
              >
                Ask the AI in the bottom right corner.
              </button>
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section style={{ padding: "40px 0 100px" }}>
        <div className="container" style={{ maxWidth: 820, marginInline: "auto" }}>
          {SECTIONS.map((s, i) => (
            <SectionBlock key={s.title} section={s} delay={i * 0.04} />
          ))}
        </div>
      </section>
    </>
  );
}

function SectionBlock({ section, delay }: { section: Section; delay: number }) {
  return (
    <ScrollReveal delay={delay}>
      <div style={{ marginBottom: 56 }}>
        <h2
          className="eyebrow"
          style={{ fontSize: 11, marginBottom: 18 }}
        >
          {section.title}
        </h2>
        <div
          style={{
            border: "0.5px solid var(--border)",
            borderRadius: 14,
            overflow: "hidden",
            background: "var(--card-bg)",
          }}
        >
          {section.items.map((item, i) => (
            <Accordion key={item.q} item={item} divider={i > 0} />
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}

function Accordion({ item, divider }: { item: QA; divider?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: divider ? "0.5px solid var(--border)" : "none" }}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        style={{
          width: "100%",
          padding: "18px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          textAlign: "left",
          color: "var(--text)",
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: "-0.005em",
          background: "transparent",
          transition: "background 0.15s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg2)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span>{item.q}</span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            color: open ? "var(--accent)" : "var(--text3)",
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s ease, color 0.2s ease",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      <div
        style={{
          maxHeight: open ? 500 : 0,
          opacity: open ? 1 : 0,
          visibility: open ? "visible" : "hidden",
          overflow: "hidden",
          transition: "max-height 0.3s ease, opacity 0.25s ease, visibility 0.3s ease",
        }}
      >
        <p
          style={{
            padding: "0 22px 20px",
            fontSize: 14,
            color: "var(--text2)",
            lineHeight: 1.65,
          }}
        >
          {item.a}
        </p>
      </div>
    </div>
  );
}
