"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  onClick?: () => void;
  ariaLabel: string;
  size?: number;
  title?: string;
  active?: boolean;
};

export function IconBtn({ children, onClick, ariaLabel, size = 36, title, active }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      className="mi-btn"
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "0.5px solid var(--border2)",
        background: active ? "var(--accent-dim)" : "transparent",
        color: active ? "var(--accent)" : "var(--text)",
        transition: "background 0.18s ease, color 0.18s ease, border-color 0.18s ease",
      }}
      onMouseEnter={(e) => {
        if (active) return;
        e.currentTarget.style.background = "var(--bg3)";
        e.currentTarget.style.color = "var(--accent)";
        e.currentTarget.style.borderColor = "var(--accent-border)";
      }}
      onMouseLeave={(e) => {
        if (active) return;
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--text)";
        e.currentTarget.style.borderColor = "var(--border2)";
      }}
    >
      {children}
    </button>
  );
}
