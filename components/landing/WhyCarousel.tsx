"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type KeyboardEvent } from "react";
import { COMPETITION_STATS } from "@/lib/competitions";
import { CheckedSheet } from "@/components/landing/CheckedTwice";
import { MistakeStack } from "@/components/landing/MistakeCards";
import { JudgeVisual } from "@/components/landing/JudgeDemo";
import { EventTypes } from "@/components/landing/EventTypes";
import { AdvisorVisual } from "@/components/landing/ForAdvisors";
import { SimVisual } from "@/components/landing/SimVisual";
import { AuthLink } from "@/components/landing/AuthLink";

/**
 * "Why not just ask a chatbot?" as one horizontal walkthrough: six slides,
 * each a short claim, what you get elsewhere, and the thing itself. It replaces
 * five full-length sections, so the page stays short without losing anything.
 *
 * Native horizontal scroll with snap points does the moving (swipe, trackpad,
 * shift-wheel all work and nothing hijacks vertical scrolling); tabs, arrows
 * and the keyboard drive the same scroll. The active slide gets `is-active`,
 * which replays its red-pen marks and starts the simulation clock.
 */
type Slide = {
  id: string;
  tab: string;
  title: string;
  body: string;
  elsewhere: string;
  cta?: { href: string; label: string };
  visual: (active: boolean) => ReactNode;
};

const SLIDES: Slide[] = [
  {
    id: "checked",
    tab: "Checked answers",
    title: "Every answer, checked twice.",
    body: "A second model solves every question without seeing the answer key. On a full test in our testing it threw out about 1 in 4 before a student saw them.",
    elsewhere: "One model, one pass, no independent check.",
    visual: () => <CheckedSheet />,
  },
  {
    id: "event",
    tab: "Your event",
    title: "Built on your actual event.",
    body: `All ${COMPETITION_STATS.total} events checked against FBLA's official 2026-27 guidelines: how each is judged, what it covers, how long you get.`,
    elsewhere: "Only knows your event's rules if you paste them in.",
    visual: () => <EventTypes />,
  },
  {
    id: "judge",
    tab: "Judges",
    title: "Practice for the judges.",
    body: `${COMPETITION_STATS.judged} of ${COMPETITION_STATS.total} events end in a role play, presentation or interview. Draw a case with the real clock and get scored on the rating sheet.`,
    elsewhere: "No rating sheet, no prep clock, no score.",
    cta: { href: "/app/judge", label: "Practice a role play" },
    visual: () => <JudgeVisual />,
  },
  {
    id: "mistakes",
    tab: "Mistakes",
    title: "What you miss comes back.",
    body: "Every question you get wrong returns in later tests until you answer it right twice. It follows your account to any device.",
    elsewhere: "Nothing brings back what you missed last week.",
    visual: () => <MistakeStack />,
  },
  {
    id: "simulation",
    tab: "The clock",
    title: "Practice like it's regionals.",
    body: "A full simulation: 100 questions in 50 minutes, turned in automatically when time runs out.",
    elsewhere: "No clock, no test format, no pressure.",
    cta: { href: "/app/coach", label: "Take a full simulation" },
    visual: (active) => <SimVisual active={active} />,
  },
  {
    id: "chapter",
    tab: "Chapter",
    title: "Bring the whole chapter.",
    body: "Advisors run Mock Regionals at meetings, see who is ready and who needs help, and export regional registration in one file.",
    elsewhere: "Everyone studies alone. Nobody knows who is ready.",
    cta: { href: "/app/chapter", label: "Set up your chapter" },
    visual: () => <AdvisorVisual />,
  },
];

export function WhyCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  indexRef.current = index;
  const [height, setHeight] = useState<number | null>(null);

  // When the carousel's WIDTH changes (window resize, phone rotation), the old
  // scroll offset no longer lines up with a slide and the browser re-snaps,
  // often back to the first one. Put the current slide back in place. Height
  // changes (the track animates its height per slide) are ignored, so they
  // never interrupt a smooth scroll.
  useEffect(() => {
    const t = trackRef.current;
    if (!t) return;
    let lastWidth = t.clientWidth;
    const ro = new ResizeObserver(() => {
      if (t.clientWidth === lastWidth) return;
      lastWidth = t.clientWidth;
      t.scrollTo({ left: indexRef.current * t.clientWidth, behavior: "auto" });
    });
    ro.observe(t);
    return () => ro.disconnect();
  }, []);

  // Track which slide is showing from the scroll position (covers swipes).
  const onScroll = useCallback(() => {
    const t = trackRef.current;
    if (!t) return;
    const i = Math.round(t.scrollLeft / t.clientWidth);
    setIndex((prev) => (prev === i ? prev : Math.max(0, Math.min(SLIDES.length - 1, i))));
  }, []);

  // Keep the active tab in view in the tab row (it scrolls sideways on phones).
  useEffect(() => {
    const tab = tabRefs.current[index];
    const row = tab?.parentElement;
    if (!tab || !row) return;
    const left = tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [index]);

  // The track takes the height of the slide showing, so a short slide does not
  // leave a tall gap under it.
  useEffect(() => {
    const el = slideRefs.current[index];
    if (!el) return;
    const measure = () => setHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [index]);

  const go = (i: number) => {
    const t = trackRef.current;
    if (!t) return;
    const next = Math.max(0, Math.min(SLIDES.length - 1, i));
    const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    t.scrollTo({ left: next * t.clientWidth, behavior: reduced ? "auto" : "smooth" });
    setIndex(next);
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const n = (i + dir + SLIDES.length) % SLIDES.length;
    go(n);
    tabRefs.current[n]?.focus();
  };

  return (
    <div className="wc" role="region" aria-roledescription="carousel" aria-label="Six things a chatbot will not do for you">
      <div className="wc-bar">
        <div className="wc-tabs" role="tablist" aria-label="Jump to">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              aria-selected={index === i}
              aria-controls={`wc-slide-${s.id}`}
              tabIndex={index === i ? 0 : -1}
              className="wc-tab"
              onClick={() => go(i)}
              onKeyDown={(e) => onTabKey(e, i)}
            >
              <span className="wc-tab-n">{i + 1}</span>
              {s.tab}
            </button>
          ))}
        </div>
        <div className="wc-arrows">
          <span className="wc-count" aria-live="polite">
            {index + 1} of {SLIDES.length}
          </span>
          <button type="button" className="wc-arrow" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous">
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            className="wc-arrow"
            onClick={() => go(index + 1)}
            disabled={index === SLIDES.length - 1}
            aria-label="Next"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="wc-track"
        onScroll={onScroll}
        style={height ? { height } : undefined}
      >
        {SLIDES.map((s, i) => (
          <div
            key={s.id}
            id={`wc-slide-${s.id}`}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            role="tabpanel"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${SLIDES.length}: ${s.tab}`}
            className={`wc-slide${index === i ? " is-active" : ""}`}
          >
            <div className="wc-copy">
              <h3 className="wc-title">{s.title}</h3>
              <p className="wc-body">{s.body}</p>
              <p className="wc-else">
                <span className="wc-else-label">A chatbot:</span> {s.elsewhere}
              </p>
              {s.cta && (
                <AuthLink href={s.cta.href} className="wc-cta">
                  {s.cta.label} <span aria-hidden="true">→</span>
                </AuthLink>
              )}
              {i < SLIDES.length - 1 && (
                <button type="button" className="wc-next" onClick={() => go(i + 1)}>
                  Next: {SLIDES[i + 1].tab} <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
            <div className="wc-visual">{s.visual(index === i)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
