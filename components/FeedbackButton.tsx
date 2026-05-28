"use client";

import { useState } from "react";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const submit = () => {
    if (!message.trim()) return;
    const subject = encodeURIComponent("Feedback - FBLA One");
    const body = encodeURIComponent(message.trim());
    window.open(`mailto:hello@fbla.one?subject=${subject}&body=${body}`, "_blank");
    setMessage("");
    setOpen(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 10,
      }}
    >
      {open && (
        <div
          style={{
            width: 300,
            background: "var(--card-bg)",
            border: "0.5px solid var(--border2)",
            borderRadius: 14,
            boxShadow: "var(--shadow-lg)",
            padding: 18,
            animation: "fadeUp 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <p style={{ fontSize: 14, fontWeight: 700 }}>Send feedback</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", padding: 4 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12 }}>
            Found a bug or have a suggestion? We read everything.
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what's on your mind..."
            rows={4}
            className="input-field"
            style={{ width: "100%", resize: "none", marginBottom: 10 }}
          />
          <button
            type="button"
            onClick={submit}
            className="btn btn-accent btn-sm btn-pill"
            style={{ width: "100%" }}
          >
            Send via email
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label="Send feedback"
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          background: "var(--accent)",
          color: "var(--bg)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "var(--shadow-md)",
          transition: "transform 0.15s ease",
        }}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
