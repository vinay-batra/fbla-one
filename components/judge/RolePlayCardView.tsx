import type { Competition } from "@/lib/competitions";
import type { RolePlayCard } from "./types";

type Props = {
  card: RolePlayCard;
  comp: Competition;
  prepMin: number;
  performMin: number;
  /** Card number for the header, so repeat draws read as a stack of cards. */
  drawNumber: number;
};

/**
 * A role play card laid out like the printed case study handed to a
 * competitor: event header, participant instructions, performance indicators,
 * then the case. The participant instructions come from the event's official
 * timing, never from the model.
 */
export function RolePlayCardView({ card, comp, prepMin, performMin, drawNumber }: Props) {
  const who = comp.isTeam ? "your team" : "you";
  const Who = comp.isTeam ? "Your team" : "You";
  return (
    <article className="judge-card" aria-labelledby="judge-card-title">
      <header className="judge-card-head">
        <span>Competitive event</span>
        <span>Role play, card {drawNumber}</span>
      </header>
      <p className="judge-card-event">{comp.name}</p>
      <h2 id="judge-card-title" className="judge-card-title">
        {card.title}
      </h2>
      <p className="judge-card-company">{card.company}</p>

      <section className="judge-card-section">
        <h3 className="judge-card-label">Participant instructions</h3>
        <ul className="judge-card-list">
          <li>
            {Who} will have {prepMin} minutes to review this information and prepare. Notes written during prep may be used during the performance.
          </li>
          <li>
            {Who} will have up to {performMin} minutes to present to the judges. The judges may ask questions at any time.
          </li>
          <li>Address every task below. A task you skip cannot earn points.</li>
        </ul>
      </section>

      <section className="judge-card-section">
        <h3 className="judge-card-label">Performance indicators</h3>
        <ul className="judge-card-list">
          {card.indicators.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <section className="judge-card-section">
        <h3 className="judge-card-label">Case study situation</h3>
        <p className="judge-card-situation">{card.situation}</p>
        <dl className="judge-card-roles">
          <div>
            <dt>{comp.isTeam ? "Your team's role" : "Your role"}</dt>
            <dd>{card.yourRole}</dd>
          </div>
          <div>
            <dt>The judges play</dt>
            <dd>{card.judgeRole}</dd>
          </div>
        </dl>
      </section>

      <section className="judge-card-section">
        <h3 className="judge-card-label">In the performance, {who} must</h3>
        <ol className="judge-card-tasks">
          {card.tasks.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
      </section>

      <footer className="judge-card-foot">
        Practice card written by ChapterPrep. Not an official FBLA card.
      </footer>
    </article>
  );
}
