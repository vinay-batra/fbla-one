import Link from "next/link";
import { CATEGORIES, COMPETITIONS, isAiTestable } from "@/lib/competitions";

/**
 * Every event, typeset like the index at the back of a book: grouped by
 * category, alphabetized, each name linked to its prep page. Showing all 76 at
 * once says "complete" far better than six cards and a "browse all" button.
 *
 * A small mark flags the events a practice test can be generated for. It is
 * derived from isAiTestable(), the same predicate the practice-test picker uses,
 * so the index and the product can never disagree.
 */
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
                {isAiTestable(c) && (
                  <span className="index-mark" title="Practice tests available">
                    <span className="sr-only"> (practice tests available)</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
