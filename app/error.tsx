"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") console.error(error);
  }, [error]);

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
        gap: 16,
      }}
    >
      <Logo size="lg" />
      <p
        className="font-mono"
        style={{
          marginTop: 18,
          fontSize: 11,
          letterSpacing: "0.22em",
          color: "var(--red)",
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        Unexpected error
      </p>
      <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-0.02em" }}>
        Something went wrong.
      </h1>
      <p style={{ fontSize: 16, color: "var(--text2)", maxWidth: 460, lineHeight: 1.6 }}>
        FBLA One hit an unexpected error. This was logged. Try again, and if it keeps happening
        email <a href="mailto:hello@fbla.one" className="animated-link" style={{ color: "var(--accent)" }}>hello@fbla.one</a>.
      </p>
      <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={reset} className="btn btn-accent btn-lg cta-shimmer">Try again</button>
        <Link href="/" className="btn btn-ghost btn-lg">Back home</Link>
      </div>
    </div>
  );
}
