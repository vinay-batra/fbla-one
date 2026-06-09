"use client";

import { Card, CardHeader } from "@/components/Card";
import { roleBadgeStyle } from "./chapterHelpers";
import type { ChapterController } from "./useChapterData";

// Chapter identity card: name, invite code (with copy), role badge, and the
// advisor "Email invite" action. Shown to both advisors and members once they
// are in a chapter. Extracted from app/app/chapter/page.tsx (issue #47).

export function ChapterInfo({ c }: { c: ChapterController }) {
  const { chapter, profile, members, isAdvisor } = c;
  if (!c.hasChapter || !chapter) return null;
  return (
    <Card>
      <CardHeader
        eyebrow={isAdvisor ? "Advisor" : "Member"}
        title={chapter.name}
        tagline={isAdvisor ? `${members.length} member${members.length !== 1 ? "s" : ""} in your chapter` : "You are a member of this chapter."}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            background: "var(--bg2)",
            borderRadius: 8,
            border: "0.5px solid var(--border)",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--text3)" }}>Invite code</span>
          <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.12em", color: "var(--text)" }}>
            {chapter.invite_code}
          </span>
          <button
            type="button"
            onClick={c.copyInviteCode}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: c.copiedCode ? "var(--green)" : "var(--text3)",
              padding: "2px 4px",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              transition: "color 0.15s",
            }}
          >
            {c.copiedCode ? "Copied!" : "Copy"}
          </button>
        </div>
        <span
          className="font-mono"
          style={{
            fontSize: 10,
            padding: "4px 10px",
            borderRadius: 999,
            fontWeight: 700,
            ...roleBadgeStyle(profile?.role ?? "member"),
          }}
        >
          {profile?.role ?? "member"}
        </span>
        {isAdvisor && (
          <button
            type="button"
            onClick={() => {
              const subj = encodeURIComponent(`Join ${chapter?.name ?? "our chapter"} on FBLA One`);
              const body = encodeURIComponent(
                `Hi!\n\nJoin our FBLA chapter on FBLA One to track your competition prep, access study guides for all 55 events, and generate AI practice tests.\n\nInvite code: ${chapter?.invite_code}\n\nGo to https://fbla.one/app, click "Chapter" in the sidebar, and enter the code under "Join a chapter."\n\nSee you there!`
              );
              // Navigate the current tab to the mailto: handler. window.open(.., "_blank")
              // just spawns a blank tab the OS mail client can't take over.
              window.location.href = `mailto:?subject=${subj}&body=${body}`;
            }}
            className="btn btn-ghost btn-sm"
            style={{ gap: 6, display: "flex", alignItems: "center" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <path d="M22 6l-10 7L2 6" />
            </svg>
            Email invite
          </button>
        )}
      </div>
    </Card>
  );
}
