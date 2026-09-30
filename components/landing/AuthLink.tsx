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
  // Setting up a chapter is an advisor's job, so pre-pick that role at sign-up.
  const role = href.startsWith("/app/chapter") ? "&role=advisor" : "";
  const to = signedIn ? href : `/auth?mode=signup${role}&next=${encodeURIComponent(href)}`;
  return (
    <Link href={to} className={className}>
      {children}
    </Link>
  );
}
