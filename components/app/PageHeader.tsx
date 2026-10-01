import type { ReactNode } from "react";

/**
 * The one header every /app page uses: red eyebrow, big serif title (put the
 * emphasized words in <em>), one short line under it, optional actions.
 */
export function PageHeader({ eyebrow, title, sub, right }: {
  eyebrow: string;
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="ph">
      <div className="ph-text">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="db-title">{title}</h1>
        {sub && <p className="ph-sub">{sub}</p>}
      </div>
      {right && <div className="ph-right">{right}</div>}
    </header>
  );
}
