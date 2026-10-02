import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AffiliationNotice } from "@/components/AffiliationNotice";
import { AuthSide } from "./AuthSide";
import "@/app/auth/auth.css";

/**
 * Shared chrome for /auth and /auth/update-password: a slim top bar, the form
 * card on the right and, on wide screens, one line plus a graded sample
 * question on the left (components/auth/AuthSide.tsx), which rotate together.
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
        <AuthSide />

        <section className="au-card">{children}</section>
      </main>

      <footer className="au-foot">
        <AffiliationNotice variant="compact" />
      </footer>
    </div>
  );
}
