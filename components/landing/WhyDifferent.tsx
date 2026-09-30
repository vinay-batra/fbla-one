import Link from "next/link";
import { COMPETITION_STATS } from "@/lib/competitions";

/**
 * The page's table of contents, written as the answer to the question every
 * visitor has: why not just ask a chatbot? Each row sets what you would get
 * elsewhere against what ChapterPrep does, then points to the section below
 * that shows it. Alternatives are described generically, never named, so every
 * claim here is one we can stand behind.
 */
const ROWS = [
  {
    n: "I",
    title: "Answers you can trust",
    value: "checked twice",
    elsewhere: "A chatbot can state a wrong answer with total confidence.",
    here: "Every practice question is solved a second time by a separate model that never sees the answer key. If it cannot confirm the answer, the question is thrown out.",
    href: "#checked",
  },
  {
    n: "II",
    title: "Built on the real event",
    value: `${COMPETITION_STATS.total} events`,
    elsewhere: "Shared flashcard sets drift out of date and study the wrong topics.",
    here: `All ${COMPETITION_STATS.total} events checked against FBLA's official 2026-27 guidelines: how each is judged, what it covers, and how long you get.`,
    href: "#event-types",
  },
  {
    n: "III",
    title: "Practice for the judges",
    value: `${COMPETITION_STATS.judged} events`,
    elsewhere: "Most practice stops at multiple choice.",
    here: `${COMPETITION_STATS.judged} events are decided by a role play, presentation or interview. The AI Judge hands you a case or reads your script, then scores it against the rating sheet.`,
    href: "#judge",
  },
  {
    n: "IV",
    title: "Mistakes come back",
    value: "right twice",
    elsewhere: "A new chat forgets everything you missed.",
    here: "Every question you miss returns in later tests until you get it right twice, on your phone or your laptop.",
    href: "#mistakes",
  },
  {
    n: "V",
    title: "Practice like it's regionals",
    value: "100 in 50:00",
    elsewhere: "No clock, no pressure, no real format.",
    here: "A full simulation: 100 questions in 50 minutes, turned in automatically when time runs out.",
    href: "#checked",
  },
  {
    n: "VI",
    title: "Your whole chapter",
    value: "free, always",
    elsewhere: "Everyone studies alone and nobody knows who is ready.",
    here: "Advisors see who is ready, run Mock Regionals at meetings, and export regional registration in one file.",
    href: "#advisors",
  },
];

export function WhyDifferent() {
  return (
    <div className="container ed-contents-grid">
      <div className="ed-section-head">
        <p className="ed-kicker">Contents</p>
        <h2 className="ed-h2">Why not just ask a chatbot?</h2>
        <p className="ed-muted">
          Fair question. Here is what you get here that a chatbot or a shared flashcard set will not
          give you, and where to see it on this page.
        </p>
      </div>
      <ol className="toc why">
        {ROWS.map((r) => (
          <li key={r.n} className="toc-row">
            <div className="toc-line">
              <span className="toc-n">{r.n}</span>
              <span className="toc-title">{r.title}</span>
              <span className="toc-leader" aria-hidden="true" />
              <span className="toc-value">{r.value}</span>
            </div>
            <p className="why-else">
              <span className="why-label">Elsewhere</span> {r.elsewhere}
            </p>
            <p className="toc-body">
              {r.here}{" "}
              <Link href={r.href} className="why-see">
                See it<span className="sr-only">: {r.title}</span>
              </Link>
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
