import type { CSSProperties, ReactNode } from "react";

type Variant = "default" | "hover" | "elevated" | "accent" | "glass";

type Props = {
  children: ReactNode;
  variant?: Variant;
  style?: CSSProperties;
  className?: string;
  as?: "div" | "section" | "article";
};

const CLASSES: Record<Variant, string> = {
  default: "card",
  hover: "card card-hover",
  elevated: "card card-elevated",
  accent: "card card-accent",
  glass: "card glass-card",
};

export function Card({ children, variant = "default", style, className, as: As = "div" }: Props) {
  return (
    <As className={`${CLASSES[variant]}${className ? " " + className : ""}`} style={style}>
      {children}
    </As>
  );
}

type HeaderProps = {
  eyebrow?: string;
  title: string;
  tagline?: string;
  right?: ReactNode;
};

export function CardHeader({ eyebrow, title, tagline, right }: HeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 14,
      }}
    >
      <div style={{ minWidth: 0 }}>
        {eyebrow && <p className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</p>}
        <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}>{title}</h3>
        {tagline && (
          <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 4, lineHeight: 1.55 }}>
            {tagline}
          </p>
        )}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  );
}
