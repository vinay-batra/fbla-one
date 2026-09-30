"use client";

import { useEffect, useState } from "react";
import { PenCheck, PenCross } from "@/components/PenMarks";

/**
 * For advisors: Mock Regionals as it looks on the projector, and the
 * readiness report as a marked-up class roster. Both are labeled examples with
 * made-up names; the layouts mirror the real screens.
 */
const JOINED = ["Maya Chen", "Jordan Brooks", "Sam Patel", "Ava Lopez", "Eli Grant", "Nora Kim"];

const ROSTER: { name: string; event: string; detail: string; status: "ready" | "track" | "attn" }[] = [
  { name: "Maya Chen", event: "Accounting", detail: "12 tests, 86% average", status: "ready" },
  { name: "Ava Lopez", event: "Public Speaking", detail: "Judge score 74", status: "ready" },
  { name: "Jordan Brooks", event: "Marketing", detail: "6 tests, judge score 62", status: "track" },
  { name: "Sam Patel", event: "International Business", detail: "2 tests, 48% average", status: "attn" },
];

const STATUS = { ready: "Ready", track: "On track", attn: "Needs attention" };

export function AdvisorVisual({ active }: { active?: boolean }) {
  // Members "join" the lobby one at a time while the slide is showing.
  const [joined, setJoined] = useState(JOINED.length);
  useEffect(() => {
    if (!active) return;
    if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setJoined(1);
    const id = window.setInterval(() => setJoined((n) => (n >= JOINED.length ? n : n + 1)), 550);
    return () => window.clearInterval(id);
  }, [active]);

  return (
    <div className="adv-grid">
      <figure className="adv-projector" aria-label="Example Mock Regionals lobby">
        <div className="adv-bar">
          <span>Mock Regionals</span>
          <span>Accounting</span>
        </div>
        <p className="adv-go">Join at chapterprep.com/mock/K7QMRT</p>
        <div className="adv-code" aria-label="Join code K7QMRT">
          {"K7QMRT".split("").map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </div>
        <p className="adv-joined">
          <strong>
            {joined} {joined === 1 ? "member" : "members"}
          </strong>{" "}
          {joined === 1 ? "has" : "have"} joined
        </p>
        <ul className="adv-names">
          {JOINED.slice(0, joined).map((n) => (
            <li key={n} className="adv-arrive">
              {n}
            </li>
          ))}
        </ul>
        <figcaption className="ed-fineprint">Example lobby. Names are made up.</figcaption>
      </figure>

      <figure className="adv-roster" aria-label="Example readiness report">
        <div className="adv-bar">
          <span>Readiness report</span>
          <span>4 members</span>
        </div>
        <ul>
          {ROSTER.map((r) => (
            <li key={r.name}>
              <span className="adv-mark" aria-hidden="true">
                {r.status === "ready" ? <PenCheck /> : r.status === "attn" ? <PenCross /> : null}
              </span>
              <div className="adv-who">
                <p className="adv-name">{r.name}</p>
                <p className="adv-detail">
                  {r.event} · {r.detail}
                </p>
              </div>
              <span className={`adv-status adv-${r.status}`}>{STATUS[r.status]}</span>
            </li>
          ))}
        </ul>
        <figcaption className="ed-fineprint">Example chapter. Names are made up.</figcaption>
      </figure>
    </div>
  );
}
