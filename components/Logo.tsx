import Link from "next/link";
import Image from "next/image";

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
      <span
        aria-hidden="true"
        style={{
          flexShrink: 0,
          width: s.plate,
          height: s.plate,
          borderRadius: s.radius,
          // White plate to match the favicon + PWA icons (square white bg). The
          // blue mark reads on any background, so this stays white in both themes.
          background: "#ffffff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          src="/logo-mark.png"
          width={s.mark}
          height={s.mark}
          alt=""
          aria-hidden="true"
          style={{ objectFit: "contain", height: s.mark, width: s.mark }}
        />
      </span>
      {!markOnly && (
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: 5, lineHeight: 1 }}>
          <span style={{ fontSize: s.font, color: "var(--brand)" }}>FBLA</span>
          <span style={{ fontSize: s.font, color: "var(--accent)" }}>One</span>
        </span>
      )}
    </Link>
  );
}
