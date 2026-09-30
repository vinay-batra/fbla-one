type Props = {
  size?: number;
  className?: string;
  /** Decorative by default: the wordmark or a parent aria-label names the brand. */
  title?: string;
};

/**
 * The ChapterPrep mark: a bookmark, because a bookmark marks a chapter, with a
 * check that reads as "prepped". Rendered as inline SVG so it stays crisp at
 * every size from the 16px favicon up, needs no image request, and cannot blur
 * on high-density screens.
 *
 * Colors are fixed rather than themed: a red ribbon bookmark (the red pen)
 * with a paper-colored check reads on both paper and ink, and matches the
 * favicon exactly.
 *
 * Keep this geometry in sync with scripts/logo-mark.svg, which is what the
 * raster assets (favicons, PWA icons, OG card) are generated from.
 */
const MARK_RED = "#b8362a";
const MARK_PAPER = "#fbf8f1";

export function BrandMark({ size = 28, className, title }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={{ display: "block", flexShrink: 0 }}
    >
      <path d="M17 6h30a5 5 0 0 1 5 5v47l-20-12-20 12V11a5 5 0 0 1 5-5z" fill={MARK_RED} />
      <path
        d="M22.5 26.5l6.5 6.5 13-14"
        fill="none"
        stroke={MARK_PAPER}
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
