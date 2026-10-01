"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addSavedResource,
  getRegistered,
  getSavedResources,
  removeSavedResource,
  onStorageChange,
} from "@/lib/storage";
import { getCompetition, type StudyResource } from "@/lib/competitions";
import { PageHeader } from "@/components/app/PageHeader";

/**
 * Saved resources, plus the study resources listed for your own event (from
 * lib/competitions.ts) so the page is useful before you have saved anything.
 */

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function ResourcesPage() {
  const [tick, setTick] = useState(0);
  useEffect(() => onStorageChange(() => setTick((t) => t + 1)), []);
  const { saved, myEvent } = useMemo(() => {
    void tick;
    return {
      saved: getSavedResources(),
      myEvent: getRegistered().map((s) => getCompetition(s)).find(Boolean) ?? null,
    };
  }, [tick]);

  const [filter, setFilter] = useState<string>("all");
  const savedUrls = new Set(saved.map((r) => r.url));
  const suggested = myEvent?.studyResources ?? [];

  const groups = Array.from(new Set(saved.map((r) => r.competitionSlug ?? "")));
  const shown = filter === "all" ? saved : saved.filter((r) => (r.competitionSlug ?? "") === filter);

  function toggle(r: StudyResource) {
    if (!myEvent) return;
    const existing = saved.find((s) => s.url === r.url);
    if (existing) removeSavedResource(existing.id);
    else addSavedResource({ competitionSlug: myEvent.slug, title: r.title, url: r.url, note: r.note ?? null });
  }

  return (
    <div className="app-page">
      <PageHeader
        eyebrow="Saved resources"
        title={<>Your study <em>shelf.</em></>}
        sub="Guides, videos and practice sets worth keeping. Save any of them with the bookmark."
      />

      {myEvent && suggested.length > 0 && (
        <section className="db-ledger" aria-labelledby="rs-suggested">
          <div className="db-ledger-head">
            <h2 id="rs-suggested">For {myEvent.name}</h2>
            <Link href={`/competitions/${myEvent.slug}`}>Event guide</Link>
          </div>
          <ul>
            {suggested.map((r) => {
              const isSaved = savedUrls.has(r.url);
              return (
                <li key={r.url} className="rs-row">
                  <span className="db-ledger-name">
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="rs-link">{r.title}</a>
                    <span className="db-ledger-kind">{r.kind} · {hostOf(r.url)}{r.note ? ` · ${r.note}` : ""}</span>
                  </span>
                  <button
                    type="button"
                    className={`rs-save${isSaved ? " is-saved" : ""}`}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? `Remove ${r.title} from saved` : `Save ${r.title}`}
                    onClick={() => toggle(r)}
                  >
                    <BookmarkIcon filled={isSaved} />
                    <span>{isSaved ? "Saved" : "Save"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="db-ledger" aria-labelledby="rs-saved">
        <div className="db-ledger-head">
          <h2 id="rs-saved">Saved{saved.length ? ` (${saved.length})` : ""}</h2>
          {groups.length > 1 && (
            <div className="hs-filters" role="group" aria-label="Show">
              <button type="button" className="hs-filter" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All</button>
              {groups.map((g) => (
                <button key={g || "general"} type="button" className="hs-filter" aria-pressed={filter === g} onClick={() => setFilter(g)}>
                  {g ? getCompetition(g)?.name ?? g : "General"}
                </button>
              ))}
            </div>
          )}
        </div>
        {saved.length === 0 ? (
          <p className="hs-none">
            Nothing saved yet.{" "}
            {myEvent && suggested.length > 0
              ? "Tap Save on anything above."
              : <>Open your event in <Link href="/competitions" className="rs-inline">all events</Link> and save its resources.</>}
          </p>
        ) : (
          <ul>
            {shown.map((r) => {
              const comp = r.competitionSlug ? getCompetition(r.competitionSlug) : null;
              return (
                <li key={r.id} className="rs-row">
                  <span className="db-ledger-name">
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="rs-link">{r.title}</a>
                    <span className="db-ledger-kind">
                      {comp ? `${comp.name} · ` : ""}{hostOf(r.url)}{r.note ? ` · ${r.note}` : ""}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="rs-save is-saved"
                    aria-label={`Remove ${r.title} from saved`}
                    onClick={() => removeSavedResource(r.id)}
                  >
                    <BookmarkIcon filled />
                    <span>Remove</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
