import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Competitions",
  description:
    "Browse every FBLA competitive event. Filter by category, format, and content depth. Each event has a prep page with test topics, curated study resources, and a link to FBLA's official event guidelines.",
  alternates: { canonical: "/competitions" },
};

export default function CompetitionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
