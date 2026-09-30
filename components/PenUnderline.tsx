"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

type Stroke = { x: number; y: number; w: number; delay: number; dur: number };

/**
 * The site's signature mark: one flat red-pen stroke under a phrase, drawn on
 * left to right with a dash offset.
 *
 * The phrase is free to wrap. After mount we read one box per rendered line
 * (getClientRects) and lay a separate stroke under each, drawn in reading
 * order, so "already knowing the test." can break across two lines of a
 * headline and still be underlined like a person would do it. Strokes are
 * re-measured on resize and once the web fonts land, but only animate once.
 *
 * Positions are relative to the first line box: that is the origin browsers
 * use for absolutely positioned children of a relatively positioned inline.
 * `delay` offsets the draw in seconds, for headlines that also fade in.
 */
export function PenUnderline({ children, delay = 0.55 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [weight, setWeight] = useState(3);
  const [drawn, setDrawn] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const rects = Array.from(el.getClientRects()).filter((r) => r.width > 1);
      if (!rects.length) return;
      const origin = rects[0];
      const fontSize = parseFloat(getComputedStyle(el).fontSize) || 40;
      const total = rects.reduce((sum, r) => sum + r.width, 0);
      let t = delay;
      const next = rects.map((r) => {
        // ~0.8s for the whole phrase, split by line length, so a two-line
        // underline takes as long as a one-line one and never feels slower.
        const dur = Math.max(0.22, 0.8 * (r.width / total));
        const s = {
          x: r.left - origin.left,
          y: r.bottom - origin.top - fontSize * 0.1,
          w: r.width,
          delay: t,
          dur,
        };
        t += dur;
        return s;
      });
      setWeight(Math.max(2, Math.min(4, fontSize * 0.055)));
      setStrokes(next);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el.parentElement ?? el);
    document.fonts?.ready.then(measure).catch(() => {});
    // Sent by anything that moves the phrase without resizing its parent, such
    // as the hero's rotating word changing width.
    window.addEventListener("pen-underline:measure", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("pen-underline:measure", measure);
    };
  }, [delay]);

  // After the first draw, render strokes static so a later re-measure (resize,
  // font swap) moves them without replaying the animation.
  useLayoutEffect(() => {
    if (!strokes.length || drawn) return;
    const last = strokes[strokes.length - 1];
    const id = window.setTimeout(() => setDrawn(true), (last.delay + last.dur) * 1000 + 100);
    return () => window.clearTimeout(id);
  }, [strokes, drawn]);

  return (
    <span ref={ref} className="pen-underline">
      {children}
      {strokes.map((s, i) => {
        // Built at the line's real pixel width (no viewBox stretching), so the
        // curve and stroke weight are identical on short and long lines and the
        // dash-offset draw covers the whole stroke.
        const w = s.w * 1.02;
        const d = `M2 6.2C${w * 0.2} 5 ${w * 0.43} 6.8 ${w * 0.67} 5.6S${w * 0.9} 5.2 ${w - 2} 5.8`;
        return (
          <svg
            key={i}
            className="pen-underline-svg"
            width={w}
            height={10}
            viewBox={`0 0 ${w} 10`}
            aria-hidden="true"
            style={{ left: s.x - s.w * 0.01, top: s.y }}
          >
            <path
              pathLength={1}
              d={d}
              style={{
                strokeWidth: weight,
                ...(drawn
                  ? { strokeDashoffset: 0 }
                  : { animation: `pen-draw ${s.dur}s cubic-bezier(0.5, 0.05, 0.35, 1) ${s.delay}s forwards` }),
              }}
            />
          </svg>
        );
      })}
    </span>
  );
}
