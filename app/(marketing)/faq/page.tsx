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
        a: "You can browse competitions without an account. To track your prep, save resources, or join a chapter, sign up. Free.",
      },
    ],
  },
  {
    title: "Competitions",
    items: [
      {
        q: "How many events do you cover?",
        a: "All of FBLA's competitive events are in the registry. About 25 have full content today (description, test format, topics, curated study resources). The rest get fleshed out as members request them.",
      },
      {
        q: "Why don't presentation events have full content?",
        a: "Presentation and production events use year-specific prompts released by FBLA. We don't know the prompts in advance, so we list the event but mark it 'coming soon' until the topic drops.",
      },
      {
        q: "Are the study resources official FBLA materials?",
        a: "No. We link out to free, high-quality external resources (Khan Academy, AccountingCoach, Investopedia, Professor Messer, etc.) that match each event's test topics. We're not affiliated with FBLA Inc.",
      },
      {
        q: "Can I suggest a resource?",
        a: "Yes - email hello@fbla.one with the event name and the resource. We review and add good ones within a few days.",
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
        q: "How do advisors use it?",
        a: "Advisor features (member roster, chapter-wide deadlines, sign-up overview) are still being built. They'll ship free for every chapter when ready.",
      },
      {
        q: "How do I get my chapter on?",
        a: "There's no chapter onboarding flow yet - members just sign up individually for now. Multi-member chapter accounts ship with the advisor features.",
      },
      {
        q: "Is FBLA One affiliated with FBLA?",
        a: "No. Independent platform built by an FBLA student for FBLA students. Not endorsed by FBLA-PBL Inc.",
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
