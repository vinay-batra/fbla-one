"use client";

import { useState } from "react";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { HeroBadge } from "@/components/HeroBadge";

type QA = { q: string; a: string };
type Section = { title: string; items: QA[] };

const SECTIONS: Section[] = [
  {
    title: "Getting Started",
    items: [
      {
        q: "What is FBLA One?",
        a: "An all-in-one platform for FBLA chapters. Competition guides, study resources, prep tracker, and chapter management - everything you'd otherwise put in a Drive folder, but actually usable.",
      },
      {
        q: "Who is it for?",
        a: "Two audiences: FBLA members preparing for competitions, and FBLA advisors managing their chapter. Both get the full feature set.",
      },
      {
        q: "Is it really free?",
        a: "Yes. FBLA One is free for every student and every chapter, forever. No paid tiers, no upsells, no card required.",
      },
      {
        q: "Do I need an account?",
        a: "You can browse all competition guides without an account. To use AI practice tests, track your prep, save resources, or join a chapter, you need a free account. You can also preview the full app without signing up -- just click 'Preview the app' on the homepage.",
      },
    ],
  },
  {
    title: "Competitions & content",
    items: [
      {
        q: "How many events do you cover?",
        a: "All 55 FBLA competitive events are in the registry, and all 55 now have complete content: event description, test format details, topic list, and curated study resources. Objective-test events also support AI practice test generation.",
      },
      {
        q: "Why do some events say the topic is released annually?",
        a: "Presentation, production, and case-study events use year-specific prompts or briefs released by FBLA. The platform covers the underlying skills and knowledge for all of them -- how to build a business plan, how to shoot and edit a video, how to analyze an ethics scenario -- even though the specific topic changes each year.",
      },
      {
        q: "Are the study resources official FBLA materials?",
        a: "No. We link to free, high-quality external resources (Khan Academy, AccountingCoach, Investopedia, Professor Messer, MDN, etc.) that match each event's topic outline. We are not affiliated with FBLA-PBL Inc.",
      },
      {
        q: "Can I suggest a resource?",
        a: "Yes -- email hello@fbla.one with the event name and the resource URL. We review and add good ones quickly.",
      },
    ],
  },
  {
    title: "AI Practice Tests",
    items: [
      {
        q: "How does the AI practice test work?",
        a: "You pick a competition and a question count (10, 25, or 50). Claude generates realistic multiple-choice questions calibrated to that event's exact topic outline -- the same topics listed on the event's page. Questions stream in live as they're generated. After you submit, every wrong answer gets a full explanation.",
      },
      {
        q: "How accurate are the AI-generated questions?",
        a: "The questions are designed to match FBLA national-level difficulty and are built from each event's official topic list. They are a study tool, not official FBLA materials. Use them alongside the official FBLA event description and topic outline.",
      },
      {
        q: "Which events support AI practice tests?",
        a: "All 45 objective-test events -- the ones with a 60-minute, 100-question multiple-choice format. Presentation, case-study, and production events don't have a standardized test, so AI practice tests aren't applicable for those.",
      },
      {
        q: "Do my scores get saved?",
        a: "Yes. After reviewing your results, click 'Log score to tracker' and the score is saved to your practice tracker. The dashboard shows your score trend over time per competition.",
      },
      {
        q: "Is there a limit on how many tests I can generate?",
        a: "No limit. Generate as many as you want. Every test produces a fresh set of questions -- no two tests are the same.",
      },
    ],
  },
  {
    title: "Privacy & Security",
    items: [
      {
        q: "Do you sell student data?",
        a: "No. We don't sell, share, or rent your data to anyone. Period.",
      },
      {
        q: "Where is my data stored?",
        a: "Supabase (Postgres, hosted on AWS US-East). Practice logs, saved resources, and account info live there. We use industry-standard encryption at rest and in transit.",
      },
      {
        q: "Can I delete my account?",
        a: "Yes, from Settings. Account deletion removes all your data within 30 days.",
      },
    ],
  },
  {
    title: "Chapters & advisors",
    items: [
      {
        q: "How do advisors set up a chapter?",
        a: "Go to Chapter in the left nav, sign in, and click 'Create a chapter.' You'll get a 5-character invite code to share with members. Members enter the code under 'Join a chapter' to link their account to your chapter.",
      },
      {
        q: "What can advisors see?",
        a: "Advisors see a member roster listing every member who joined, their role, and all the competitions they have registered for. You can also see recent member practice activity -- who practiced, what event, and their score.",
      },
      {
        q: "Can I export member sign-ups for regionals?",
        a: "Yes. The advisor view has two export buttons: a full member roster CSV and a competition sign-ups CSV with one row per member per event -- useful for regional registration forms.",
      },
      {
        q: "Is FBLA One affiliated with FBLA-PBL?",
        a: "No. Independent platform built by an FBLA student. Not endorsed by or affiliated with FBLA-PBL Inc.",
      },
    ],
  },
];

export default function FAQ() {
  return (
    <>
      <section style={{ padding: "100px 0 40px" }}>
        <div className="container" style={{ maxWidth: 820, marginInline: "auto", textAlign: "center" }}>
          <ScrollReveal>
            <HeroBadge>Frequently asked</HeroBadge>
          </ScrollReveal>
          <ScrollReveal delay={0.05}>
            <h1 style={{ marginTop: 22 }}>
              Questions, <span style={{ color: "var(--accent)" }}>answered.</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p style={{ marginTop: 18, fontSize: 17, color: "var(--text2)", lineHeight: 1.6 }}>
              Don't see your question? <Link href="mailto:hello@fbla.one" className="animated-link" style={{ color: "var(--accent)" }}>Email us.</Link>
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
          overflow: "hidden",
          transition: "max-height 0.3s ease, opacity 0.25s ease",
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
