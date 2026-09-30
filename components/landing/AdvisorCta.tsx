"use client";

import Link from "next/link";
import { useSignedIn } from "@/components/useSignedIn";

/**
 * "Create your chapter": signed in, straight to the chapter page (where any
 * account can create one and becomes its advisor); signed out, to sign-up with
 * the Advisor role already picked and the chapter page as the destination.
 */
export function AdvisorCta({ className, children }: { className?: string; children: React.ReactNode }) {
  const signedIn = useSignedIn();
  const href = signedIn ? "/app/chapter" : "/auth?mode=signup&role=advisor&next=/app/chapter";
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
