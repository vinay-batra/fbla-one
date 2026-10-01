"use client";

import { useState } from "react";
import Link from "next/link";
import type { ChapterController } from "./useChapterData";

// No chapter yet. Students mostly join, so joining is the big card and
// creating is one line under it (advisors, who signed up as advisors, see
// create first). Signed-out visitors get a nudge to make an account.

export function ChapterSetup({ c }: { c: ChapterController }) {
  // The other option (create for students, join for advisors) opens on request.
  const [showOther, setShowOther] = useState(false);

  if (c.isSupabaseConfigured && !c.signedIn && !c.supaLoading) {
    return (
      <section className="db-sheet">
        <div className="db-sheet-head"><span className="db-sheet-kicker">Chapters</span></div>
        <div className="db-sheet-body">
          <h2 className="db-cover-title">Chapters need <em>a free account.</em></h2>
          <p className="db-cover-note" style={{ maxWidth: "54ch" }}>
            Join your chapter to get assignments, shared deadlines, a leaderboard and Mock Regionals. Advisors create the chapter and invite everyone with one link.
          </p>
          <div className="db-actions">
            <Link href="/auth?mode=signup&next=/app/chapter" className="db-begin">Create free account</Link>
            <Link href="/auth?next=/app/chapter" className="db-ghost">I have an account</Link>
          </div>
        </div>
      </section>
    );
  }

  if (!(c.isSupabaseConfigured && c.signedIn && !c.supaLoading && !c.hasChapter)) return null;

  const join = (
    <section className="db-sheet" aria-labelledby="ch-join-title">
      <div className="db-sheet-head"><span className="db-sheet-kicker">Join</span></div>
      <form className="db-sheet-body ch-form" onSubmit={c.handleJoinChapter}>
        <h2 id="ch-join-title" className="db-cover-title">Join <em>your chapter.</em></h2>
        <p className="db-cover-note">
          Your advisor has an invite code. If they shared a link or QR code, opening it joins you with no code at all.
        </p>
        <label htmlFor="join-invite-code" className="db-field-label">Invite code</label>
        <div className="ch-row">
          <input
            id="join-invite-code"
            type="text"
            value={c.joinCode}
            onChange={(e) => c.setJoinCode(e.target.value.toUpperCase())}
            placeholder="A4K9P2X7"
            className="input-field ch-code"
            autoComplete="off"
            spellCheck={false}
            required
          />
          <button type="submit" className="db-begin" disabled={c.joinLoading}>
            {c.joinLoading ? "Joining" : "Join chapter"}
          </button>
        </div>
        {c.joinError && <p className="ch-error" role="alert">{c.joinError}</p>}
      </form>
    </section>
  );

  const create = (
    <section className="db-sheet" aria-labelledby="ch-create-title">
      <div className="db-sheet-head"><span className="db-sheet-kicker">For advisors</span></div>
      <form className="db-sheet-body ch-form" onSubmit={c.handleCreateChapter}>
        <h2 id="ch-create-title" className="db-cover-title">Create <em>your chapter.</em></h2>
        <p className="db-cover-note">
          You become its advisor and get an invite link and a QR code to share.
        </p>
        <label htmlFor="create-chapter-name" className="db-field-label">Chapter name</label>
        <div className="ch-row">
          <input
            id="create-chapter-name"
            type="text"
            value={c.createName}
            onChange={(e) => c.setCreateName(e.target.value)}
            placeholder="e.g. Lincoln High FBLA"
            className="input-field"
            maxLength={80}
            required
          />
          <button type="submit" className="db-begin" disabled={c.createLoading}>
            {c.createLoading ? "Creating" : "Create chapter"}
          </button>
        </div>
        {c.createError && <p className="ch-error" role="alert">{c.createError}</p>}
      </form>
    </section>
  );

  const advisorFirst = c.isAdvisor || c.wantsAdvisor;
  const [first, second] = advisorFirst ? [create, join] : [join, create];
  return (
    <>
      {first}
      {showOther ? (
        second
      ) : (
        <p className="db-aside">
          {advisorFirst ? "Joining someone else's chapter instead? " : "Are you an advisor? "}
          <button type="button" className="db-linkbtn ch-switch" onClick={() => setShowOther(true)}>
            {advisorFirst ? "Enter an invite code" : "Create your chapter"}
          </button>
        </p>
      )}
    </>
  );
}
