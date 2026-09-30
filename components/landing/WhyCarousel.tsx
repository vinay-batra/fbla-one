"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type KeyboardEvent } from "react";
import { COMPETITION_STATS } from "@/lib/competitions";
import { PenCross } from "@/components/PenMarks";
import { CheckedSheet } from "@/components/landing/CheckedTwice";
import { MistakeStack } from "@/components/landing/MistakeCards";
import { JudgeFlow } from "@/components/landing/JudgeFlow";
import { AdvisorVisual } from "@/components/landing/ForAdvisors";
import { SimVisual } from "@/components/landing/SimVisual";
import { AuthLink } from "@/components/landing/AuthLink";

/**
 * "Why not just ask a chatbot?" as one horizontal walkthrough: five slides,
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

// Ordered by what persuades most: the chapter, then the judge, then trust,
// the real clock, and the mistake bank.
const SLIDES: Slide[] = [
  {
    id: "chapter",
    tab: "Your chapter",
    title: "Run regionals at your next meeting.",
    body: "Put one timed test on the projector. Everyone joins from their phone, the clock is the same for everyone, and the room finds out who would place. Then see who is ready for regionals and who needs help.",
    elsewhere: "each student works alone, and nobody can see who is ready.",
    cta: { href: "/app/chapter", label: "Set up your chapter" },
    visual: (active) => <AdvisorVisual active={active} />,
  },
  {
    id: "judge",
    tab: "The judges",
    title: "Get judged before the judges do.",
    body: `${COMPETITION_STATS.judged} of ${COMPETITION_STATS.total} events end in a role play, presentation or interview. Draw a real-format case, prepare on the real clock, and get back a scored rating sheet with notes on exactly what to fix.`,
    elsewhere: "you can ask it to play judge, but you have to find your event's rating sheet, write the case, and keep the time yourself.",
    cta: { href: "/app/judge", label: "Try a role play" },
    visual: (active) => <JudgeFlow active={active} />,
  },
  {
    id: "checked",
    tab: "Checked answers",
    title: "Every answer, checked twice.",
    body: "A second model solves every question without seeing the answer key. In our testing it threw out about 1 in 4 questions before a student ever saw them.",
    elsewhere: "one model answers in one pass, and a wrong answer sounds just as confident as a right one.",
    visual: () => <CheckedSheet />,
  },
  {
    id: "simulation",
    tab: "The real clock",
    title: "Practice like it's regionals.",
    body: "100 questions in 50 minutes, on your event's official topics, turned in automatically when time runs out.",
    elsewhere: "you get questions, but not a timed, full-length paper that turns itself in and grades itself.",
    cta: { href: "/app/coach", label: "Take a full simulation" },
    visual: (active) => <SimVisual active={active} />,
  },
  {
    id: "mistakes",
    tab: "Your mistakes",
    title: "What you miss comes back.",
    body: "Every question you get wrong returns in later tests until you answer it right twice, on your phone or your laptop.",
    elsewhere: "nothing brings back the questions you missed last week.",
    visual: () => <MistakeStack />,
  },
];

export function WhyCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);
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

  // True while a tab, arrow or Next button is moving the track, so the
  // in-between scroll positions do not overwrite the slide that was asked for.
  const steering = useRef(false);
  const steerTimer = useRef<number | null>(null);

  // Track which slide is showing from the scroll position (covers swipes).
  const onScroll = useCallback(() => {
    const t = trackRef.current;
    if (!t || steering.current) return;
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
    steering.current = true;
    if (steerTimer.current) window.clearTimeout(steerTimer.current);
    const done = () => {
      steering.current = false;
      t.removeEventListener("scrollend", done);
    };
    t.addEventListener("scrollend", done);
    // Browsers without scrollend: release after the smooth scroll has settled.
    steerTimer.current = window.setTimeout(done, 900);
    setIndex(next);
    t.scrollTo({ left: next * t.clientWidth, behavior: reduced ? "auto" : "smooth" });
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
    <div className="wc" role="region" aria-roledescription="carousel" aria-label="Five things a chatbot will not do for you">
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
              <p className="wc-kicker">
                <span className="wc-num">{String(i + 1).padStart(2, "0")}</span> {s.tab}
              </p>
              <h3 className="wc-title">{s.title}</h3>
              <p className="wc-body">{s.body}</p>
              <p className="wc-else">
                <span className="wc-else-mark" aria-hidden="true">
                  <PenCross />
                </span>
                <span>
                  <span className="wc-else-label">With a chatbot,</span> {s.elsewhere}
                </span>
              </p>
              <div className="wc-actions">
                {i < SLIDES.length - 1 ? (
                  <button type="button" className="wc-next" onClick={() => go(i + 1)}>
                    Next: {SLIDES[i + 1].tab} <span aria-hidden="true">→</span>
                  </button>
                ) : (
                  <button type="button" className="wc-next" onClick={() => go(0)}>
                    Back to the start <span aria-hidden="true">↺</span>
                  </button>
                )}
                {s.cta && (
                  <AuthLink href={s.cta.href} className="wc-cta">
                    {s.cta.label} <span aria-hidden="true">→</span>
                  </AuthLink>
                )}
              </div>
            </div>
            <div className="wc-visual">{s.visual(index === i)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
