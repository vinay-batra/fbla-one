
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

/** Card and rating sheet side by side; the sheet shows three of its rows. */
export function JudgeVisual() {
  return (
    <div className="judge-demo">
      <article className="jd-card" aria-label="Example role play card">
        <div className="jd-card-top">
          <span>Competitive event</span>
          <span>Role play</span>
        </div>
        <p className="jd-event">International Business</p>
        <h4 className="jd-title">Tariff Trouble at Meridian Outdoor Gear</h4>
        <p className="jd-text">
          Meridian Outdoor Gear, based in Ohio, sells 40% of its 200,000 annual units abroad. A new
          15% tariff on imported leather just raised per-unit costs by $4.50.
        </p>
        <p className="jd-label">The judges play</p>
        <p className="jd-text">The CFO and VP of International Sales.</p>
        <p className="jd-clock">20 minutes to prepare. 7 in front of the judges.</p>
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
          <p className="jd-verdict">A workable plan, but too brief and light on numbers to stand out among finalists.</p>
        </div>
        <ul className="jd-rows">
          {ROWS.filter((_, i) => i !== 1 && i !== 4).map((r) => (
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
      </article>
    </div>
  );
}
