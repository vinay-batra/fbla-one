/**
 * Two fixed-position gold radial gradients that float behind everything.
 * Dark-mode only (CSS gate in globals.css). Pure decoration, pointer-events: none.
 */
export function AmbientOrbs() {
  return (
    <div
      className="ambient-orbs"
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-25%",
          right: "-20%",
          width: "65vw",
          height: "65vw",
          maxWidth: 900,
          maxHeight: 900,
          background:
            "radial-gradient(circle, rgba(255, 184, 28, 0.22) 0%, rgba(255, 184, 28, 0.08) 35%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-28%",
          left: "-22%",
          width: "60vw",
          height: "60vw",
          maxWidth: 820,
          maxHeight: 820,
          background:
            "radial-gradient(circle, rgba(93, 156, 228, 0.14) 0%, rgba(93, 156, 228, 0.05) 40%, transparent 75%)",
          filter: "blur(80px)",
        }}
      />
    </div>
  );
}
