import type { ReactNode } from "react";

/**
 * The site's signature mark: a hand-drawn red-pen underline, drawn on with a
 * dash offset (a firm pass, then a lighter second pass) so the stroke follows
 * its own path rather than stretching into place.
 *
 * Keep the wrapped phrase short. It is held on one line so the SVG can sit
 * beneath it; below 360px it wraps and falls back to a plain red underline.
 * `delay` offsets the draw in seconds, for headlines that also fade in.
 */
export function PenUnderline({ children, delay = 0.55 }: { children: ReactNode; delay?: number }) {
  return (
    <span className="pen-underline" style={{ ["--pen-delay" as string]: `${delay}s` }}>
      {children}
      <svg className="pen-underline-svg" viewBox="0 0 300 18" preserveAspectRatio="none" aria-hidden="true">
        <path className="pu-1" pathLength={1} d="M4 10C52 5 104 13 156 8s96-5 140-3" />
        <path className="pu-2" pathLength={1} d="M22 15c58-4 128-3 262-6" />
      </svg>
    </span>
  );
}
