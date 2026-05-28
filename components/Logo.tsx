import Link from "next/link";

type Props = {
  href?: string;
  size?: "sm" | "md" | "lg";
  /** Show only the mark (no wordmark). Useful in tight spots. */
  markOnly?: boolean;
};

const SIZES = {
  sm: { font: 17, mark: 26, gap: 8 },
  md: { font: 21, mark: 32, gap: 10 },
  lg: { font: 28, mark: 44, gap: 12 },
};

export function Logo({ href = "/", size = "md", markOnly = false }: Props) {
  const s = SIZES[size];
  return (
    <Link
      href={href}
      aria-label="FBLA One home"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        letterSpacing: "-0.025em",
        textDecoration: "none",
      }}
    >
      <svg
        width={s.mark}
        height={s.mark}
        viewBox="0 0 40 48"
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <path
          d="M6 4 Q4 4 4 6 L4 28 C4 38 20 46 20 46 C20 46 36 38 36 28 L36 6 Q36 4 34 4 Z"
          fill="var(--brand)"
        />
        <rect x="18" y="30" width="4" height="12" rx="2" fill="white" opacity="0.85" />
        <path
          d="M20 12 C20 12 14 17 14 22 C14 26.5 16.5 29 20 29 C23.5 29 26 26.5 26 22 C26 17 20 12 20 12 Z"
          fill="var(--accent)"
        />
        <path
          d="M20 16 C20 16 17 19 17 22 C17 24.2 18.3 25.8 20 25.8 C21.7 25.8 23 24.2 23 22 C23 19 20 16 20 16 Z"
          fill="white"
          opacity="0.22"
        />
      </svg>
      {!markOnly && (
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: 5, lineHeight: 1 }}>
          <span style={{ fontSize: s.font, color: "var(--brand)" }}>FBLA</span>
          <span style={{ fontSize: s.font, color: "var(--accent)" }}>One</span>
        </span>
      )}
    </Link>
  );
}
