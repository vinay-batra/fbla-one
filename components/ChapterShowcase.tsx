import { ScrollReveal } from "@/components/ScrollReveal";

/**
 * Landing-page bento that shows the chapter-level features as small live-looking
 * UI previews rather than feature bullets. Written for officers and advisers:
 * the rest of the landing page speaks to individual students, and the features
 * that make a chapter adopt a tool (assignments, the leaderboard, the regional
 * registration export) were a single sentence.
 *
 * Every card shows a feature that ships today. The names and numbers inside the
 * previews are illustrative, the same way the hero's sample question is.
 */

const LEADERS = [
  { name: "Maya R.", tests: 24, medal: "var(--medal-gold)" },
  { name: "Jordan K.", tests: 19, medal: "var(--medal-silver)" },
  { name: "Priya S.", tests: 17, medal: "var(--medal-bronze)" },
  { name: "You", tests: 12, medal: null, you: true },
];

const TOPICS = [
  { name: "Adjusting entries", pct: 42 },
  { name: "Payroll", pct: 58 },
  { name: "Depreciation", pct: 81 },
];

const DEADLINES = [
  { date: "Oct 14", label: "Registration closes", soon: true },
  { date: "Nov 2", label: "Regionals" },
  { date: "Feb 8", label: "State conference" },
];

function topicColor(pct: number) {
  if (pct >= 75) return "var(--green)";
  if (pct >= 55) return "var(--accent-text)";
  return "var(--red)";
}

