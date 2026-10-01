import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AffiliationNotice } from "@/components/AffiliationNotice";
import "@/app/auth/auth.css";

/**
 * Shared chrome for /auth and /auth/update-password: a slim top bar, the form
 * card on the right and, on wide screens, one line plus a graded sample
 * question on the left. The sample is the same depreciation question as the
 * link preview image (scripts/og-image.html): (50,000 - 5,000) / 5 = 9,000.
 */
export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="au">
      <header className="au-top">
        <Logo size="md" />
        <div className="au-top-right">
          <Link href="/" className="au-back" aria-label="Back to home">
            <span aria-hidden="true">&larr;</span>
            <span className="au-back-label" aria-hidden="true">Back to home</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main id="main" tabIndex={-1} className="au-main">
        <aside className="au-side" aria-hidden="true">
          <p className="au-side-title">
            Walk into regionals <em>already knowing the test.</em>
          </p>
          <div className="au-stack">
            <div className="au-sheet-back" />
            <div className="au-sheet">
              <div className="au-sheet-meta">
                <span>Question 3 of 5</span>
                <b>Accounting</b>
              </div>
              <p className="au-sheet-q">
                A $50,000 truck has a $5,000 salvage value and a 5-year life. Yearly straight-line depreciation?
              </p>
              <ul className="au-sheet-opts">
                <li><span className="bub">A</span>$10,000</li>
                <li className="is-right">
                  <svg className="au-pen au-pen-circle" viewBox="0 0 52 46">
                    <path d="M8 17C12 6 28 2 38 6c9 4 12 14 8 23-5 11-22 14-32 9C5 34 3 25 8 17c3-5 9-8 15-9" />
                  </svg>
                  <span className="bub">B</span>$9,000
                  <svg className="au-pen au-pen-check" viewBox="0 0 30 24">
                    <path d="M3 13c3 2 6 5 8 8 4-8 9-14 16-18" />
                  </svg>
                </li>
                <li><span className="bub">C</span>$11,000</li>
                <li><span className="bub">D</span>$45,000</li>
              </ul>
              <p className="au-sheet-why"><b>Why:</b> subtract salvage first. $45,000 ÷ 5 = $9,000.</p>
            </div>
          </div>
        </aside>

        <section className="au-card">{children}</section>
      </main>

      <footer className="au-foot">
        <AffiliationNotice variant="compact" />
      </footer>
    </div>
  );
}
