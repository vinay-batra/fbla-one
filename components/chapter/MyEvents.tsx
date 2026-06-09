"use client";

import Link from "next/link";
import { Card, CardHeader } from "@/components/Card";
import { getCompetition } from "@/lib/competitions";
import type { ChapterController } from "./useChapterData";

// "My events" chip grid (the user's registered events). Extracted from
// app/app/chapter/page.tsx (issue #47).

export function MyEvents({ c }: { c: ChapterController }) {
  const { registered } = c;
  return (
    <Card>
      <CardHeader
        eyebrow="Registered"
        title="My events"
        tagline="Events you have added to your competition queue."
        right={<Link href="/competitions" className="btn btn-ghost btn-sm">Browse all</Link>}
      />
      {registered.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 8 }}>
          No events yet.{" "}
          <Link href="/competitions" style={{ color: "var(--accent-text)" }}>Browse competitions</Link>
          {" "}to add some.
        </p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {registered.map((slug) => {
            const comp = getCompetition(slug);
            return (
              <Link key={slug} href={`/competitions/${slug}`} className="chip chip-brand" style={{ textDecoration: "none", fontSize: 12, padding: "5px 12px", borderRadius: 999 }}>
                {comp?.name ?? slug}
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
