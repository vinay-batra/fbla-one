import { PenCircle, PenCheck } from "@/components/PenMarks";

/**
 * The trust pitch. A real generated question (Economics; the key was also
 * checked by hand: (145 - 120) / 120 = 20.83%), shown with the two checks every
 * question passes before a student sees it. The rejection figure is from an
 * actual 100-question Business Law paper: 134 questions checked, 100 kept.
 */
const OPTIONS: [string, string][] = [
  ["A", "25 percent"],
  ["B", "82.76 percent"],
  ["C", "17.24 percent"],
  ["D", "20.83 percent"],
];

export function CheckedTwice() {
  return (
    <div className="container ed-split">
      <div className="ed-split-copy">
        <p className="ed-kicker">Checked twice</p>
        <h2 className="ed-h2">
          Every answer, confirmed by a <em>second</em> model.
        </h2>
        <p className="ed-body">
          One model writes each question. A different model then solves it without seeing the
          answer key, and separately audits the key and the explanation. A question reaches you
          only if both agree and nothing is ambiguous.
        </p>
        <p className="ed-body">
          On a full 100-question Business Law paper in our testing, the second model threw out about{" "}
          <strong>one question in four</strong>. Each was rewritten and checked again before the
          test began.
        </p>
        <p className="ed-fineprint">
          Math is also computed by a calculator, not by the model. If the checker is ever
          unavailable, the test says so instead of pretending.
        </p>
      </div>

      <div className="sheet-stack checked-stack" aria-label="Example of a checked question">
        <div className="sheet checked-sheet">
          <div className="sheet-head">
            <span className="sheet-meta">Economics</span>
            <span className="sheet-event">Economic indicators</span>
          </div>
          <p className="sheet-q">
            If the Consumer Price Index rises from 120 to 145 over one year, what is the inflation
            rate for that year?
          </p>
          <div className="sheet-opts">
            {OPTIONS.map(([k, v]) => (
              <div key={k} className={`opt${k === "D" ? " is-correct" : " is-dim"}`}>
                <span className="bubble">
                  {k}
                  {k === "D" && <PenCircle />}
                </span>
                <span className="opt-text">{v}</span>
                {k === "D" ? <PenCheck /> : <span />}
              </div>
            ))}
          </div>
          <ol className="checked-notes">
            <li>
              <span className="checked-n">1</span> Solved without the key: 20.83%. It matches.
            </li>
            <li>
              <span className="checked-n">2</span> Audited: one right answer, nothing ambiguous, the
              explanation holds.
            </li>
          </ol>
          <span className="checked-stamp" aria-hidden="true">
            Checked twice
          </span>
        </div>
      </div>
    </div>
  );
}
