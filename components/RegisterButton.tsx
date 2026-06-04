"use client";

import { useEffect, useState } from "react";
import { isRegistered, toggleRegistration, onStorageChange, getRegistered } from "@/lib/storage";

export function RegisterButton({ slug, name }: { slug: string; name: string }) {
  const [registered, setRegistered] = useState(false);
  const [otherTracked, setOtherTracked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const sync = () => {
      setRegistered(isRegistered(slug));
      setOtherTracked(getRegistered().some((s) => s !== slug));
    };
    sync();
    return onStorageChange(sync);
  }, [slug]);

  const onClick = () => {
    const next = toggleRegistration(slug);
    setRegistered(next);
    setOtherTracked(getRegistered().some((s) => s !== slug));
  };

  if (!mounted) {
    return (
      <button type="button" className="btn btn-accent btn-pill" disabled>
        Track my prep
      </button>
    );
  }

  // Single-event model: tracking a new event replaces the current one, so when a
  // different event is already tracked, say "Switch" rather than implying it adds.
  const label = registered ? "Tracking" : otherTracked ? "Switch to this event" : "Track my prep";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn ${registered ? "btn-ghost" : "btn-accent cta-shimmer"} btn-pill`}
      aria-label={registered ? `Remove ${name}` : otherTracked ? `Switch to ${name}` : `Track ${name}`}
    >
      {registered ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12l5 5L20 7" />
          </svg>
          Tracking
        </>
      ) : (
        <>{label}</>
      )}
    </button>
  );
}
