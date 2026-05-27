import Link from "next/link";

type Props = {
  href?: string;
  size?: "sm" | "md" | "lg";
};

export function Logo({ href = "/", size = "md" }: Props) {
  const fontSize = size === "sm" ? 18 : size === "lg" ? 28 : 22;
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 5,
        textDecoration: "none",
      }}
      aria-label="FBLA One home"
    >
      <span
        style={{
          fontSize,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "var(--brand)",
        }}
      >
        FBLA
      </span>
      <span
        style={{
          fontSize,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "var(--accent)",
        }}
      >
        One
      </span>
    </Link>
  );
}
