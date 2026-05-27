import type { ReactNode } from "react";

/** Pulsing gold-dot badge used above marketing section headlines. */
export function HeroBadge({ children }: { children: ReactNode }) {
  return <span className="eyebrow-dot">{children}</span>;
}
