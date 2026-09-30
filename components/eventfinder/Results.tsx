"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FORMAT_LABEL } from "@/lib/competitions";
import { QUESTIONS, selectedValues, type Answers } from "./questions";
import { caveatOf, rankEvents, teamLabel, whySentence, type Scored } from "./scoring";

/**
 * The reveal. The best match gets its own sheet of paper with its name set
 * large in the serif and "Best fit" circled in red pen; the next picks follow
 * as a numbered list. Nothing here is random: the same answers always produce
 * the same list, and "How this was scored" shows the arithmetic.
 */

const STEP = 3;
const MAX_SHOWN = 9;

function Chips({ s }: { s: Scored }) {
  return (
    <div className="ef-chips">
      <span className="chip chip-format">{FORMAT_LABEL[s.event.format]}</span>
      <span className="chip">{teamLabel(s.traits)}</span>
      {s.traits.intro && <span className="chip">Grades 9 and 10</span>}
    </div>
  );
}

/**
 * Stagger for a runner-up's entrance. The first two wait for the top card's
 * reveal; a batch added by "See 3 more" starts right away. Cards already on
 * screen never replay, since the animation only runs when a card mounts.
 */
function runnerDelay(index: number) {
  return index < STEP ? 0.55 + (index - 1) * 0.1 : (index % STEP) * 0.08;
}

function fmt(n: number) {
  const r = Math.round(n * 10) / 10;
  return r > 0 ? `+${r}` : `${r}`;
}

/** The labels of every answer picked, in question order. */
function answerSummary(a: Answers): string[] {
  return QUESTIONS.flatMap((q) => {
    const vals = selectedValues(a, q.id);
    return q.choices.filter((c) => vals.includes(c.value)).map((c) => c.short ?? c.label);
  });
}

export function Results({ answers, onRestart }: { answers: Answers; onRestart: () => void }) {
  const ranked = useMemo(() => rankEvents(answers), [answers]);
  const [shown, setShown] = useState(STEP);
  const headRef = useRef<HTMLHeadingElement>(null);
  const moreRef = useRef<HTMLLIElement>(null);
  const firstShow = useRef(true);

  // Bring the reveal into view and hand focus to it.
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    headRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    headRef.current?.focus({ preventScroll: true });
  }, []);

  // After "See 3 more", move focus to the first newly shown event.
  useEffect(() => {
    if (firstShow.current) {
      firstShow.current = false;
      return;
    }
    moreRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
  }, [shown]);

  const top = ranked[0];
  if (!top) return null;
  const rest = ranked.slice(1, Math.min(shown, MAX_SHOWN));
  const firstNew = shown - STEP; // index in `ranked` of the first card added by the last "See 3 more"
  const canMore = shown < Math.min(MAX_SHOWN, ranked.length);
  const caveat = caveatOf(top);
  const summary = answerSummary(answers);

  return (
    <section className="ef-results" aria-labelledby="ef-top-name">
      <p className="ef-results-kicker">
        Scored against all {ranked.length} events you can enter
      </p>

      <div className="sheet-stack">
      <article className="sheet ef-top">
        <div className="ef-bestfit" aria-hidden="true">
          <span>Best fit</span>
          <svg className="pen ef-bestfit-circle" viewBox="0 0 150 64" preserveAspectRatio="none">
            <path
              pathLength={1}
              d="M24 22C42 8 104 4 132 16c16 7 15 26-6 35-28 11-84 11-106-2C4 41 6 27 22 18c13-7 32-9 50-8"
            />
          </svg>
        </div>
        <p className="sr-only">Your best fit:</p>
        <h2 id="ef-top-name" ref={headRef} tabIndex={-1} className="ef-top-name">
          {top.event.name}
        </h2>
        <p className="ef-why">{whySentence(top)}</p>
        {caveat && <p className="ef-caveat">{caveat}</p>}
        <Chips s={top} />
        <p className="ef-desc">{top.event.description}</p>
        <div className="ef-top-foot">
          <Link href={`/competitions/${top.event.slug}`} className="btn btn-accent ef-cta">
            Open the {top.event.name} prep page <span aria-hidden="true">→</span>
          </Link>
        </div>
        <details className="ef-math">
          <summary>How this was scored</summary>
          <ul>
            {top.parts.map((p, i) => (
              <li key={i}>
                <span>{p.label}</span>
                <span className="ef-pts">{fmt(p.points)}</span>
              </li>
            ))}
            <li className="ef-total">
              <span>Total</span>
              <span className="ef-pts">{top.score}</span>
            </li>
          </ul>
          <p>
            Every event is scored the same way from your answers, highest first. No AI, and nothing you
            picked leaves this page.
          </p>
        </details>
      </article>
      </div>

      {rest.length > 0 && (
        <>
          <h3 className="ef-rest-title">Also a strong fit</h3>
          <ol className="ef-rest">
            {rest.map((s, i) => {
              const rank = i + 2;
              const caveatLine = caveatOf(s);
              return (
                <li
                  key={s.event.slug}
                  ref={rank - 1 === firstNew ? moreRef : undefined}
                  className="ef-runner"
                  style={{ animationDelay: `${runnerDelay(rank - 1)}s` }}
                >
                  <span className="ef-rank" aria-hidden="true">
                    {rank}
                  </span>
                  <div className="ef-runner-body">
                    <h4 className="ef-runner-name">
                      <Link href={`/competitions/${s.event.slug}`} className="ef-runner-link">
                        <span className="sr-only">Number {rank}: </span>
                        {s.event.name}
                      </Link>
                    </h4>
                    <p className="ef-runner-why">{whySentence(s)}</p>
                    {caveatLine && <p className="ef-caveat">{caveatLine}</p>}
                    <Chips s={s} />
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}

      <div className="ef-actions">
        {canMore && (
          <button type="button" className="btn btn-ghost" onClick={() => setShown((n) => n + STEP)}>
            See 3 more
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={onRestart}>
          Start over
        </button>
        <Link href="/competitions" className="sheet-link ef-browse">
          Browse every event
        </Link>
      </div>

      <p className="ef-answers">
        <span className="ef-answers-label">Your answers:</span> {summary.join(", ")}
      </p>
    </section>
  );
}
