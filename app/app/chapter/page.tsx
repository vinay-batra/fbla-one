"use client";

// Chapter page. Thin orchestrator over the components/chapter/* module (issue
// #47 split the former ~1220-line monolith into setup / info / member / advisor
// / deadlines / my-events sub-views + a useChapterData controller hook). All
// state, data loading, and handlers live in useChapterData; this file only
// composes the sections and owns the page chrome.

import { useChapterData } from "@/components/chapter/useChapterData";
import { ChapterSetup } from "@/components/chapter/ChapterSetup";
import { ChapterInfo } from "@/components/chapter/ChapterInfo";
import { MemberView } from "@/components/chapter/MemberView";
import { AdvisorView } from "@/components/chapter/AdvisorView";
import { ChapterDeadlines } from "@/components/chapter/ChapterDeadlines";
import { MyEvents } from "@/components/chapter/MyEvents";

export default function ChapterPage() {
  const c = useChapterData();
  const { chapter, hasChapter, isAdvisor, autoJoinMsg } = c;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1240 }}>

      {/* Page header */}
      <div>
        <p className="eyebrow" style={{ marginBottom: 8 }}>Chapter</p>
        <h1 style={{ fontSize: 28, letterSpacing: "-0.02em" }}>
          {chapter?.name || (hasChapter ? "Your chapter" : "Chapter")}
        </h1>
        <p style={{ fontSize: 14, color: "var(--text3)", marginTop: 6 }}>
          {isAdvisor
            ? "Manage your chapter roster, track deadlines, and see every member's events."
            : "Track your competition deadlines and see your registered events."}
        </p>
      </div>

      {autoJoinMsg && (
        <div role="status" style={{ padding: "12px 16px", borderRadius: 12, fontSize: 13, lineHeight: 1.5, border: "0.5px solid var(--border2)", background: "var(--bg2)", color: autoJoinMsg.kind === "error" ? "var(--red)" : "var(--text2)" }}>
          {autoJoinMsg.text}
        </div>
      )}

      <ChapterSetup c={c} />
      <ChapterInfo c={c} />
      <MemberView c={c} />
      <AdvisorView c={c} />
      <ChapterDeadlines c={c} />
      <MyEvents c={c} />

      <style>{`
        @media (max-width: 720px) {
          .chapter-setup-grid { grid-template-columns: 1fr !important; }
          .chapter-stat-grid { grid-template-columns: 1fr 1fr !important; }
          .dl-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
