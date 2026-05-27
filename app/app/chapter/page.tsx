"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/Card";
import { HeroBadge } from "@/components/HeroBadge";
import { getChapterName, setChapterName, onStorageChange } from "@/lib/storage";

export default function ChapterPage() {
  const [tick, setTick] = useState(0);
  useEffect(() => onStorageChange(() => setTick((t) => t + 1)), []);
  void tick;

  const chapter = getChapterName();
  const [draft, setDraft] = useState(chapter);
  useEffect(() => setDraft(chapter), [chapter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1240 }}>
      <div>
        <p className="eyebrow" style={{ marginBottom: 8 }}>Chapter</p>
        <h1 style={{ fontSize: 28, letterSpacing: "-0.02em" }}>{chapter || "Set up your chapter"}</h1>
        <p style={{ fontSize: 14, color: "var(--text3)", marginTop: 6 }}>
          Single-member mode for the pilot. Chapter-wide features (advisor dashboard, deadline calendar,
          member roster) ship with the Chapter tier — join the waitlist below.
        </p>
      </div>

      <Card>
        <CardHeader eyebrow="Your chapter" title="Chapter info" />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setChapterName(draft.trim());
          }}
          style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 6 }}
        >
          <label
            className="font-mono"
            style={{
              display: "block",
              fontSize: 9,
              letterSpacing: "0.18em",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            Chapter name
          </label>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Council Rock South FBLA"
            className="input-field"
          />
          <button type="submit" className="btn btn-accent btn-sm btn-pill" style={{ alignSelf: "flex-start" }}>
            Save chapter
          </button>
        </form>
      </Card>

      <Card variant="accent">
        <HeroBadge>Coming with Chapter tier</HeroBadge>
        <h2 style={{ fontSize: 22, marginTop: 14, marginBottom: 14, letterSpacing: "-0.02em" }}>
          Run your whole chapter from one place.
        </h2>
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "Advisor dashboard — see who's signed up for what across every event",
            "Member roster with officer / member roles",
            "Chapter-wide deadline calendar with email reminders",
            "Custom chapter announcements",
            "Export rosters for regional sign-ups",
          ].map((line) => (
            <li
              key={line}
              style={{
                display: "flex",
                gap: 10,
                fontSize: 13.5,
                color: "var(--text2)",
                lineHeight: 1.55,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0, marginTop: 2 }}
              >
                <path d="M5 12l5 5L20 7" />
              </svg>
              {line}
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/pricing" className="btn btn-accent btn-sm btn-pill cta-shimmer">
            See pricing
          </Link>
          <Link href="mailto:hello@fbla.one" className="btn btn-ghost btn-sm btn-pill">
            Email me when it launches
          </Link>
        </div>
      </Card>
    </div>
  );
}
