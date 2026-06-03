import Link from "next/link";
import Image from "next/image";

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
      <Image
        src="/logo-mark.png"
        width={s.mark}
        height={s.mark}
        alt=""
        aria-hidden="true"
        style={{ flexShrink: 0, objectFit: "contain", height: s.mark, width: s.mark }}
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
