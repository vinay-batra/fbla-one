import Link from "next/link";

type Props = {
  href?: string;
  size?: "sm" | "md" | "lg";
};

const SIZES = {
  sm: { font: 17, gap: 4 },
  md: { font: 21, gap: 5 },
  lg: { font: 28, gap: 6 },
};

export function Logo({ href = "/", size = "md" }: Props) {
  const s = SIZES[size];
  return (
    <Link
      href={href}
      aria-label="FBLA One home"
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: s.gap,
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        letterSpacing: "-0.025em",
        textDecoration: "none",
      }}
    >
      <span style={{ fontSize: s.font, color: "var(--brand)" }}>FBLA</span>
      <span style={{ fontSize: s.font, color: "var(--accent)" }}>One</span>
    </Link>
  );
}
