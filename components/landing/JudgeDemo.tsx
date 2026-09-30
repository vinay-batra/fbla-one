import { COMPETITION_STATS } from "@/lib/competitions";
import { PenCheck } from "@/components/PenMarks";
import { AuthLink } from "@/components/landing/AuthLink";

/**
 * A real AI Judge round, shortened: an International Business role play card
 * and the rating sheet that came back for a deliberately thin response. The
 * wording is the Judge's own output, lightly trimmed. One sentence of the card's case is
 * left out on purpose (it misstated a currency effect; the card prompt has
 * since been tightened), so the case shown is only facts that hold.
 */
const ROWS = [
  { name: "Global trade", score: 6, note: "Correctly ties the EU duty exemption to the sourcing shift, but lacks deeper trade-agreement mechanics." },
  { name: "Impact of government", score: 6, note: "Recognizes the tariff cost and the EU agreement condition, but does not discuss broader policy risk." },
  { name: "Defines the problem and the judges' needs", score: 4, note: "Jumps straight to recommendations without naming the CFO's margin concerns or the VP's export goals." },
  { name: "Clear, workable solution with next steps", score: 6, note: "Hits all four tasks with a concrete dollar figure and timeline, but the cost-benefit math is thin." },
  { name: "Communication and professional presence", score: 5, note: "Organized opening and close, but a very short delivery leaves time unused." },
];

export function JudgeDemo() {
  return (
    <div className="container">
      <div className="ed-section-head ed-section-head-wide">
        <p className="ed-kicker">The AI Judge</p>
        <h2 className="ed-h2">
          More than half of FBLA is decided by <em>judges.</em>
        </h2>
        <p className="ed-muted">
          {COMPETITION_STATS.judged} of {COMPETITION_STATS.total} events end in a role play,
          presentation or interview. Draw a case with the real prep clock, or hand in your script,
          and get it back marked up like a rating sheet.
        </p>
      </div>

      <div className="judge-demo">
        <article className="jd-card" aria-label="Example role play card">
          <div className="jd-card-top">
            <span>Competitive event</span>
            <span>Role play</span>
          </div>
          <p className="jd-event">International Business</p>
          <h3 className="jd-title">Tariff Trouble at Meridian Outdoor Gear</h3>
          <p className="jd-label">Case study situation</p>
          <p className="jd-text">
            Meridian Outdoor Gear, based in Ohio, manufactures hiking boots and sells 40% of its
            200,000 annual units to distributors in Canada, Germany, and Japan. Last month the U.S.
            government imposed a 15% tariff on imported leather, raising per-unit costs by $4.50.
          </p>
          <div className="jd-roles">
            <div>
              <p className="jd-label">Your team&apos;s role</p>
              <p className="jd-text">
                Consultants advising Meridian&apos;s leadership on the tariff increase and its
                international sales.
              </p>
            </div>
            <div>
              <p className="jd-label">The judges play</p>
              <p className="jd-text">
                The CFO and VP of International Sales, who want a plan that protects margins without
                excessive risk.
              </p>
            </div>
          </div>
          <p className="jd-clock">20 minutes to prepare. 7 minutes in front of the judges.</p>
        </article>

        <article className="jd-sheet" aria-label="Example rating sheet">
          <div className="jd-sheet-head">
            <span>Rating sheet</span>
            <span>Practice round</span>
          </div>
          <div className="jd-total">
            <span className="jd-total-num">
              54
              <svg className="pen report-circle jd-circle" viewBox="0 0 120 80" aria-hidden="true">
                <path d="M18 30C28 10 70 4 94 14c18 8 22 30 8 46-16 16-56 18-76 6C6 56 6 38 20 24c8-8 22-12 34-12" />
              </svg>
            </span>
            <p className="jd-verdict">
              You covered every required task with a workable plan, but the pitch was too brief and
              light on numbers to stand out among finalists.
            </p>
          </div>
          <ul className="jd-rows">
            {ROWS.map((r) => (
              <li key={r.name}>
                <span className="jd-score">{r.score}</span>
                <div>
                  <p className="jd-row-name">
                    {r.name} <span className="jd-of">/ 10</span>
                  </p>
                  <p className="jd-note">{r.note}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="jd-strength">
            <PenCheck />
            <span>
              &ldquo;move part of production to the Michigan plant, which is only at 70 percent
              capacity&rdquo; <em>Uses a fact from the card to justify the plan.</em>
            </span>
          </p>
        </article>
      </div>

      <div className="jd-foot">
        <AuthLink href="/app/judge" className="btn btn-accent ed-btn">
          Practice a role play <span aria-hidden="true">→</span>
        </AuthLink>
        <p className="ed-fineprint">
          A real card and rating sheet from the AI Judge, shortened. Practice cards are written by
          ChapterPrep and are not official FBLA cards.
        </p>
      </div>
    </div>
  );
}
