"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") console.error(error);
  }, [error]);

  return (
    <html lang="en" data-theme="dark">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "40px 24px",
          gap: 16,
          fontFamily: "var(--font-body)",
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.22em",
            color: "#ffb81c",
            textTransform: "uppercase",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
          }}
        >
          FBLA One
        </p>
        <h1 style={{ fontSize: 40, letterSpacing: "-0.02em", color: "var(--text)" }}>
          Something broke.
        </h1>
        <p style={{ fontSize: 16, color: "var(--text2)", maxWidth: 440, lineHeight: 1.6 }}>
          A critical error occurred. Reload the page to continue.
        </p>
        <button onClick={reset} className="btn btn-accent btn-lg" style={{ marginTop: 10 }}>
          Reload
        </button>
      </body>
    </html>
  );
}
