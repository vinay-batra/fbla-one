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

export function CheckedSheet() {
  return (
    <div className="sheet-stack checked-stack" aria-label="Example of a checked question">
      <div className="sheet checked-sheet">
        <div className="sheet-head">
          <span className="sheet-meta">Economics</span>
          <span className="sheet-event">Economic indicators</span>
        </div>
        <p className="sheet-q">
          If the Consumer Price Index rises from 120 to 145 over one year, what is the inflation rate
          for that year?
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
        <span className="checked-stamp" aria-hidden="true">
          Checked twice
        </span>
      </div>
    </div>
  );
}
