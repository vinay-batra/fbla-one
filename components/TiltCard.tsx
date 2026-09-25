"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Maximum rotation in degrees at the far edges. Keep this small. */
  max?: number;
  className?: string;
};

/**
 * Pointer-reactive 3D tilt, done with CSS transforms rather than WebGL.
 *
 * A real 3D library would be ~600KB for one decorative hero element, which is
 * the entire page budget several times over on a site students open on school
 * wifi. A perspective transform gives genuine depth for nothing.
 *
 * Implementation notes:
 * - Pointer handling is rAF-throttled and writes only `transform`, so it stays
 *   on the compositor and never triggers layout.
 * - `(hover: hover) and (pointer: fine)` gates the whole effect, so phones and
 *   trackpad-less devices never pay for it and never get a stuck tilt.
 * - prefers-reduced-motion disables it entirely.
 * - The listener is on the wrapper, not the window, and is passive.
 */
export function TiltCard({ children, max = 5.5, className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;

    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduced.matches) return;

    let frame = 0;
    let targetX = 0;
    let targetY = 0;

    const apply = () => {
      frame = 0;
      inner.style.transform = `rotateX(${targetY.toFixed(2)}deg) rotateY(${targetX.toFixed(2)}deg)`;
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      // -1..1 from the card's center
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      targetX = px * max * 2;
      targetY = -py * max * 2;
      schedule();
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      schedule();
    };

    wrap.addEventListener("pointermove", onMove, { passive: true });
    wrap.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [max]);

  return (
    <div ref={wrapRef} className={className} style={{ perspective: 1400 }}>
      <div
        ref={innerRef}
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1)",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
