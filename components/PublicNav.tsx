import Link from "next/link";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function PublicNav() {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "var(--nav-bg)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
        }}
      >
        <Logo />
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <NavLink href="/competitions">Competitions</NavLink>
          <NavLink href="/pricing">Pricing</NavLink>
          <ThemeToggle />
          <Link href="/auth" className="btn btn-accent btn-sm">
            Sign in
          </Link>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        fontSize: 14,
        fontWeight: 500,
        color: "var(--text2)",
        transition: "color 0.2s ease",
      }}
    >
      {children}
    </Link>
  );
}
