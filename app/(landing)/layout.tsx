import { PublicNav } from "@/components/PublicNav";
import { Footer } from "@/components/Footer";
import "./editorial.css";

/**
 * The landing page lives in its own route group so it can carry layout and
 * interaction styles (editorial.css) the rest of the site does not need.
 * The paper/ink palette and Fraunces are now site-wide, set in globals.css and
 * the root layout. Route groups do not affect URLs: this is still "/".
 */
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ed">
      <PublicNav />
      <main id="main" tabIndex={-1} className="page-fadein">
        {children}
      </main>
      <Footer />
    </div>
  );
}
