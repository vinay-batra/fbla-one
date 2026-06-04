"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";

const TYPES = ["Bug", "Feedback", "Feature request"] as const;
type FeedbackType = (typeof TYPES)[number];

export function FeedbackButton() {
  // The AI chat bubble (60px) owns the bottom-right corner on every page, so the
  // feedback flag always sits to its left at right 96.
  const fabRight = 96;
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("Bug");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const fabRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Watch the global data-theme attribute so the open-state X reads in both themes.
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const sync = () => setDark(document.documentElement.getAttribute("data-theme") !== "light");
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  const close = useCallback(() => {
    if (submitting) return;
    setOpen(false);
    setError("");
    setSubmitted(false);
    setMessage("");
    setType("Bug");
    fabRef.current?.focus();
  }, [submitting]);

  // Focus the textarea on open; Escape closes; Tab is trapped inside the dialog.
  useEffect(() => {
    if (!open) return;
    const node = dialogRef.current;
    const prevFocus = document.activeElement as HTMLElement | null;
    const focusables = () =>
      node
        ? Array.from(
            node.querySelectorAll<HTMLElement>(
              'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => !el.hasAttribute("disabled"))
        : [];
    const t = setTimeout(() => textareaRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key === "Tab") {
        const items = focusables();
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); document.removeEventListener("keydown", onKey); prevFocus?.focus?.(); };
  }, [open, close]);

  const submit = async () => {
    if (!message.trim()) { setError("Please enter a message."); return; }
    const supa = getSupabase();
    if (!supa) { setError("Feedback is temporarily unavailable."); return; }
    setSubmitting(true);
    setError("");
    try {
      const { data: { user } } = await supa.auth.getUser();
      const { error: dbErr } = await supa.from("feedback").insert({
        user_id: user?.id ?? null,
        type,
        message: message.trim(),
        page: typeof window !== "undefined" ? window.location.pathname : null,
      });
      if (dbErr) throw dbErr;
      setSubmitted(true);
      setMessage("");
      setTimeout(() => { setSubmitted(false); setOpen(false); fabRef.current?.focus(); }, 2200);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.error("Feedback submit failed:", e);
      setError("Could not submit. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <>
      {/* Floating report-a-bug / feedback button - flag glyph, sits left of the AI bubble */}
      <button
        ref={fabRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={open ? "Close feedback" : "Report a bug or send feedback"}
        title={open ? "Close" : "Report a bug"}
        className="fbla-feedback-btn"
        style={{
          position: "fixed",
          bottom: 24,
          right: fabRight,
          zIndex: 1000,
          width: 44,
          height: 44,
          borderRadius: "50%",
          // Mirror the AI bubble's open-state look so it clearly reads as a close button.
          background: open ? "var(--bg3)" : "var(--card-bg)",
          border: open ? "0.5px solid var(--border2)" : "0.5px solid var(--border)",
          color: "var(--text2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: open
            ? "0 4px 14px rgba(0,0,0,0.18)"
            : "0 6px 20px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.08)",
          transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s, color 0.2s, transform 0.2s",
          transform: open ? "scale(0.96)" : "scale(1)",
        }}
        onMouseEnter={(e) => {
          if (open) return;
          e.currentTarget.style.borderColor = "rgba(var(--accent-rgb),0.55)";
          e.currentTarget.style.background = "rgba(var(--accent-rgb),0.08)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.22), 0 0 0 4px rgba(var(--accent-rgb),0.12)";
          e.currentTarget.style.color = "var(--accent)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          if (open) return;
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.background = "var(--card-bg)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.08)";
          e.currentTarget.style.color = "var(--text2)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {open ? (
          // Close X - white in dark mode so it reads on the dark disc (matches the AI bubble).
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={dark ? "#ffffff" : "#0a1322"} strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          // Waving flag on a pole - the classic "report" mark, stroked for a cleaner look
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 21V4" />
            <path d="M5 4c2.5-1.4 5-1.4 7.5 0s5 1.4 7.5 0v9c-2.5 1.4-5 1.4-7.5 0s-5-1.4-7.5 0" />
          </svg>
        )}
      </button>

      {/* Modal */}
      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-title"
            style={{
              width: "min(440px, 100%)",
              background: "var(--card-bg)",
              border: "0.5px solid var(--border2)",
              borderRadius: 16,
              boxShadow: "var(--shadow-lg)",
              overflow: "hidden",
              animation: "fadeUp 0.18s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, padding: "22px 24px 18px", borderBottom: "0.5px solid var(--border)" }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: 6, color: "var(--accent)" }}>Feedback</p>
                <h2 id="feedback-title" style={{ fontSize: 19, letterSpacing: "-0.02em" }}>Tell us what&apos;s up</h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close feedback"
                style={{ width: 28, height: 28, borderRadius: 8, background: "var(--bg3)", border: "0.5px solid var(--border)", color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div style={{ padding: "18px 24px 22px" }}>
              {submitted ? (
                <div style={{ textAlign: "center", padding: "18px 0" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 999, background: "rgba(var(--green-rgb), 0.12)", border: "1px solid rgba(var(--green-rgb), 0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Thank you</p>
                  <p style={{ fontSize: 12, color: "var(--text3)" }}>Your feedback has been received.</p>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <label htmlFor="feedback-type" className="font-mono" style={{ display: "block", fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: 7 }}>Type</label>
                    <select id="feedback-type" value={type} onChange={(e) => setType(e.target.value as FeedbackType)} className="input-field" style={{ width: "100%", cursor: "pointer" }}>
                      {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label htmlFor="feedback-message" className="font-mono" style={{ display: "block", fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: 7 }}>Message</label>
                    <textarea
                      ref={textareaRef}
                      id="feedback-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe the bug, idea, or feedback..."
                      rows={4}
                      className="input-field"
                      style={{ width: "100%", resize: "vertical", minHeight: 90, lineHeight: 1.55 }}
                    />
                  </div>

                  {error && <p style={{ fontSize: 12, color: "var(--red)", marginBottom: 12 }}>{error}</p>}

                  <button type="button" onClick={submit} disabled={submitting} className="btn btn-accent btn-pill" style={{ width: "100%", opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? "Sending..." : "Send"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
