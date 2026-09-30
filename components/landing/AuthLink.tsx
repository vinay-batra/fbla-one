"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useSignedIn } from "@/components/useSignedIn";

/**
 * A link into the signed-in app from the landing page. Signed in, it goes
 * straight there; signed out, it goes through sign-up and then lands on the
 * same page (the /app layout itself would redirect to /auth without a return).
 */
export function AuthLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const signedIn = useSignedIn();
  const to = signedIn ? href : `/auth?mode=signup&next=${encodeURIComponent(href)}`;
  return (
    <Link href={to} className={className}>
      {children}
    </Link>
  );
}
