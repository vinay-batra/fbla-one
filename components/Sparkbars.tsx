/**
 * Tiny inline SVG bar chart shared by the dashboard score trends and the
 * advisor chapter stats. Pure + presentational (no hooks), so it can render
 * in either a server or client component.
 *
 * variant "score": each value is a 0-100 percentage, colored by threshold
 *   (green >= 80, accent >= 60, else red). Used for score history.
 * variant "volume": bars are scaled to the series max and share one color.
 *   Used for counts (e.g. practice tests per week).
 */

type SparkbarsProps = {
  values: number[];
  width?: number;
  height?: number;
  gap?: number;
  variant?: "score" | "volume";
  color?: string;
  ariaLabel?: string;
};

export function Sparkbars({
  values,
  width = 120,
  height = 40,
  gap = 3,
  variant = "score",
  color = "var(--accent)",
  ariaLabel,
}: SparkbarsProps) {
  const n = values.length;
  if (n === 0) return null;
  const barW = Math.max(3, Math.floor((width - (n - 1) * gap) / n));
  const max = variant === "volume" ? Math.max(...values, 1) : 100;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: "visible" }}
      role="img"
      aria-label={ariaLabel}
    >
      {values.map((v, i) => {
        const ratio = Math.max(0, Math.min(1, v / max));
        const h = Math.max(2, Math.round(ratio * (height - 4)));
        const x = i * (barW + gap);
        const y = height - h;
        const fill =
          variant === "score"
            ? v >= 80
              ? "var(--green)"
              : v >= 60
                ? "var(--accent)"
                : "var(--red)"
            : color;
        const opacity = i === n - 1 ? 1 : variant === "score" ? 0.55 : 0.7;
        return <rect key={i} x={x} y={y} width={barW} height={h} rx={2} fill={fill} opacity={opacity} />;
      })}
    </svg>
  );
}