export function ChapterShowcase() {
  return (
    <section className="showcase" aria-labelledby="showcase-title">
      <div className="container">
        <ScrollReveal>
          <div className="showcase-head">
            <p className="eyebrow">For the whole chapter</p>
            <h2 id="showcase-title">Built for officers and advisers, too.</h2>
            <p className="showcase-sub">
              Set goals, see who is putting in the work, and stop rebuilding the
              registration spreadsheet by hand every season.
            </p>
          </div>
        </ScrollReveal>

        <div className="bento">
          {/* Leaderboard: the wide card */}
          <ScrollReveal delay={0.05}>
            <article className="bento-card bento-wide card-hover">
              <div className="bento-copy">
                <h3>Chapter leaderboard</h3>
                <p>Ranked by practice volume, not scores, so it rewards effort and never exposes anyone&apos;s grades.</p>
              </div>
              <div className="mock mock-board" aria-hidden="true">
                <div className="mock-label">This week</div>
                {LEADERS.map((l, i) => (
                  <div key={l.name} className={`board-row${l.you ? " board-you" : ""}`}>
                    <span className="board-rank" style={l.medal ? { background: l.medal, color: "var(--bg)" } : undefined}>
                      {i + 1}
                    </span>
                    <span className="board-name">{l.name}</span>
                    <span className="board-bar">
                      <span style={{ width: `${(l.tests / LEADERS[0].tests) * 100}%` }} />
                    </span>
                    <span className="board-count font-mono">{l.tests}</span>
                  </div>
                ))}
              </div>
            </article>
          </ScrollReveal>

          {/* Assignments */}
          <ScrollReveal delay={0.1}>
            <article className="bento-card card-hover">
              <div className="bento-copy">
                <h3>Assignments</h3>
                <p>Set a practice goal for the chapter and watch completion fill in.</p>
              </div>
              <div className="mock" aria-hidden="true">
                <div className="mock-label">Due Friday</div>
                <div className="assign-title">3 Accounting practice tests</div>
                <div className="assign-track"><span style={{ width: "75%" }} /></div>
                <div className="assign-meta font-mono">6 of 8 members done</div>
              </div>
            </article>
          </ScrollReveal>

          {/* Weak-topic drills */}
          <ScrollReveal delay={0.15}>
            <article className="bento-card card-hover">
              <div className="bento-copy">
                <h3>Weak-spot drills</h3>
                <p>Every test is scored by topic, and one tap drills the weakest one.</p>
              </div>
              <div className="mock" aria-hidden="true">
                <div className="mock-label">Your weak spots</div>
                {TOPICS.map((t) => (
                  <div key={t.name} className="topic-row">
                    <span className="topic-name">{t.name}</span>
                    <span className="topic-track">
                      <span style={{ width: `${t.pct}%`, background: topicColor(t.pct) }} />
                    </span>
                    <span className="topic-pct font-mono" style={{ color: topicColor(t.pct) }}>{t.pct}%</span>
                  </div>
                ))}
              </div>
            </article>
          </ScrollReveal>

          {/* Deadlines */}
          <ScrollReveal delay={0.2}>
            <article className="bento-card card-hover">
              <div className="bento-copy">
                <h3>Shared deadlines</h3>
                <p>One calendar for the whole chapter, with a heads-up three days out.</p>
              </div>
              <div className="mock" aria-hidden="true">
                <div className="mock-label">Upcoming</div>
                {DEADLINES.map((d) => (
                  <div key={d.label} className="dl-row">
                    <span className={`dl-date font-mono${d.soon ? " dl-soon" : ""}`}>{d.date}</span>
                    <span className="dl-label">{d.label}</span>
                  </div>
                ))}
              </div>
            </article>
          </ScrollReveal>

          {/* Regional registration export */}
          <ScrollReveal delay={0.25}>
            <article className="bento-card card-hover">
              <div className="bento-copy">
                <h3>Registration, exported</h3>
                <p>Every member&apos;s event in one file, grouped by event and sorted by last name.</p>
              </div>
              <div className="mock mock-file" aria-hidden="true">
                <span className="file-icon font-mono">CSV</span>
                <span className="file-meta">
                  <span className="file-name font-mono">regionals.csv</span>
                  <span className="file-ready">Ready to upload</span>
                </span>
              </div>
            </article>
          </ScrollReveal>
        </div>
      </div>

      <style>{`
        .showcase { padding: 40px 0 96px; }
        .showcase-head { text-align: center; max-width: 640px; margin: 0 auto 44px; }
        .showcase-head h2 { margin-top: 14px; font-size: clamp(30px, 4.4vw, 44px); letter-spacing: -0.03em; }
        .showcase-sub { margin-top: 14px; font-size: 16px; line-height: 1.65; color: var(--text2); }

        .bento {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }
        .bento > div { min-width: 0; }
        .bento > div:first-child { grid-column: span 2; }

        .bento-card {
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding: 22px;
          border-radius: 18px;
          background: var(--card-bg);
          border: 0.5px solid var(--border);
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.25s ease;
        }
        .bento-wide { flex-direction: row; align-items: center; gap: 28px; }
        .bento-wide .bento-copy { flex: 0 0 34%; }
        .bento-wide .mock { flex: 1; }
        .bento-copy h3 { font-size: 17px; font-weight: 700; letter-spacing: -0.01em; }
        .bento-copy p { margin-top: 6px; font-size: 13.5px; line-height: 1.6; color: var(--text2); }

        .mock {
          margin-top: auto;
          padding: 14px;
          border-radius: 12px;
          background: var(--bg2);
          border: 0.5px solid var(--border);
        }
        .mock-label {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--text3);
          margin-bottom: 10px;
        }

        .board-row { display: grid; grid-template-columns: 22px 78px 1fr 26px; align-items: center; gap: 10px; padding: 6px 6px; border-radius: 8px; font-size: 13px; }
        .board-row + .board-row { margin-top: 2px; }
        .board-you { background: var(--accent-dim); }
        .board-you .board-name { color: var(--accent-text); font-weight: 700; }
        .board-rank { width: 22px; height: 22px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; background: var(--bg3); color: var(--text2); }
        .board-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .board-bar { height: 7px; border-radius: 999px; background: var(--track); overflow: hidden; }
        .board-bar > span { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--brand), var(--accent)); }
        .board-count { text-align: right; font-size: 12px; color: var(--text2); }

        .assign-title { font-size: 14px; font-weight: 600; }
        .assign-track { margin-top: 12px; height: 8px; border-radius: 999px; background: var(--track); overflow: hidden; }
        .assign-track > span { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--brand), var(--accent)); }
        .assign-meta { margin-top: 9px; font-size: 11px; color: var(--text2); }

        .topic-row { display: grid; grid-template-columns: minmax(0, 1fr) 54px 34px; align-items: center; gap: 10px; font-size: 12.5px; }
        .topic-row + .topic-row { margin-top: 9px; }
        .topic-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .topic-track { height: 6px; border-radius: 999px; background: var(--track); overflow: hidden; }
        .topic-track > span { display: block; height: 100%; border-radius: 999px; }
        .topic-pct { text-align: right; font-size: 11px; font-weight: 700; }

        .dl-row { display: flex; align-items: baseline; gap: 12px; font-size: 13px; }
        .dl-row + .dl-row { margin-top: 9px; }
        .dl-date { flex: 0 0 48px; font-size: 11px; font-weight: 700; color: var(--text3); }
        .dl-soon { color: var(--accent-text); }
        .dl-label { color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .mock-file { display: flex; align-items: center; gap: 12px; }
        .file-icon { flex-shrink: 0; width: 44px; height: 52px; border-radius: 8px; display: inline-flex; align-items: flex-end; justify-content: center; padding-bottom: 8px; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; color: var(--green); background: rgba(var(--green-rgb), 0.12); border: 0.5px solid rgba(var(--green-rgb), 0.35); }
        .file-meta { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .file-name { font-size: 12px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .file-ready { font-size: 11.5px; color: var(--green); font-weight: 600; }

        @media (max-width: 900px) {
          .bento { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .bento-wide { flex-direction: column; align-items: stretch; }
          .bento-wide .bento-copy { flex: none; }
        }
        @media (max-width: 600px) {
          .bento { grid-template-columns: minmax(0, 1fr); }
          .bento > div:first-child { grid-column: auto; }
        }
      `}</style>
    </section>
  );
}
