"use client";

/**
 * Global overlay components mounted at the root layout level.
 * Makes the feedback button + onboarding modal available on every page.
 */

import { useEffect } from "react";
import { FeedbackButton } from "./FeedbackButton";
import { OnboardingModal } from "./OnboardingModal";
import PublicAIChat from "./PublicAIChatLoader";

/** On phones, tuck the floating buttons away while scrolling down (CSS in
 *  globals.css only applies the class at phone widths). */
function useTuckFabsOnScroll() {
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const root = document.documentElement;
        if (y < 120 || y < lastY - 4) root.classList.remove("fab-tucked");
        else if (y > lastY + 4) root.classList.add("fab-tucked");
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.documentElement.classList.remove("fab-tucked");
    };
  }, []);
}

export function GlobalShell() {
  useTuckFabsOnScroll();
  return (
    <>
      <OnboardingModal />
      <FeedbackButton />
      <PublicAIChat />
    </>
  );
}
