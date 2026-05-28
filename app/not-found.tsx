import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 24px",
        gap: 18,
        background: `radial-gradient(60% 60% at 50% 30%, rgba(var(--brand-rgb), 0.18) 0%, transparent 65%)`,
      }}
    >
      <Logo size="lg" />
      <p
        className="font-mono"
        style={{
          marginTop: 18,
          fontSize: 11,
          letterSpacing: "0.22em",
          color: "var(--accent)",
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        Error 404
      </p>
      <h1 style={{ fontSize: "clamp(40px, 8vw, 72px)", letterSpacing: "-0.03em" }}>
        Page not <span style={{ color: "var(--accent)" }}>found.</span>
      </h1>
      <p style={{ fontSize: 16, color: "var(--text2)", maxWidth: 440, lineHeight: 1.6 }}>
        That page does not exist, or it moved. Let us get you back on track.
      </p>
      <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/" className="btn btn-accent btn-lg cta-shimmer">Back home</Link>
        <Link href="/competitions" className="btn btn-ghost btn-lg">Browse competitions</Link>
      </div>
    </div>
  );
}
