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
 * IntersectionObserver-driven fade-up. Replaces framer's whileInView pattern
 * which couples poorly with the page-fadein wrapper (per Corvo audit).
 */
export function ScrollReveal({ children, delay = 0, y = 24, threshold = 0.12 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced-motion: reveal immediately, skip the fade/transform.
    if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    // A percentage threshold is measured against the ELEMENT, not the viewport,
    // so anything taller than the viewport can never reach it: a 6839px block
    // in a 768px viewport tops out at a ratio of 0.112 and would stay invisible
    // forever. For those, fire as soon as any part intersects.
    const tallerThanViewport = el.getBoundingClientRect().height > window.innerHeight;
    const effectiveThreshold = tallerThanViewport ? 0 : threshold;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: effectiveThreshold, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translate3d(0, 0, 0)" : `translate3d(0, ${y}px, 0)`,
        transition: `opacity 0.65s cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}s, transform 0.65s cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}s`,
        willChange: shown ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

/** Back-compat alias for the v0.1 component name. */
export const Reveal = ScrollReveal;
