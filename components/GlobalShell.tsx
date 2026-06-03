"use client";

/**
 * Global overlay components mounted at the root layout level.
 * Makes the feedback button + onboarding modal available on every page.
 */

import { FeedbackButton } from "./FeedbackButton";
import { OnboardingModal } from "./OnboardingModal";

export function GlobalShell() {
  return (
    <>
      <OnboardingModal />
      <FeedbackButton />
    </>
  );
}
