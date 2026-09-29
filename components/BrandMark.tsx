import { useId } from "react";

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
 * The gradient id comes from useId() so several marks on one page (nav, footer,
 * chat bubble) never collide on a shared id.
 *
 * Keep this geometry in sync with scripts/logo-mark.svg, which is what the
 * raster assets (favicons, PWA icons, OG card) are generated from.
 */
export function BrandMark({ size = 28, className, title }: Props) {
  const gid = `cp-mark-${useId().replace(/:/g, "")}`;
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
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
      <path
        d="M17 6h30a5 5 0 0 1 5 5v47l-20-12-20 12V11a5 5 0 0 1 5-5z"
        fill={`url(#${gid})`}
      />
      <path
        d="M22.5 26.5l6.5 6.5 13-14"
        fill="none"
        stroke="#fff"
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
