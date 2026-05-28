"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "fbla_onboarded";

const STEPS = [
  {
    num: "01",
    title: "Pick your competitions",
    body: "Browse all 55 FBLA events. Register for the ones you are competing in to track your prep.",
    href: "/competitions",
    cta: "Browse events",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 4h10l-1 7-4 5-4-5L7 4z" />
        <path d="M12 16v5" />
        <path d="M8 21h8" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Practice with AI",
    body: "Generate a 100-question practice test for any objective event. Every wrong answer explained.",
    href: "/app/coach",
    cta: "Try a test",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3L13.5 8.5H19L14.5 11.5L16 17L12 14L8 17L9.5 11.5L5 8.5H10.5L12 3Z" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Track your deadlines",
    body: "Add competition sign-up dates and test days. Get alerted when they are coming up.",
    href: "/app/chapter",
    cta: "Add deadlines",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
];

export function OnboardingModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) {
        const t = setTimeout(() => setShow(true), 700);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage unavailable — skip onboarding
    }
  }, []);

  function dismiss() {
    try { localStorage.setItem(KEY, "1"); } catch {}
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 100%)",
          background: "var(--card-bg)",
          border: "0.5px solid var(--border2)",
          borderRadius: 20,
          boxShadow: "var(--shadow-lg)",
          padding: "32px 32px 28px",
          animation: "fadeUp 0.2s ease",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 6, color: "var(--accent)" }}>Welcome to FBLA One</p>
            <h2 style={{ fontSize: 24, letterSpacing: "-0.02em" }}>Three things to do first.</h2>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 4, marginTop: 2 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p style={{ fontSize: 14, color: "var(--text3)", marginBottom: 24, lineHeight: 1.6 }}>
          Here is how to get the most out of your account. Click any step to go there now.
        </p>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {STEPS.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              onClick={dismiss}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 16px",
                borderRadius: 12,
                border: "0.5px solid var(--border)",
                background: "var(--bg2)",
                textDecoration: "none",
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-border)";
                e.currentTarget.style.background = "var(--accent-dim)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "var(--bg2)";
              }}
            >
              <div
                className="font-mono"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "var(--accent-dim)",
                  border: "0.5px solid var(--accent-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {s.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{s.title}</p>
                <p style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.5 }}>{s.body}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="btn btn-accent btn-pill cta-shimmer"
          style={{ width: "100%", fontSize: 15, padding: "13px 0" }}
        >
          Got it, let&apos;s go
        </button>
      </div>
    </div>
  );
}
