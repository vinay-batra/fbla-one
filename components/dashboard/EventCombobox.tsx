"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CATEGORIES, COMPETITIONS, type Competition } from "@/lib/competitions";

/**
 * Type-to-search event picker for the dashboard booklet. Replaces a native
 * <select>: on macOS the native popup copies the field's 22px serif font, so
 * 76 events became a menu taller than the screen. ARIA combobox pattern:
 * arrows move, Enter picks, Escape closes.
 */

const ALL: Competition[] = CATEGORIES.flatMap((cat) =>
  COMPETITIONS.filter((c) => c.category === cat).sort((a, b) => a.name.localeCompare(b.name))
);

function matches(list: Competition[], q: string): Competition[] {
  const s = q.trim().toLowerCase();
  if (!s) return list;
  const starts = list.filter((c) => c.name.toLowerCase().startsWith(s));
  const words = list.filter(
    (c) => !starts.includes(c) && c.name.toLowerCase().split(/[\s&-]+/).some((w) => w.startsWith(s))
  );
  const inside = list.filter((c) => !starts.includes(c) && !words.includes(c) && c.name.toLowerCase().includes(s));
  // Shortest first within each group, so an exact name ("Public Speaking")
  // beats a longer one that contains it ("Introduction to Public Speaking").
  const short = (a: Competition, b: Competition) => a.name.length - b.name.length;
  const byName = [...starts.sort(short), ...words.sort(short), ...inside.sort(short)];
  // Category only when no name matches ("finance" lists the finance events).
  return byName.length ? byName : list.filter((c) => c.category.toLowerCase().includes(s));
}

export function EventCombobox({ id, value, onChange, events, placeholder = "Type your event", className = "", disabled = false }: {
  id: string;
  value: string;
  onChange: (slug: string) => void;
  /** Limit the choices (AI Practice offers only events with a test). Defaults to all events. */
  events?: Competition[];
  placeholder?: string;
  /** "is-compact" renders it as a normal form field instead of the booklet's big serif line. */
  className?: string;
  disabled?: boolean;
}) {
  const ordered = useMemo(
    () => (events ? ALL.filter((c) => events.some((e) => e.slug === c.slug)) : ALL),
    [events]
  );
  const selected = value ? COMPETITIONS.find((c) => c.slug === value) ?? null : null;
  const [query, setQuery] = useState(selected?.name ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();

  // The parent can set the event after mount (the page loads your saved
  // event): show its name unless the student is typing.
  useEffect(() => {
    if (!open) setQuery(selected?.name ?? "");
    // Only when the picked event changes, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.slug]);
  const listRef = useRef<HTMLUListElement>(null);

  // While the text still equals the picked event's name, show the whole list.
  const results = useMemo(
    () => matches(ordered, selected && query === selected.name ? "" : query),
    [ordered, query, selected]
  );

  function pick(c: Competition) {
    // Re-picking the current event is not a change (the AI Judge resets a run
    // on change, which would throw away a pasted script).
    if (c.slug !== value) onChange(c.slug);
    setQuery(c.name);
    setOpen(false);
  }

  /** Open with the current event highlighted, so Enter keeps it. */
  function openList() {
    const i = selected ? results.findIndex((c) => c.slug === selected.slug) : -1;
    setActive(Math.max(0, i));
    setOpen(true);
  }

  function move(delta: number) {
    if (!open) { openList(); return; }
    const next = Math.max(0, Math.min(results.length - 1, active + delta));
    setActive(next);
    listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
  }

  return (
    <div className={`db-combo ${className}`}>
      <input
        id={id}
        className="db-combo-input"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && results[active] ? `${listId}-${results[active].slug}` : undefined}
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        value={query}
        disabled={disabled}
        onFocus={(e) => { openList(); e.currentTarget.select(); }}
        onBlur={() => {
          setOpen(false);
          // Leaving with half-typed text: fall back to the picked event's name.
          if (selected) setQuery(selected.name);
        }}
        onChange={(e) => {
          // Typing filters; the event only changes when a new one is picked.
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
          else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
          else if (e.key === "Enter" && open && results[active]) { e.preventDefault(); pick(results[active]); }
          else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && (
        <ul id={listId} ref={listRef} role="listbox" className="db-combo-list" aria-label="Events">
          {results.length === 0 ? (
            <li className="db-combo-empty" role="presentation">No event matches &ldquo;{query}&rdquo;</li>
          ) : (
            results.map((c, i) => (
              <li
                key={c.slug}
                id={`${listId}-${c.slug}`}
                role="option"
                aria-selected={c.slug === value}
                className={`db-combo-opt${i === active ? " is-active" : ""}`}
                // mousedown, not click: it fires before the input's blur closes the list.
                onMouseDown={(e) => { e.preventDefault(); pick(c); }}
                onMouseEnter={() => setActive(i)}
              >
                <span>{c.name}</span>
                <span className="db-combo-cat">{c.category}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
