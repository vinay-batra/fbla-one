"use client";

/**
 * Global overlay components mounted at the root layout level.
 * This makes CommandPalette (Cmd+K) and FeedbackButton available
 * on every page - marketing, auth, and app.
 */

import { CommandPalette } from "./CommandPalette";
import { FeedbackButton } from "./FeedbackButton";

export function GlobalShell() {
  return (
    <>
      <CommandPalette />
      <FeedbackButton />
    </>
  );
}
