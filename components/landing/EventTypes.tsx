"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { COMPETITIONS, COMPETITION_STATS, formatGroup, type FormatGroup } from "@/lib/competitions";

/**
 * "Which kind of event is yours?" Three tabs for the three ways an FBLA event
 * is decided. Counts and example events are derived from the registry; the
 * format facts match FBLA's 2026-27 guidelines (most tests: 100 questions in
 * 50 minutes; most role plays: 20 minutes of prep, 7 minutes with judges).
 */
const TABS: { id: FormatGroup; label: string; what: string; help: string[] }[] = [
  {
    id: "test",
    label: "A test",
    what: "A timed objective test, most of them 100 multiple-choice questions in 50 minutes. The highest scores advance.",
    help: [
      "Practice tests built from your event's official topic outline, every answer checked by a second model",
      "A score for every topic, and one tap to drill the weakest",
      "A full 100-question, 50-minute simulation",
    ],
  },
  {
    id: "role-play",
    label: "A test, then a role play",
    what: "Everyone takes a 100-question test first. The top scorers then get a business case, about 20 minutes to prepare, and 7 minutes with the judges.",
    help: [
      "Practice tests for the test round, checked twice",
      "Role play cards with the real prep and performance clocks",
      "Your response scored against the rating sheet, with what a finalist would do differently",
    ],
  },
  {
    id: "presentation",
    label: "A presentation or interview",
    what: "You prepare a presentation, project or interview, and judges score it on a rating sheet, often with questions at the end.",
    help: [
      "The AI Judge reads or listens to your script and scores every rating-sheet item",
      "Follow-up questions like real judges ask, scored as a second round",
      "Events that also have a test get practice tests too",
    ],
  },
];

function examples(group: FormatGroup) {
  const all = COMPETITIONS.filter((c) => formatGroup(c) === group);
  return [...all.filter((c) => c.popular), ...all.filter((c) => !c.popular)].slice(0, 4);
}

export function EventTypes() {
  const [active, setActive] = useState<FormatGroup>("test");
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const tab = TABS.find((t) => t.id === active)!;

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + TABS.length) % TABS.length;
    setActive(TABS[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div className="container">
      <div className="ed-section-head ed-section-head-wide">
        <p className="ed-kicker">Your event</p>
        <h2 className="ed-h2">Which kind of event is yours?</h2>
        <p className="ed-muted">
          Every FBLA event is decided one of three ways. Each needs different practice.
        </p>
      </div>

      <div className="et-tabs" role="tablist" aria-label="Kinds of events">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`et-tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls="et-panel"
            tabIndex={active === t.id ? 0 : -1}
            className="et-tab"
            onClick={() => setActive(t.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            <span className="et-tab-label">{t.label}</span>
            <span className="et-tab-count">{COMPETITION_STATS.byGroup[t.id]} events</span>
          </button>
        ))}
      </div>

      <div id="et-panel" role="tabpanel" aria-labelledby={`et-tab-${active}`} className="et-panel">
        <div>
          <p className="et-what">{tab.what}</p>
          <p className="jd-label">How ChapterPrep helps</p>
          <ul className="et-help">
            {tab.help.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="jd-label">For example</p>
          <ul className="et-examples">
            {examples(active).map((c) => (
              <li key={c.slug}>
                <Link href={`/competitions/${c.slug}`}>{c.name}</Link>
              </li>
            ))}
          </ul>
          <Link href="/competitions" className="ed-textlink">
            Browse every event <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      <p className="et-quiz">
        Not sure which one fits you? <Link href="/find-your-event">Take the one-minute quiz</Link>
      </p>
    </div>
  );
}
