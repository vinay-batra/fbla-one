import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All FBLA events",
  description:
    "Every FBLA competitive event, filterable by category and format. Each one has a prep page with its format, test topics, study resources and a link to FBLA's official guidelines.",
  alternates: { canonical: "/competitions" },
};

export default function CompetitionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
