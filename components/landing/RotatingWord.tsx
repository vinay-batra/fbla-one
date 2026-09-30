"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * One word in a headline that cycles through a list: the current word slides
 * up and out while the next one rises in, and the slot eases to the new word's
 * width so the rest of the line follows it instead of jumping.
 *
 * The slot's width is measured per word (and re-measured when the headline
 * font size changes). While it animates, the red-pen underline further along
 * the line is told to re-measure every frame, so its strokes stay under the
 * words even when a line re-wraps.
 *
 * The server renders only the first word, so the headline search engines and
 * no-JS visitors see is the plain sentence. The moving copies, the invisible
 * sizer and the measuring spans are added after mount and hidden from screen
 * readers except the word currently showing. With reduced motion the first
 * word just stays put.
 */
const HOLD_MS = 2600;
const MOVE_MS = 650;

export function RotatingWord({ words }: { words: string[] }) {
  const [{ index, prev }, setTurn] = useState<{ index: number; prev: number | null }>({ index: 0, prev: null });
  const [widths, setWidths] = useState<number[] | null>(null);
  const [mounted, setMounted] = useState(false);
  const measureRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Measure every word in the headline's font, again once fonts load and
  // whenever the viewport changes the headline size.
  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return;
    const measure = () =>
      setWidths(measureRefs.current.map((el) => (el ? el.getBoundingClientRect().width : 0)));
    measure();
    document.fonts?.ready.then(measure).catch(() => {});
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [mounted]);

  useEffect(() => {
    if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setTurn((t) => ({ index: (t.index + 1) % words.length, prev: t.index }));
    }, HOLD_MS);
    return () => window.clearInterval(id);
  }, [words.length]);

  // Keep the underline glued to the text while the slot changes width.
  useEffect(() => {
    if (prev === null) return;
    const end = performance.now() + MOVE_MS + 80;
    let raf = 0;
    const tick = () => {
      window.dispatchEvent(new Event("pen-underline:measure"));
      if (performance.now() < end) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index, prev]);

  const remeasure = () => window.dispatchEvent(new Event("pen-underline:measure"));

  if (!mounted) return <span className="rw">{words[0]}</span>;

  return (
    <span
      className="rw is-live"
      style={widths ? { width: widths[index] } : undefined}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget) remeasure();
      }}
    >
      {/* Invisible copy of the current word: gives the slot its height and
          baseline, and its width before measuring. */}
      <span className="rw-sizer" aria-hidden="true">
        {words[index]}
      </span>
      {words.map((w, i) => (
        <span
          key={w}
          aria-hidden={i !== index}
          className={`rw-word${i === index ? " is-in" : ""}${i === prev ? " is-out" : ""}`}
        >
          {w}
        </span>
      ))}
      {words.map((w, i) => (
        <span
          key={`m-${w}`}
          aria-hidden="true"
          className="rw-measure"
          ref={(el) => {
            measureRefs.current[i] = el;
          }}
        >
          {w}
        </span>
      ))}
    </span>
  );
}
