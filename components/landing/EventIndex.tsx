import Link from "next/link";
import { CATEGORIES, COMPETITIONS, formatGroup, type FormatGroup } from "@/lib/competitions";
import { IndexCollapse } from "@/components/landing/IndexCollapse";

/**
 * Every event, typeset like the index at the back of a book: grouped by
 * category, alphabetized, each name linked to its prep page. Showing all 76 at
 * once says "complete" far better than six cards and a "browse all" button.
 *
 * On phones all 76 names ran several screens long, so each category is a
 * <details>: open on desktop (and before JavaScript), closed on phones, where
 * IndexCollapse folds them after mount and the category names become the list.
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
        <details key={g.cat} className="index-group" open>
          <summary className="index-summary">
            <h3 className="index-cat">
              {g.cat}
              <span className="index-count">{g.events.length}</span>
            </h3>
          </summary>
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
        </details>
      ))}
      <IndexCollapse />
    </div>
  );
}
