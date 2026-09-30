"use client";

import Link from "next/link";
import { useSignedIn } from "@/components/useSignedIn";

/**
 * One auth-aware primary CTA. Signed in -> "Go to dashboard"; signed out ->
 * the given label (defaults to "Get started"). Auth state comes from
 * useSignedIn, which seeds from the fbla_logged_in cache and never statically
 * imports the Supabase client.
 */
export function HeroCta({
  signedOutLabel = "Get started",
  signedOutHref = "/auth?mode=signup",
  className = "btn btn-accent btn-lg",
  wrap = true,
}: {
  signedOutLabel?: string;
  signedOutHref?: string;
  className?: string;
  /** false renders just the link, for layouts that supply their own row. */
  wrap?: boolean;
}) {
  const loggedIn = useSignedIn();
  const link = loggedIn ? (
    <Link href="/app" className={className}>Go to dashboard</Link>
  ) : (
    <Link href={signedOutHref} className={className}>{signedOutLabel}</Link>
  );
  if (!wrap) return link;
  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 36, flexWrap: "wrap" }}>
      {link}
    </div>
  );
}
