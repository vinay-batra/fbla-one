import type { Metadata } from "next";
import { PenUnderline } from "@/components/PenUnderline";
import { EventFinder } from "@/components/eventfinder/EventFinder";
import { QUESTIONS } from "@/components/eventfinder/questions";
import { COMPETITION_STATS } from "@/lib/competitions";
import "./finder.css";

const TITLE = "Which FBLA event is for me?";
const DESCRIPTION = `Answer ${QUESTIONS.length} quick questions and get the three FBLA competitive events that fit you best, out of all ${COMPETITION_STATS.total}, with the reason for each. Free, no account needed.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/find-your-event" },
  openGraph: {
    title: `${TITLE} · ChapterPrep`,
    description: DESCRIPTION,
    url: "/find-your-event",
    siteName: "ChapterPrep",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ChapterPrep" }],
  },
};

export default function FindYourEventPage() {
  return (
    <section className="ef-page">
      <div className="container ef-wrap">
        <header className="ef-hero">
          <p className="eyebrow rise">Find your event</p>
          <h1 className="ef-title rise rise-1">
            Which FBLA event is <PenUnderline delay={0.7}>made for you?</PenUnderline>
          </h1>
          <p className="ef-lede rise rise-2">
            {QUESTIONS.length} quick questions. We score all {COMPETITION_STATS.total} competitive events
            against your answers and show you the three that fit best, with the reason for each.
          </p>
          <p className="ef-meta rise rise-3">About a minute. No account, and your answers stay on this device.</p>
        </header>

        <div className="rise rise-4">
          <EventFinder />
        </div>
      </div>
    </section>
  );
}
