"use client";

import { useEffect, useState } from "react";
import { isRegistered, toggleRegistration, onStorageChange } from "@/lib/storage";

export function RegisterButton({ slug, name }: { slug: string; name: string }) {
  const [registered, setRegistered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRegistered(isRegistered(slug));
    return onStorageChange(() => setRegistered(isRegistered(slug)));
  }, [slug]);

  const onClick = () => {
    const next = toggleRegistration(slug);
    setRegistered(next);
  };

  if (!mounted) {
    return (
      <button type="button" className="btn btn-accent btn-pill" disabled>
        Track my prep
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn ${registered ? "btn-ghost" : "btn-accent cta-shimmer"} btn-pill`}
      aria-label={registered ? `Remove ${name}` : `Track ${name}`}
    >
      {registered ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12l5 5L20 7" />
          </svg>
          Tracking
        </>
      ) : (
        <>Track my prep</>
      )}
    </button>
  );
}
