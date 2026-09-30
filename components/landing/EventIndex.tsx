import Link from "next/link";
import { CATEGORIES, COMPETITIONS, formatGroup, type FormatGroup } from "@/lib/competitions";

/**
 * Every event, typeset like the index at the back of a book: grouped by
 * category, alphabetized, each name linked to its prep page. Showing all 76 at
 * once says "complete" far better than six cards and a "browse all" button.
 *
 * A small tag says how each event is decided (T test, R test then role play,
 * P presentation or interview), derived from formatGroup() so the index and the
 * event pages can never disagree.
 */
const TAG: Record<FormatGroup, { letter: string; label: string }> = {
  test: { letter: "T", label: "test" },
  "role-play": { letter: "R", label: "test, then role play" },
  presentation: { letter: "P", label: "presentation or interview" },
};
export function EventIndex() {
  const groups = CATEGORIES.map((cat) => ({
    cat,
    events: COMPETITIONS.filter((c) => c.category === cat).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
  })).filter((g) => g.events.length > 0);

  return (
    <div className="index">
      {groups.map((g) => (
        <section key={g.cat} className="index-group" aria-labelledby={`idx-${g.cat}`}>
          <h3 id={`idx-${g.cat}`} className="index-cat">
            {g.cat}
            <span className="index-count">{g.events.length}</span>
          </h3>
          <ul>
            {g.events.map((c) => (
              <li key={c.slug}>
                <Link href={`/competitions/${c.slug}`} className="index-link">
                  {c.name}
                </Link>
                <span className={`index-tag index-tag-${formatGroup(c)}`} title={TAG[formatGroup(c)].label}>
                  <span aria-hidden="true">{TAG[formatGroup(c)].letter}</span>
                  <span className="sr-only"> ({TAG[formatGroup(c)].label})</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
