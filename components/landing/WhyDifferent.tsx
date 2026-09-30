import { WhyCarousel } from "@/components/landing/WhyCarousel";

/**
 * The case for ChapterPrep in one section: the question every visitor has,
 * answered by a horizontal walkthrough of six things a general chatbot will
 * not do for a competitor, each shown rather than described.
 */
export function WhyDifferent() {
  return (
    <div className="container">
      <div className="ed-section-head ed-section-head-wide">
        <p className="ed-kicker">Why ChapterPrep</p>
        <h2 className="ed-h2">Why not just ask a chatbot?</h2>
        <p className="ed-muted wd-lede">
          Fair question. ChatGPT, Claude and Gemini can answer almost anything, but none of them
          were built to get you ready for FBLA competition. Here are six things they will not do for
          you.
        </p>
      </div>
      <WhyCarousel />
    </div>
  );
}
