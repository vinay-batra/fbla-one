import type { ReactNode } from "react";

/** Small label above a page headline: sans text behind a short rule. */
export function HeroBadge({ children }: { children: ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}
