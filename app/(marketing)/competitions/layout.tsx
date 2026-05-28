import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Competitions",
  description:
    "Browse every FBLA competitive event. Filter by category, format, and content depth. Each event has a prep page with test topics, study resources, and the official rubric.",
  alternates: { canonical: "/competitions" },
};

export default function CompetitionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
