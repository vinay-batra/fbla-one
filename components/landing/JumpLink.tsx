"use client";

import type { ReactNode } from "react";

/**
 * An in-page link that glides to its section instead of jumping, and still
 * works as a plain anchor without JavaScript.
 */
export function JumpLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <a
      href={`#${to}`}
      onClick={(e) => {
        const el = document.getElementById(to);
        if (!el) return;
        e.preventDefault();
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
        history.replaceState(null, "", `#${to}`);
      }}
    >
      {children}
    </a>
  );
}
