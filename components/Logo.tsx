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
      { /* eslint-disable-next-line @next/next/no-img-element */ }
      <img
        src="/logo-mark.png"
        alt=""
        width={s.mark}
        height={s.mark}
        style={{
          flexShrink: 0,
          display: "block",
          width: s.mark,
          height: s.mark,
          objectFit: "contain",
        }}
      />
      {!markOnly && (
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: 5, lineHeight: 1 }}>
          <span style={{ fontSize: s.font, color: "var(--brand)" }}>FBLA</span>
          <span style={{ fontSize: s.font, color: "var(--accent)" }}>One</span>
        </span>
      )}
    </Link>
  );
}
