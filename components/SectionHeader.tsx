import { ScrollReveal } from "./ScrollReveal";

type Props = {
  eyebrow?: string;
  title: string;
  /** Optional supporting copy under the headline. */
  tagline?: string;
  /** Defaults to center. */
  align?: "center" | "left";
  /** Highlight the last word of the title in accent color. Defaults to false. */
  accentLastWord?: boolean;
};

export function SectionHeader({ eyebrow, title, tagline, align = "center", accentLastWord }: Props) {
  const words = accentLastWord ? title.split(" ") : null;
  const head =
    words && words.length > 1 ? (
      <>
        {words.slice(0, -1).join(" ")} <span style={{ color: "var(--accent)" }}>{words[words.length - 1]}</span>
      </>
    ) : (
      title
    );

  return (
    <div
      style={{
        textAlign: align,
        maxWidth: align === "center" ? 780 : undefined,
        marginLeft: align === "center" ? "auto" : undefined,
        marginRight: align === "center" ? "auto" : undefined,
      }}
    >
      {eyebrow && (
        <ScrollReveal>
          <p className="eyebrow" style={{ marginBottom: 14 }}>{eyebrow}</p>
        </ScrollReveal>
      )}
      <ScrollReveal delay={0.05}>
        <h2 className="section-headline">{head}</h2>
      </ScrollReveal>
      {tagline && (
        <ScrollReveal delay={0.1}>
          <p
            className="section-tagline"
            style={{
              marginLeft: align === "center" ? "auto" : 0,
              marginRight: align === "center" ? "auto" : 0,
            }}
          >
            {tagline}
          </p>
        </ScrollReveal>
      )}
    </div>
  );
}
