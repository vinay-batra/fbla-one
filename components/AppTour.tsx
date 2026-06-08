"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useFocusTrap } from "@/components/useFocusTrap";

type Step = {
  selector?: string; // element to spotlight; omitted = centered card
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    title: "Welcome to FBLA One",
    body: "Here is a 30-second tour of everything you can do. Use the arrows to move along, or skip anytime.",
  },
  {
    selector: '.tour-event',
    title: "Pick your event",
    body: "Choose the one event you are competing in. Everything in the app is geared toward it. You can change it anytime.",
  },
  {
    selector: '[data-tour="coach"]',
    title: "Generate practice tests",
    body: "Unlimited questions calibrated to your event's exact topics, with an explanation on every answer.",
  },
  {
    selector: '[data-tour="tracker"]',
    title: "Track every score",
    body: "Your results log here automatically so you can watch yourself improve over time.",
  },
  {
    selector: '[data-tour="chapter"]',
    title: "Your chapter",
    body: "Enter your advisor's invite code to join your chapter, or create one to run it yourself.",
  },
  {
    selector: ".fbla-ai-chat-btn",
    title: "Ask anytime",
    body: "Stuck on a concept? Ask the FBLA One assistant from any page, day or night.",
  },
  {
    title: "You are all set",
    body: "Pick your event and generate your first practice test. Good luck at regionals.",
  },
];

const PAD = 8;

export function AppTour() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Trigger: explicit ?tour=1 (Settings replay), or first ever app visit.
  useEffect(() => {
    if (!pathname.startsWith("/app")) return;
    const forced = searchParams.get("tour") === "1";
    let done = false;
    try { done = localStorage.getItem("fbla_tour_done") === "1"; } catch {}
    // Auto-start only on the dashboard so the nav-focused tour never dims a
    // sub-page like the advisor chapter-creation form (forced replay still works anywhere).
    if (forced || (!done && pathname === "/app")) {
      // Make sure the marketing onboarding modal never double-fires.
      try { localStorage.setItem("fbla_onboarded", "1"); } catch {}
      setStep(0);
      setActive(true);
      if (forced) {
        const url = new URL(window.location.href);
        url.searchParams.delete("tour");
        router.replace(url.pathname + url.search);
      }
    }
  }, [pathname, searchParams, router]);

  const measure = useCallback(() => {
    const sel = STEPS[step]?.selector;
    if (!sel) { setRect(null); return; }
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) { setRect(null); return; }
    el.scrollIntoView({ block: "nearest", behavior: "auto" });
    setRect(el.getBoundingClientRect());
  }, [step]);

  useLayoutEffect(() => {
    if (!active) return;
    measure();
    const on = () => measure();
    window.addEventListener("resize", on);
    window.addEventListener("scroll", on, true);
    return () => {
      window.removeEventListener("resize", on);
      window.removeEventListener("scroll", on, true);
    };
  }, [active, measure]);

  const finish = useCallback(() => {
    try { localStorage.setItem("fbla_tour_done", "1"); } catch {}
    setActive(false);
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight") setStep((s) => Math.min(s + 1, STEPS.length - 1));
      else if (e.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, finish]);

  const cardRef = useRef<HTMLDivElement>(null);
  useFocusTrap(active, cardRef, finish);

  if (!active) return null;

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // Tooltip placement: centered when no target; otherwise to the right of a
  // left-edge target (sidebar), else above/below and clamped to the viewport.
  const TW = 320;
  let tipStyle: React.CSSProperties;
  if (!rect) {
    tipStyle = { top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: TW };
  } else {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const onLeft = rect.left < vw * 0.33;
    const onBottom = rect.top > vh * 0.6;
    if (onLeft && !onBottom) {
      tipStyle = { top: Math.min(rect.top, vh - 220), left: Math.min(rect.right + 16, vw - TW - 16), width: TW };
    } else if (onBottom) {
      tipStyle = { top: Math.max(16, rect.top - 200), left: Math.max(16, Math.min(rect.left - TW + rect.width, vw - TW - 16)), width: TW };
    } else {
      tipStyle = { top: Math.min(rect.bottom + 14, vh - 220), left: Math.max(16, Math.min(rect.left, vw - TW - 16)), width: TW };
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1200 }} role="dialog" aria-modal="true" aria-label="App tour">
      {/* Dim everything; the spotlight box uses a huge ring shadow to cut a hole */}
      {rect ? (
        <div
          style={{
            position: "fixed",
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            borderRadius: 12,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.66), 0 0 0 2px var(--accent), 0 0 24px rgba(var(--accent-rgb),0.5)",
            pointerEvents: "none",
            transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      ) : (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.66)" }} />
      )}

      {/* Tooltip card */}
      <div
        ref={cardRef}
        style={{
          position: "fixed",
          ...tipStyle,
          background: "var(--card-bg)",
          border: "0.5px solid var(--border2)",
          borderRadius: 14,
          boxShadow: "var(--shadow-lg)",
          padding: "18px 18px 16px",
          animation: "fadeUp 0.2s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.18em", color: "var(--accent)", fontWeight: 700, textTransform: "uppercase" }}>
            {step + 1} / {STEPS.length}
          </span>
          <button type="button" onClick={finish} aria-label="Skip tour" style={{ fontSize: 12, color: "var(--text3)", cursor: "pointer" }}>
            Skip
          </button>
        </div>
        <h3 style={{ fontSize: 17, letterSpacing: "-0.01em", marginBottom: 6 }}>{s.title}</h3>
        <p style={{ fontSize: 13.5, color: "var(--text2)", lineHeight: 1.6, marginBottom: 16 }}>{s.body}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => setStep((x) => Math.max(0, x - 1))}
            disabled={step === 0}
            className="btn btn-ghost btn-sm btn-pill"
            style={{ opacity: step === 0 ? 0.4 : 1 }}
          >
            Back
          </button>
          {isLast ? (
            <button type="button" onClick={finish} className="btn btn-accent btn-sm btn-pill cta-shimmer">
              Get started
            </button>
          ) : (
            <button type="button" onClick={() => setStep((x) => Math.min(STEPS.length - 1, x + 1))} className="btn btn-accent btn-sm btn-pill cta-shimmer">
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
