import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

type Props = {
  href?: string;
  size?: "sm" | "md" | "lg";
  /** Show only the mark (no wordmark). Useful in tight spots. */
  markOnly?: boolean;
};

// plate = the white rounded square behind the mark (matches the favicon + PWA
// icons); mark = the logo image inset inside it; radius = squircle corner.
const SIZES = {
  sm: { font: 17, plate: 26, mark: 21, radius: 6, gap: 8 },
  md: { font: 21, plate: 32, mark: 26, radius: 7, gap: 10 },
  lg: { font: 28, plate: 44, mark: 36, radius: 10, gap: 12 },
};

export function Logo({ href = "/", size = "md", markOnly = false }: Props) {
  const s = SIZES[size];
  return (
    <Link
      href={href}
      aria-label="ChapterPrep home"
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
      {/* Rendered directly rather than on a white plate: the old "1" mark needed
          the plate to read, the bookmark carries its own shape and gradient. */}
      <BrandMark size={s.plate} />
      {!markOnly && (
        <span style={{ display: "inline-flex", alignItems: "baseline", lineHeight: 1 }}>
          <span style={{ fontSize: s.font, color: "var(--brand)" }}>Chapter</span>
          <span style={{ fontSize: s.font, color: "var(--accent)" }}>Prep</span>
        </span>
      )}
    </Link>
  );
}
