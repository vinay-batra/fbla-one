"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: number;
  /** Y-axis travel distance in px. Defaults to 24. */
  y?: number;
  /** Triggers when this much of the element is visible. Defaults to 0.12. */
  threshold?: number;
};

/**
 * Fade-up on scroll, WITHOUT hiding anything the user can already see.
 *
 * It used to server-render every block at opacity 0 and reveal after
 * hydration. Anything above the fold (every page's headline, the LCP element)
 * was therefore invisible until JavaScript loaded, which on a slow network or
 * an old laptop meant staring at blank paper.
 *
 * Now it renders fully visible on the server and on the first client render
 * (so hydration matches). After mount it measures itself: if it is already on
 * screen it stays put with no animation; only blocks that start BELOW the fold
 * are hidden (invisibly, since they are off-screen) and then revealed as they
 * scroll in. Above-the-fold entrance animation, where wanted, is done in CSS
 * (see .rise in globals.css), which runs on first paint.
 */
type Phase = "static" | "hidden" | "shown";

export function ScrollReveal({ children, delay = 0, y = 24, threshold = 0.12 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("static");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    const rect = el.getBoundingClientRect();
    // Already visible (or scrolled past, e.g. a restored scroll position):
    // leave it exactly as painted.
    if (rect.top < window.innerHeight * 0.92) return;

    setPhase("hidden");

    // A percentage threshold is measured against the ELEMENT, not the viewport,
    // so anything taller than the viewport can never reach it: a 6839px block
    // in a 768px viewport tops out at a ratio of 0.112 and would stay hidden
    // forever. For those, fire as soon as any part intersects.
    const effectiveThreshold = rect.height > window.innerHeight ? 0 : threshold;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase("shown");
          obs.disconnect();
        }
      },
      // The huge TOP margin extends the watched area far above the viewport, so
      // a block that a fast fling or an in-page anchor jump carries straight past
      // still counts as seen. Otherwise it goes from "below" to "above" without
      // ever changing intersection state, no callback fires, and it stays
      // invisible until the reader scrolls back to it.
      { threshold: effectiveThreshold, rootMargin: "100000px 0px -8% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  const style: React.CSSProperties =
    phase === "hidden"
      ? { opacity: 0, transform: `translate3d(0, ${y}px, 0)`, willChange: "opacity, transform" }
      : phase === "shown"
        ? {
            opacity: 1,
            transform: "translate3d(0, 0, 0)",
            transition: `opacity 0.65s cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}s, transform 0.65s cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}s`,
          }
        : {};

  return (
    <div ref={ref} style={style}>
      {children}
    </div>
  );
}

/** Back-compat alias for the v0.1 component name. */
export const Reveal = ScrollReveal;
