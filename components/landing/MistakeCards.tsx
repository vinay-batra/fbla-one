import { PenCheck } from "@/components/PenMarks";

/**
 * The mistake bank as a small stack of index cards. The questions are real
 * generated Economics questions whose keys were checked by hand.
 */
const CARDS = [
  {
    topic: "Economic indicators",
    q: "An economy produces 2,400,000 units of output using 1,200,000 units of labor. What is labor productivity?",
    missed: 2,
    right: 1,
  },
  {
    topic: "Government's impact on business",
    q: "When a government sets a minimum wage, the most direct economic effect is to...",
    missed: 1,
    right: 0,
  },
  {
    topic: "Economic systems",
    q: "In a command economy, the primary way resources are allocated is...",
    missed: 1,
    right: 1,
  },
];

export function MistakeStack() {
  return (
    <div className="mcards" aria-label="Example mistake bank">
      {CARDS.map((c, i) => (
        <div key={c.q} className={`mcard mcard-${i}`}>
          <div className="mcard-head">
            <span>{c.topic}</span>
            <span className="mcard-missed">Missed {c.missed === 1 ? "once" : `${c.missed} times`}</span>
          </div>
          <p className="mcard-q">{c.q}</p>
          <div className="mcard-progress">
            <span className="mcard-ticks" aria-hidden="true">
              {[0, 1].map((k) => (
                <span key={k} className={`mcard-tick${k < c.right ? " is-done" : ""}`}>
                  {k < c.right && <PenCheck />}
                </span>
              ))}
            </span>
            <span>
              Right {c.right} of 2{c.right === 1 ? ", one more to clear it" : ""}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
