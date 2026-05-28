"use client";

import { useEffect, useState } from "react";
import {
  getSavedResources,
  addSavedResource,
  removeSavedResource,
  onStorageChange,
} from "@/lib/storage";
import type { StudyResource } from "@/lib/competitions";

type Props = {
  resources: StudyResource[];
  competitionSlug: string;
};

export function StudyResourcesList({ resources, competitionSlug }: Props) {
  const [tick, setTick] = useState(0);
  useEffect(() => onStorageChange(() => setTick((t) => t + 1)), []);
  void tick;

  const saved = getSavedResources();
  const savedUrls = new Set(saved.map((r) => r.url));

  function toggle(r: StudyResource) {
    const existing = saved.find((s) => s.url === r.url);
    if (existing) {
      removeSavedResource(existing.id);
    } else {
      addSavedResource({
        competitionSlug,
        title: r.title,
        url: r.url,
        note: r.note ?? null,
      });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {resources.map((r) => {
        const isSaved = savedUrls.has(r.url);
        return (
          <div
            key={r.url}
            className="resource-link"
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            {/* Kind badge */}
            <span
              className="font-mono"
              style={{
                flexShrink: 0,
                fontSize: 9,
                letterSpacing: "0.14em",
                color: "var(--accent)",
                fontWeight: 700,
                padding: "5px 9px",
                borderRadius: 6,
                background: "var(--accent-dim)",
                border: "0.5px solid var(--accent-border)",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {r.kind}
            </span>

            {/* Title + note */}
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ flex: 1, minWidth: 0, textDecoration: "none" }}
            >
              <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                {r.title}
              </span>
              {r.note && (
                <span style={{ display: "block", fontSize: 12, color: "var(--text3)", marginTop: 3 }}>
                  {r.note}
                </span>
              )}
            </a>

            {/* External link icon */}
            <a href={r.url} target="_blank" rel="noopener noreferrer" aria-label="Open link" style={{ flexShrink: 0, color: "var(--text3)", display: "flex" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <path d="M15 3h6v6" />
                <path d="M10 14L21 3" />
              </svg>
            </a>

            {/* Save button */}
            <button
              type="button"
              onClick={() => toggle(r)}
              aria-label={isSaved ? "Remove from saved" : "Save resource"}
              title={isSaved ? "Saved - click to remove" : "Save to your library"}
              style={{
                flexShrink: 0,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                color: isSaved ? "var(--accent)" : "var(--text3)",
                transition: "color 0.15s",
                display: "flex",
                alignItems: "center",
              }}
            >
              {isSaved ? (
                /* Filled bookmark */
                <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              ) : (
                /* Outline bookmark */
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
