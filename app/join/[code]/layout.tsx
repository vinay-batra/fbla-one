import type { Metadata } from "next";

/**
 * Chapter invite links are private by nature: the URL contains the join code.
 * The page itself is a client component and cannot export metadata, so the
 * noindex lives here. robots.txt also disallows /join/, but a crawler that
 * reaches the URL from a shared link never reads robots for that decision.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
