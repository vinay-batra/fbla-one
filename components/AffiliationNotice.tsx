/**
 * The single source of truth for the non-affiliation disclaimer.
 *
 * This sentence is load-bearing: ChapterPrep references FBLA's competitive
 * events descriptively, so every surface a user can land on needs to say
 * plainly that the product is independent. It previously lived only in the
 * marketing Footer, which meant the entire signed-in product (/app/*) and the
 * /auth page carried no disclaimer at all, which is where students actually
 * spend their time.
 *
 * Use the legal entity's current name, "Future Business Leaders of America,
 * Inc." Do not write "FBLA-PBL, Inc.", which is the former name.
 */

export const AFFILIATION_TEXT =
  "ChapterPrep is an independent student project. Not affiliated with, endorsed by, or sponsored by Future Business Leaders of America, Inc. FBLA competitive event names are referenced for educational use only.";

type Props = {
  /** "compact" for dense app chrome, "full" for the marketing footer. */
  variant?: "compact" | "full";
  style?: React.CSSProperties;
};

export function AffiliationNotice({ variant = "full", style }: Props) {
  const compact = variant === "compact";
  return (
    <p
      style={{
        // 12px rather than the old 11px, and --text3 rather than --text-muted:
        // the most legally load-bearing sentence on the site should not be the
        // least legible thing on the page.
        fontSize: compact ? 11 : 12,
        lineHeight: 1.6,
        color: "var(--text3)",
        maxWidth: 560,
        margin: 0,
        ...style,
      }}
    >
      {AFFILIATION_TEXT}
    </p>
  );
}
