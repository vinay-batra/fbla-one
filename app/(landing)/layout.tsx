import { Fraunces } from "next/font/google";
import { PublicNav } from "@/components/PublicNav";
import { Footer } from "@/components/Footer";
import "./editorial.css";

/**
 * The landing page lives in its own route group so it can wear the editorial
 * "exam paper" identity end to end, nav and footer included, without restyling
 * the rest of the marketing site. Route groups do not affect URLs: this is still
 * "/".
 *
 * `.ed` re-declares the design tokens (--bg, --text, --brand, ...) for its
 * subtree, so shared components like PublicNav and Footer pick up the paper and
 * ink palettes automatically. See editorial.css.
 *
 * Fraunces is loaded here rather than in the root layout, so only this page pays
 * for the display serif.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
  variable: "--font-serif",
});

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`ed ${fraunces.variable}`}>
      <PublicNav />
      <main id="main" tabIndex={-1} className="page-fadein">
        {children}
      </main>
      <Footer />
    </div>
  );
}
