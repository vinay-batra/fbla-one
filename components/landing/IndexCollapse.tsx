"use client";

import { useEffect } from "react";

/**
 * Folds the event index's categories on phones. The server renders every
 * category open, so desktop and no-JS visitors see the full index; this closes
 * them once on phone-width screens so the list is a short set of categories.
 */
export function IndexCollapse() {
  useEffect(() => {
    if (!matchMedia("(max-width: 640px)").matches) return;
    document.querySelectorAll<HTMLDetailsElement>("details.index-group").forEach((d) => {
      d.open = false;
    });
  }, []);
  return null;
}
