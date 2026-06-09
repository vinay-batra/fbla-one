@AGENTS.md

# CLAUDE.md - FBLA One

All-in-one platform for FBLA chapters: competition guides, study resources, prep tracker, deadline calendar, and chapter management. Pilot at Council Rock High School South (Vinay is Competition Chair), built generic so any chapter can use it.

---

## Deadline

**Aug 25, 2026** - present at FBLA officer meeting.

---

## Current focus

**LIVE at [fbla.one](https://fbla.one). Last shipped: v1.6 (June 8, 2026) - growth + single-event UX + advisor/member split.** **Migrations: 0001-0016 in repo** (0001-0015 applied + verified live; **0016 is a `create or replace` RPC - apply it in the SQL editor if not already, idempotent**). Read this v1.6 block first; the v1.5/v1.4/v1.3 blocks below are still accurate history.
- **Email-capture landing CTA (new `components/EmailCta.tsx`, migration 0015).** The bottom "Get your chapter on FBLA One" final CTA swapped its single button for a Corvo-style capture: an auth-aware primary button (signed out -> "Get started free" `/auth?mode=signup`; signed in -> "Go to dashboard") paired with an email input that writes to the new **`email_signups`** table via the anon client. Table is **write-only from the browser** (anon+authenticated INSERT only, NO select grant; read it with the service role / SQL editor), email is `unique` + lower-cased client-side, and a duplicate insert (`23505`) is caught and shown as success. Client-side email regex validation before any network call. The **hero "Get started" is unchanged.** Verified live end-to-end (fresh insert, duplicate, invalid) after the user applied 0015.
- **Public nav auth split (`components/PublicNav.tsx`).** Signed out now shows TWO buttons: **"Log in"** (`/auth`, ghost) + **"Sign up"** (`/auth?mode=signup`, accent). Signed in shows **"Go to dashboard"** + the existing `UserMenu` (avatar/initials + name + dropdown). The secondary action (Log in / Go to dashboard) carries `.nav-hide-mobile` and drops into the burger drawer on <=768px so the top bar never crowds.
- **Single-event model, finished (no more "My event" tab).** Removed the `My event` sidebar item from `AppShell` NAV and turned `app/app/competitions/page.tsx` into a `redirect("/app")` stub (kept the route so old links/bookmarks don't 404). The dashboard's old "Active competitions / Your queue" card is now a **"Your event"** card (`.tour-event`): single registered event with LOGS + AVG + Prep + Change, or a "Pick your event" empty state. Derived in `app/app/page.tsx` as `myEvent = registeredCompetitions[0]` (registration already REPLACES, so there is only ever one). `UserMenu` "My competitions" item became **"AI Practice"** (`/app/coach`). The `AppTour` "Pick your event" step retargeted from `[data-tour="competitions"]` to `.tour-event`.
- **Settings chapter auto-sync (`app/app/settings/page.tsx`).** The Chapter field now fills from the chapter you actually created/joined (`profiles.chapter_id` -> `getChapterById().name`), persists it via `setChapterName`, and is **disabled while you are in a chapter** with a hint linking to `/app/chapter`. Solo users (no chapter) keep the free-text field.
- **Advisor is NOT a member (migration 0016 + `lib/chapter.ts`).** Advisors were showing up under assignment completion ("Vinay 0/3"), the leaderboard, and the roster. Added `.neq("role", "advisor")` to the three profile queries (`getChapterMembers`, `getChapterStats`, `getChapterAssignmentBoard`) so the advisor-view leaderboard/stats, assignment board, and roster are members-only. **0016** recreates `get_chapter_leaderboard()` with `coalesce(p.role,'member') <> 'advisor'` so the student-visible leaderboard also drops the advisor.
- **Fixed invite-by-email (and the mailto pattern).** The Chapter "Email invite" button used `window.open("mailto:...", "_blank")`, which just spawns a blank tab the OS mail client cannot take over. Now `window.location.href = "mailto:..."` so the mail client opens a draft. (The FAQ + error-page `mailto:` links were already plain `<a href>` and were fine.)
- **DONE this session - #47 chapter-page split.** The former ~1220-line `app/app/chapter/page.tsx` is now a 59-line orchestrator over a new `components/chapter/` module: `useChapterData.ts` (controller hook - all state, the Supabase load/auto-join effect, every handler, derived flags), `chapterHelpers.tsx` (formatDate / memberName / CSV exports / roleBadgeStyle / table styles / `MiniStat` / `ALL_COMP_OPTIONS` / `SORTED_COMPETITIONS`), and presentational `ChapterSetup`, `ChapterInfo`, `MemberView`, `AdvisorView`, `ChapterDeadlines`, `MyEvents`. **Pure structure, zero behavior change** - JSX transcribed verbatim, logic lifted unchanged into the hook. Verified: `tsc --noEmit` clean, lint clean, `next build` clean (80 routes), and **live-regressed end to end** (signed-up an advisor -> created a chapter -> full advisor view; signed-up a student -> joined by code -> member view with advisor-only sections correctly hidden; 0 console errors; test users + chapter deleted from prod afterward). Known pre-existing quirk preserved exactly: a manual join does not refresh the deadline chapter-context until reload (`handleJoinChapter` never called `setChapterContext`).
- **STILL OPEN (deliberately deferred, NOT done):** **#20** - cross-instance rate limiting (needs an Upstash/Vercel KV account). Resend email + VAPID push remain scaffolded/blocked on external accounts. `email_signups` has no admin UI yet (read it via SQL editor). A full multi-domain audit was run this session - see the local (gitignored) `AUDIT-2026-06-08.md`: 0 Critical, 0 High, 19 Medium, 35 Low, 5 Informational. Top items to fix next: open-redirect-via-backslash in `/api/preview` + `/auth` (`SEC-RED-01`), `Math.random` invite codes (`SEC-CRYPTO-01`), the registration-sync UNION that breaks single-event across devices (`BUG-SYNC-01`), gameable assignment completion (`DOM-RULE-02`), iOS input-zoom from 14px inputs (`UX-MOB-01`), the privacy/COPPA/erasure compliance cluster, and missing `maxDuration`/health-endpoint/`profiles(chapter_id)` index.

**Prior release: v1.5 (June 4, 2026) - audit hardening pass** (no new features; correctness/trust/a11y/security/perf). New since v1.4 (the v1.4/v1.3 blocks below are still accurate history):
- **Migrations 0012-0014 (applied + verified):** `0012` feedback length caps (message<=4000, type<=40, page<=300, + textarea maxLength); `0013` forces profile INSERT role to `member` - closes admin/advisor self-escalation since the privilege guard was UPDATE-only (verified `_profile_role_test.mjs` 5/5); `0014` `join_chapter_by_code` returns the full chapter row so the client skips a fetch (client tolerates BOTH the old uuid + new row shape; verified 18/18 via `_rls_test.mjs`). `0009` (feedback user_id guard) was also applied this session.
- **New shared modules:** `lib/format.ts` (relativeTime, daysUntil, scoreColor, toCsv, downloadCsv - de-duplicated from dashboard/chapter/study-plan; relativeTime unified to the richer "min/w ago + date" variant) and `components/useFocusTrap.ts` (focus first control + trap Tab + Escape + restore focus; used by the Delete-account / Remove-event modals + AppTour). New theme tokens `--medal-gold/silver/bronze` (AA-legible light variants).
- **Practice-test answer de-biasing:** the prompt requires all four options equal-length with an even A/B/C/D spread, AND the coach Fisher-Yates shuffles each question's options remapping `correct` by original letter (`shuffleQuestionOptions` in `app/app/coach/page.tsx`) - verified 0 mis-scores + uniform. Model stays `claude-haiku-4-5` (no latency hit; CLAUDE.md/README corrected from the stale "sonnet").
- **Counts corrected everywhere:** AI-practice-eligible events = **34** (not 45) = objective-test + objective-and-presentation + team-test (see `ELIGIBLE` in coach); tests are "**up to 50**" (not 100; API clamps to 50).
- **Resource links:** deleted the fragile `officialGuidelinesUrl()` connect.fbla.org PDF builder (FBLA renames files each cycle -> "Missing file ID"); all official-guideline links now point at `FBLA_EVENT_PAGE` (the stable hub).
- **a11y:** global prefers-reduced-motion rule + ScrollReveal matchMedia guard; AA contrast (eyebrow/`.text-accent` use `--accent-text`; dark `--text3` lightened to `#828ca8`); `role="alert"`/`aria-live` banners; `aria-pressed` coach answers; associated form labels (tracker `Field` wraps its input); off-screen mobile sidebar + collapsed FAQ leave the tab/SR tree; avatar upload is a real button.
- **STILL OPEN (deliberately deferred, NOT done):** **#47** - split the 1259-line `app/app/chapter/page.tsx` into setup/advisor/member/deadlines (pure structure, zero functional change; do it in a focused session with live regression of the auth-gated advisor + member views). **#20** - cross-instance rate limiting (needs an Upstash/Vercel KV account). Resend email + VAPID push remain scaffolded/blocked on external accounts.

**Prior release: v1.4 (June 4, 2026) - the chapter + learning platform.** See the **v1.4 block** just below for everything new (assignments, leaderboard, weak-topic drills, study plan, tour, single-event, roles). The v1.3 blocks (auth-flow + logo + FAB gotchas) are still current - read them too. (Migration status is in the v1.6 block above - 0001-0015 applied + verified, 0016 idempotent RPC.)

**v1.4 - chapter + learning platform (NEW since v1.3):**
- **Single event, not many.** `registerCompetition()` in `lib/storage.ts` now REPLACES (you compete in one event). "My competitions" -> "My event" in the sidebar (`AppShell` NAV), the page (`app/app/competitions/page.tsx`), and the coach picker. Remove uses a styled in-app modal, not `confirm()`.
- **Spotlight guided tour** (`components/AppTour.tsx`, mounted in `AppShell` under `<Suspense>`): dims the app, highlights each nav item via `data-tour="<slug>"` attrs (box-shadow ring cutout), step card with Back/Next/Skip/Esc/arrows. Triggers on first `/app` visit (localStorage `fbla_tour_done`) or `?tour=1` (Settings -> Replay tour). The marketing `OnboardingModal` is now gated OFF `/app` and `/auth` so it never double-fires.
- **Role at signup.** `/auth` signup has a Student/Advisor picker. It stashes `localStorage.fbla_pending_role`; `ensureProfile()` (storage.ts) applies it to `profiles.role` exactly once on the first insert (ignoreDuplicates). Advisors (or anyone with a pending join) route to `/app/chapter` after signup; students to `/app`.
- **Shareable chapter invite.** Advisor Chapter page has an invite-link card (Copy/Share + QR via api.qrserver.com). New public route `app/join/[code]/page.tsx` stashes `localStorage.fbla_pending_join` and routes to `/app/chapter` (signed in) or `/auth?mode=signup` (new). The chapter page auto-joins from the stashed code (the `loadChapterData` effect calls `joinChapter`). No code to type.
- **Chapter assignments (migration 0010).** `assignments` table (chapter_id, title, event_slug, target_count, due_at) + RLS mirroring the deadlines pattern (members of the chapter read; only the advisor writes) via the 0006 SECURITY DEFINER helpers (`current_chapter_id`, `is_chapter_advisor`). `lib/chapter.ts`: `createAssignment` / `getChapterAssignments` / `deleteAssignment` / `getChapterAssignmentBoard` (computes each member's completion from their `practice_logs`). Advisor Chapter page = create + completion grid; member Chapter page = "Your assignments" with own progress + "Practice now".
- **Student chapter leaderboard (migration 0011).** `get_chapter_leaderboard()` SECURITY DEFINER RPC returns ONLY aggregates (display_name, tests, last7) for the caller's own chapter, ranked by practice VOLUME (effort, not scores - no peer score leak). `lib/chapter.ts` `getMyChapterLeaderboard()`. Member Chapter page = leaderboard card (medal top 3, "You" highlight); dashboard = compact `ChapterRankChip`.
- **Weak-topic drills.** `/api/practice-test` now tags every question with a `topic` (from the event's topic list) and accepts a `focusTopic` to pin every question to one topic. The coach records per-topic correct/total on submit (`recordTopicResults`), shows a "Your weak spots" panel (`getWeakTopics`), and each topic has a "Drill" button (`generate(topic)`). Stored in localStorage `fbla_topic_stats`.
- **Road to Nationals study plan** (`components/StudyPlan.tsx`, on dashboard): Regionals -> States -> Nationals milestones (editable dates, localStorage `fbla_milestones`), live countdown to the next stage, completed stages checked, and a weekly practice-pace target that ramps inside 14 days. Nationals = the goal.
- **Day streak** on the dashboard (consecutive practice days from logs) replaced the now-single "Registered" stat. **Retry-your-misses** on the coach review screen re-quizzes only wrong answers in-session.
- **Expanded Settings**: Account (email + role), Preferences (deadline-reminder toggle -> gates `DeadlineAlert`; default practice length -> pre-selects in coach; Replay tour), delete-account now a styled modal.
- **New localStorage keys**: `fbla_topic_stats`, `fbla_milestones`, `fbla_deadline_alerts`, `fbla_default_test_len`, `fbla_tour_done`, `fbla_pending_role`, `fbla_pending_join`, `fbla_logged_in`.
- **Verification scripts** (gitignored `_*.mjs`): `_assignments_test.mjs` (9/9), `_leaderboard_test.mjs` (8/8), `_feedback_test.mjs` (5/5), `_rls_test.mjs` (18/18). Re-run after any RLS/migration change (per the verify-live rule).
- **Still TODO (need Vinay's external accounts):** email nudges via Resend (`lib/email.ts` scaffolded, needs `RESEND_API_KEY` + verified domain), push via VAPID. Code is ready to wire when keys exist.

**v1.3 auth flow (sign-in -> dashboard):** The whole product gates behind auth - public marketing pages funnel to `/auth`, sign in, then `/app` is the study area (dashboard, AI practice, tracker, resources, chapter). `/app/layout.tsx` redirects to `/auth` when there's no session (unless the `fbla_preview` cookie is set). Landing hero + final CTA are now "Get started" (`/auth?mode=signup`) + "Go to dashboard" (`/app`) - the old preview-mode practice/competitions buttons are gone. **CRITICAL GOTCHA (cost a "sign in does nothing" bug):** `proxy.ts` must set `httpOnly: FALSE` on the Supabase cookies. `@supabase/ssr`'s browser client restores the session by reading the auth cookie from `document.cookie`; `httpOnly:true` makes it unreadable, so after sign-in the client sees no session and bounces back to `/auth`. Identical bug + fix as Corvo. Kept `sameSite:lax` + `secure`. Auth page does a full `window.location.href` reload (not `router.push`) on login/signup so the server sees the fresh cookie. Email confirmation is disabled, so `signUp` returns a live session and goes straight to `/app`. Verified live via Playwright (login -> /app, session persists across reload).

**v1.3 nav + pages:** About page DELETED (route, nav, footer, sitemap refs all removed). Nav is now Features / Competitions / Changelog / FAQ - "Features" points to `/` (the landing page IS the features page) so users can navigate home from anywhere. New `/changelog` (`app/(marketing)/changelog/page.tsx`): 6 equal-size chapter cards (fixed `height: 540px`, 6 bullets each) in a horizontal scroll-snap timeline (`.cl-rail` / `.cl-card`), Corvo/Lark pattern in FBLA navy/gold, server component using ScrollReveal + the marketing layout's nav/footer. No email-subscribe section (no backend); ends in a CTA card to `/auth`.

**v1.3 logo (NEW mark):** The brand mark is a blue gradient arrow/"1"/book (rising out of an open book). Master lives at `public/logo-mark.png` (transparent, used by `components/Logo.tsx` nav + Footer watermark + both FABs). All derived assets are regenerated from one source via a PIL script: `favicon-16x16/32x32.png` + `favicon.ico` (white bg so the blue reads on any chrome), `apple-touch-icon.png` + `icon-192/512.png` (white bg, padded for PWA maskable safe-zone), and `og-image.png` (1200x630 light card: logo + "FBLA One" navy/gold wordmark + tagline). To swap the logo again: replace `public/logo-mark.png` with a new transparent PNG, rerun `python3 scripts/regenerate-logo-assets.py` (regenerates every size), do NOT hand-edit individual files. The old navy/gold shield mark is gone. **TWO favicon gotchas (both cost time):** (1) the browser tab + bookmark favicon is served from the Next.js App Router file convention `app/favicon.ico`, which SHADOWS `public/favicon.ico` - the script writes `app/favicon.ico` (there is no `public/favicon.ico`). (2) `app/favicon.ico` must be saved as **RGBA**, not RGB - Turbopack's .ico decoder fails the build with "The PNG is not in RGBA format!" otherwise.

**v1.3 floating FABs are on EVERY page (incl. /app):** Both render from `GlobalShell` in the ROOT layout. The AI chat bubble (60px, gold gradient both themes, shows the FBLA One logo on a white disc) sits at right 24; the feedback flag (44px, stroked waving-flag icon) always pairs to its left at right 96. PublicAIChat no longer hides on /app. Mobile: chat 56px/right 20, flag 40px/right 84 (globals.css).

**v1.3 floating buttons (Corvo/Lark pattern, FBLA gold):** bottom-right has two FABs. (1) `PublicAIChat` (60px gold-gradient bubble, chat-bubble glyph, right 24) opens a Lark-style panel - "ASK FBLA ONE" eyebrow + "X / 5 today" counter + suggestion chips + paper-plane send. Backed by `/api/ai-chat` (Claude `claude-haiku-4-5-20251001`, in-memory 5 msgs/IP/day cap, signed-in users unlimited via `getSupabaseServer`). Client mirror counter in localStorage `fbla_pub_chat_usage`. Hidden on `/app`. Mounted via `PublicAIChatLoader` (dynamic ssr:false) in `GlobalShell`. (2) `FeedbackButton` restyled to a 44px report-bug FLAG glyph, sits left of the bubble at right 96 on public pages, right 24 on `/app` (where the bubble is hidden). Mobile sizes via `.fbla-ai-chat-btn` / `.fbla-feedback-btn` rules in globals.css. Hero (`app/(marketing)/page.tsx`) redesigned: layered orb+dotted-grid bg, gold->brand-blue gradient headline, animated product-preview card (mock Accounting I question with correct-answer highlight + WHY strip), 2 CTAs (dropped the 3rd "Preview the platform" button for a cleaner row).

**RESOLVED (verified live):** migrations `0006_fix_rls_recursion.sql` + `0007_invite_validated_join.sql` are applied to prod and verified 18/18 via `node _rls_test.mjs`. 0006 fixed an infinite-recursion bug in the chapter/advisor RLS (a chapters <-> profiles loop from 0004) that had been breaking chapter creation + the advisor dashboard; 0007 closed the chapter-join holes (world-readable invite codes; self-join any chapter without an invite). Both found by the live test, not the static audit.

**Status: fully deployed; migrations 0006 + 0007 applied and verified live (18/18). Advisor leaderboard + chapter-shared deadlines working end-to-end.**
- GitHub: `github.com/vinay-batra/fbla-one` (push to `main` -> Vercel auto-deploys)
- Vercel: project `fbla-one`, custom domain `fbla.one` + `www.fbla.one` (SSL active)
- Supabase: project `osxoygndwazbygiqyjhu`. Migrations **0001-0016 in repo** (see the v1.6 / v1.5 blocks above for the authoritative per-migration status: 0001-0015 applied + verified live, 0016 is an idempotent create-or-replace RPC). Historical verification detail: 0006+0007 verified 18/18 via `_rls_test.mjs`; 0008 verified 5/5 via `_feedback_test.mjs` (anon insert, auth insert, read isolation). NOTE: `service_role` has no table grants here (0003 granted only `authenticated`) - admin scripts must use the auth API or a signed-in client.
- Anthropic: `ANTHROPIC_API_KEY` set locally (.env.local) and on Vercel. Powers `/api/practice-test` (claude-haiku-4-5).
- Google OAuth: live (consent screen branded "FBLA One")
- All 3 env vars set locally (`.env.local`) and on Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**What's built and verified working:**
- Full marketing site: `/`, `/about`, `/faq`, `/privacy`, `/terms`. **Always free** - no pricing page. About + FAQ fully rewritten for advisor audience.
- 55-event competition registry (`lib/competitions.ts`). **55 complete, 0 partial, 0 coming-soon.** All events have longDescription + topics + studyResources.
- **AI Practice Test Engine** (`/app/coach` + `/api/practice-test`): Claude claude-haiku-4-5 streams NDJSON questions calibrated to each event's topic outline. 4-phase UI: idle, generating (live progress), taking (keyboard shortcuts), reviewing (explanations + score logging). 34 eligible objective-test events.
- **Demo mode**: `/api/preview` sets `fbla_preview=1` cookie, bypasses auth gate in AppLayout. Preview banner in AppShell. Landing page "Try AI Practice Tests" + "Preview the platform" buttons both route through this.
- **Saved resources**: `StudyResourcesList` client component on competition pages with bookmark save/unsave. `/app/resources` page with competition filter and remove.
- **Score trends chart**: pure SVG bar chart on dashboard showing last 8 scored logs per competition. Color-coded green/amber/red. Uses shared `components/Sparkbars.tsx`.
- **Advisor leaderboard + chapter stats** (`/app/chapter`, advisor view): `getChapterStats()` ranks members by practice volume then avg score, plus chapter totals, active-this-week, chapter average, top event, and an 8-week trend.
- **Chapter-shared deadlines**: in a chapter the deadline calendar is shared (advisor writes to `public.deadlines`, members read-only); solo/preview users keep personal localStorage deadlines. `lib/storage.ts` mirrors chapter deadlines via `setChapterContext()` + `syncChapterDeadlines()`; `canManageDeadlines()` gates the UI.
- **Onboarding modal**: first-visit welcome with 3 guided steps. localStorage flag `fbla_onboarded`. role=dialog + Escape + Tab focus-trap.
- **Deadline alerts**: in-app strip for deadlines within 3 days. Per-alert dismiss in `fbla_dismissed_deadline_alerts`.
- **Feedback button** (`components/FeedbackButton.tsx`): 52px FAB bottom-right. Opens a centered modal with Bug / Feedback / Feature request selector + message, inserts to `public.feedback` via the anon client. role=dialog + Escape + focus-trap. **Needs migration 0008 applied.**
- **Logo** (`components/Logo.tsx`): `public/logo-mark.png` (the real navy+gold shield mark) + FBLA/One wordmark. Adapts size via SIZES map.
- `/competitions` (filterable grid) + `/competitions/[slug]` (SSG detail, 55 pages). All 55 events have longDescription + topics + studyResources.
- `/auth` - Google OAuth + email/password + magic link. **GitHub OAuth removed.** PKCE flow via `/auth/callback`.
- `/app/*` - **auth-gated** (redirects to `/auth` when signed out). Dashboard, my competitions, tracker, chapter, settings (with avatar upload + delete account).
- **Chapter page** (`/app/chapter`): advisor leaderboard + 8-week stats, deadline calendar (Supabase-backed in a chapter, localStorage for solo), registered events chip grid.
- **Data sync (verified via live integration test):** registrations / practice logs / saved resources persist to Supabase when signed in, sync across devices, migrate preview-mode data up on first sign-in. Driven by `components/DataSync.tsx` + `lib/storage.ts`.
- Profile auto-created **app-side** on sign-in (`ensureProfile` in storage.ts) - NOT via DB trigger (see gotchas).
- UserMenu dropdown (avatar/initials, Escape-to-close), auth-reactive nav.
- SEO: per-page metadata, `sitemap.ts` (61 URLs), `robots.ts`, OG image (`public/og-image.png`, brand fonts), WebSite JSON-LD.
- PWA: `manifest.ts` (installable), theme-color, apple-web-app meta.
- Branded `not-found.tsx`, `error.tsx`, `global-error.tsx`.
- Corvo-grade theme system (light + dark), logo wired into nav + footer watermark + favicons.
- Build clean (79 routes), lint clean. No em dashes in source. No CommandPalette (removed).

### Next up
1. Branded auth emails: Resend account + verify `fbla.one` + point Supabase Auth -> SMTP. `lib/email.ts` scaffolded, no-ops without `RESEND_API_KEY`.
2. Push notification reminders for deadlines (service worker + VAPID).
3. Export competition sign-ups in FBLA's exact regional registration format.

### How to verify the DB path after schema changes
There's a self-contained integration test pattern (used twice this session to catch a critical grant bug). Write a one-off node script that reads `.env.local`, uses the service role to create a throwaway user, signs in as them with the anon client, inserts/reads under RLS, checks cross-user isolation, then deletes the user. Run with `node --input-type=module`. This catches grant/RLS/trigger bugs that the build won't.

---

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack), TypeScript, React 19
- **Styling**: CSS variables only (no Tailwind). Inter + Space Mono + Space Grotesk via Google Fonts `@import` in globals.css.
- **Auth/DB**: Supabase (`@supabase/ssr` + `@supabase/supabase-js`). Project ref: `osxoygndwazbygiqyjhu`. URL: `https://osxoygndwazbygiqyjhu.supabase.co`.
- **Animation**: framer-motion (UserMenu dropdown); ScrollReveal uses pure IntersectionObserver per Corvo audit.
- **Hosting**: Vercel (live). Domain: `fbla.one` (SSL active). Push to `main` auto-deploys.
- **GitHub**: `github.com/vinay-batra/fbla-one`
- **Local path**: `~/Downloads/fbla-one/`
- **git note**: commits land under `vinaybatra@Vinays-MacBook-Air.local` (git identity not globally configured; harmless). School/proxy network sometimes blocks `git push` with an SSL cert error - retry on a different network.

---

## Critical rules - never break these

- **CSS variables only**, never hardcode hex colors in components. Theme palette lives in `app/globals.css`.
- **Space Mono** for accents, numbers, eyebrows, chips (via `.eyebrow`, `.font-mono`, `.metric-number`).
- **`data-theme="dark"|"light"` on `<html>`** is the source of truth. Never read theme from React state in CSS.
- **localStorage key is `fbla_theme`** - never `corvo_theme` (that's the other project), never `lark_theme`.
- **No emojis in UI**. SVG icons only.
- **No em dashes in source files** (use hyphens or rephrase). Exception: this CLAUDE.md may use them for readability.
- **No `onMouseEnter` / `onMouseLeave` in server components** - use CSS `:hover` via classes like `.resource-link`, `.category-tile`, `.related-link`, `.footer-link`. Client components are fine.
- **`useSearchParams()` must be wrapped in `<Suspense>`** at the page level. See `app/(marketing)/competitions/page.tsx` for the pattern.
- **`generateStaticParams` typed as Promise**. Next.js 16 changed `params` to a Promise - every dynamic page must `await params`.
- **`proxy.ts`, not `middleware.ts`** - Next.js 16 renamed it. Exported function is also `proxy`, not `middleware`.
- **Always commit + push after changes**. Per Vinay's workflow.
- **0.5px borders** are intentional - they read as hairlines and match Corvo's aesthetic. Don't bump to 1px.
- **New public.* tables need explicit GRANTs to `authenticated`** or every insert fails with "permission denied for table" (RLS is never even reached). Raw `CREATE TABLE` in the SQL editor does NOT auto-grant. See `0003_grants_and_trigger_fix.sql`; `alter default privileges` now covers future tables.
- **Don't create triggers on `auth.users`** - the SQL editor runs as `postgres` which doesn't own that table, so `CREATE TRIGGER` silently no-ops. Profile rows are created app-side via `ensureProfile()` in `lib/storage.ts`, called from `DataSync` on sign-in (insert-only upsert, never clobbers edits).
- **Google brand colors** (`#4285f4` etc.) in the OAuth button SVG and the `#fff` checkmark are intentional exceptions to the no-hardcoded-color rule.

---

## Theme system

- CSS variables defined twice in `app/globals.css`: `:root, [data-theme="light"]` and `[data-theme="dark"]`.
- `ThemeProvider` (`components/ThemeProvider.tsx`) wraps the app, exposes `useTheme()` -> `{ theme, toggle, setTheme }`.
- Persists to `localStorage.fbla_theme`.
- SSR-safe inline script in `<head>` of `app/layout.tsx` reads localStorage and sets `data-theme` before paint to prevent FOUC.
- Default: dark.
- `ThemeToggle` is a 36×36 sun/moon icon button.

### Dark vars
`--bg: #060c16` (near-black navy), `--accent: #ffb81c` (FBLA gold), `--brand: #5d9ce4` (lighter blue for contrast), `--text: #f0ecde` (warm cream).

### Light vars
`--bg: #ffffff`, `--accent: #c8881a` (contrast-safe gold), `--brand: #003c7e` (FBLA navy), `--text: #0b1a33` (deep navy text).

---

## File structure

```
fbla-one/
  app/
    layout.tsx                  <- root: ThemeProvider + ConditionalAmbientOrbs + FOUC script
    globals.css                 <- ~600 lines: tokens, animations, buttons, inputs, cards, mobile rules
    favicon.ico
    (marketing)/                <- route group: PublicNav + Footer wrap
      layout.tsx
      page.tsx                  <- / landing (hero, bento, competitions preview, how-it-works, categories, CTA)
      about/page.tsx            <- /about (origin story + 3 principles)
      faq/page.tsx              <- /faq (4 sections accordion)
      privacy/page.tsx          <- /privacy
      terms/page.tsx            <- /terms
      competitions/
        page.tsx                <- /competitions (filterable grid, useSearchParams in Suspense)
        [slug]/page.tsx         <- /competitions/[slug] (SSG, generateStaticParams over registry)
    auth/page.tsx               <- /auth (sign in / sign up / magic link / OAuth, graceful degradation)
    app/                        <- authenticated section (preview mode if no Supabase)
      layout.tsx                <- AppShell wrapper
      page.tsx                  <- /app dashboard
      competitions/page.tsx     <- /app/competitions (registered events table)
      tracker/page.tsx          <- /app/tracker (practice log form + history table)
      chapter/page.tsx          <- /app/chapter (thin orchestrator; logic in components/chapter/)
      settings/page.tsx         <- /app/settings
  components/
    PublicNav.tsx               <- fixed nav, scroll-accumulator hide/show, mobile drawer
    Footer.tsx                  <- 3-col + brand + disclaimer + bottom bar
    AppShell.tsx                <- sidebar + topbar, mobile drawer, auth-aware footer
    ThemeProvider.tsx           <- context + useTheme + localStorage persist
    ThemeToggle.tsx             <- sun/moon icon button
    Logo.tsx                    <- text wordmark "FBLA One" (blue + gold)
    ScrollReveal.tsx            <- IntersectionObserver fade-up (use this, not framer whileInView)
    AmbientOrbs.tsx             <- two fixed-position gradient orbs (dark mode only)
    ConditionalAmbientOrbs.tsx  <- mounts AmbientOrbs everywhere except /app + /auth
    SectionHeader.tsx           <- eyebrow + headline + tagline (with optional accentLastWord)
    HeroBadge.tsx               <- pulsing gold-dot pill
    Card.tsx                    <- shared card primitive + CardHeader
    IconBtn.tsx                 <- icon button with mi-btn micro-interactions
    RegisterButton.tsx          <- client-side competition register toggle (localStorage)
    chapter/                    <- /app/chapter module (#47 split): useChapterData hook +
                                   chapterHelpers + ChapterSetup/ChapterInfo/MemberView/
                                   AdvisorView/ChapterDeadlines/MyEvents
  lib/
    competitions.ts             <- 55-event FBLA registry, types, helpers
    storage.ts                  <- localStorage-first state (registered, practice_logs, saved_resources, profile)
    supabase.ts                 <- browser singleton (graceful degradation)
    supabase-server.ts          <- server component client (cookies, RLS)
  proxy.ts                      <- Next 16 middleware: Supabase session refresh + hardened cookies
  supabase/
    migrations/
      0001_init.sql             <- profiles, chapters, registrations, practice_logs, saved_resources, deadlines
  public/
    logo.png                    <- AI-generated brand mark (white BG, replace with transparent)
    favicon.ico
  .env.example                  <- env var template
  next.config.ts                <- security headers
  eslint.config.mjs             <- Next 16 base + 3 disabled rules (no-unescaped-entities, set-state-in-effect, purity)
```

---

## Component patterns

### Eyebrow
`<p className="eyebrow">SOME LABEL</p>` - Space Mono 10px, 0.22em letter-spacing, accent color, uppercase, 700.

### Pulsing badge
`<HeroBadge>For FBLA Chapters</HeroBadge>` - gold-dot pill, used above marketing section headlines and hero copy.

### Section header
`<SectionHeader eyebrow="What's inside" title="Three things, done right." tagline="No fluff." accentLastWord />` - drop-in for marketing sections. ScrollReveal-wrapped.

### Scroll reveal
`<ScrollReveal delay={0.1}>...</ScrollReveal>` - IntersectionObserver-based fade-up. Threshold 0.12, rootMargin -8% bottom. Use everywhere on marketing pages.

### Card
`<Card variant="hover">...</Card>` - variants: default | hover | elevated | accent | glass. Use `CardHeader` for the standard eyebrow + title + tagline + right-slot pattern.

### Buttons
- `.btn .btn-accent` - gold pill with glow shadow (primary CTA)
- `.btn .btn-brand` - navy pill (alternative primary)
- `.btn .btn-ghost` - transparent + border, hover accent
- `.btn .btn-outline` - gold border, hover full fill
- `.btn .btn-danger` - red-tinted
- Modifiers: `.btn-lg`, `.btn-sm`, `.btn-pill`, `.btn-loading`
- Add `.cta-shimmer` to any primary button for the gold sweep hover

---

## Auth pattern (Supabase)

`lib/supabase.ts` (browser):
- `getSupabase()` returns `SupabaseClient | null` based on env vars.
- `isSupabaseConfigured` boolean for graceful degradation.

`lib/supabase-server.ts` (server components / route handlers):
- `await getSupabaseServer()` returns the client (also null when env missing).
- Cookie setter hardens with httpOnly + sameSite=lax + secure in prod.

`proxy.ts` (every request):
- Calls `supabase.auth.getUser()` to refresh JWT. Wrapped in try/catch so Supabase outage doesn't 500 the site. No-op when env unset.

To enable Supabase:
1. Create project at supabase.com.
2. Copy Project URL + anon key.
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```
4. Run `supabase/migrations/0001_init.sql` in the SQL editor.
5. Optional: enable Google + GitHub OAuth in Authentication → Providers.
6. Restart dev server.

---

## Local data model (preview mode)

`lib/storage.ts` exposes a tiny API over `localStorage`:

- `getRegistered()` / `registerCompetition(slug)` / `unregisterCompetition(slug)` / `toggleRegistration(slug)` / `isRegistered(slug)`
- `getPracticeLogs()` / `addPracticeLog(log)` / `removePracticeLog(id)` / `getPracticeLogsForCompetition(slug)`
- `getSavedResources()` / `addSavedResource(r)` / `removeSavedResource(id)`
- `getDisplayName()` / `setDisplayName(name)` / `getChapterName()` / `setChapterName(name)`
- `onStorageChange(cb)` subscribes to all of the above (custom event + cross-tab via `storage` event).

Keys: `fbla_registered_competitions`, `fbla_practice_logs`, `fbla_saved_resources`, `fbla_display_name`, `fbla_chapter_name`, `fbla_theme`.

Schema maps 1:1 to Supabase tables in `0001_init.sql`. When Supabase is wired in, downstream code can mirror writes to the DB without changing component code.

---

## Setup (fresh clone)

```bash
cd ~/Downloads/fbla-one
npm install
cp .env.example .env.local       # fill in Supabase keys (optional - works in preview without)
npm run dev
```

Open http://localhost:3000.

---

## Deployment

- **Frontend**: push to `main` → Vercel auto-deploys (once GitHub + Vercel are connected, see README).
- **Env vars on Vercel**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Domain**: `fbla.one` (bought 2026-05-27, DNS not yet pointed at Vercel).
- **Supabase migrations**: paste `supabase/migrations/0001_init.sql` into the Supabase SQL Editor. Idempotent.

---

## What was built

See [`CHANGELOG.md`](./CHANGELOG.md) for the full version history. Summary below.

### v0.3 (May 28, 2026) - Deployment + Supabase + production audit
Went live at fbla.one. GitHub + Vercel + custom domain + Google OAuth wired. Real Supabase data sync (registrations / practice logs / saved resources persist + cross-device), auth-gated `/app`, UserMenu, avatar upload, delete account. Production audit: removed all em dashes, SEO (sitemap/robots/OG/JSON-LD), PWA manifest, branded error/404 pages, a11y. Caught + fixed a critical table-GRANT bug (no signed-in user could save) and 4 broken study-resource links - both via live integration testing. See CHANGELOG for detail.

### v0.2 (May 27, 2026) - Corvo-quality v1 platform

Massive rebuild on top of v0.1. Pulled patterns from Corvo (`~/Downloads/corvo/frontend/`) per an explicit audit: full token system, 0.5px hairline borders, Space Mono everywhere, IntersectionObserver-based ScrollReveal (not framer's `whileInView`), hand-rolled CSS-class hover (not onMouseEnter in server components), inline AppShell pattern.

Shipped in one session:
- **Foundation**: globals.css rewritten from scratch (~600 lines) - full token system with light + dark themes, Inter + Space Mono + Space Grotesk via @import, button + input + card libraries, animation keyframes, mobile responsive rules, hover utility classes for server components, ambient orb support.
- **Layout**: `app/layout.tsx` simplified (no next/font, FOUC script preserved, ConditionalAmbientOrbs mounted). Metadata set for fbla.one with OpenGraph + Twitter cards.
- **Components**: ScrollReveal (IO-based with delay + threshold + y-distance props), AmbientOrbs (dark-mode-only fixed gradients), ConditionalAmbientOrbs (hides on /app + /auth), SectionHeader (eyebrow + accentLastWord title + tagline), HeroBadge (pulsing gold dot), Card + CardHeader (variants), IconBtn (mi-btn micro-interaction), RegisterButton (localStorage-backed comp toggle), updated Logo (Space Grotesk wordmark), rewritten PublicNav (scroll-accumulator hide/show + mobile drawer + active state), rewritten Footer (3-col + disclaimer + bottom bar with version + domain), AppShell (sidebar + topbar + auth state + mobile drawer).
- **Competition registry**: `lib/competitions.ts` with 55 FBLA events. Full content (long description, test topics, study resources) for ~25 objective-test events. Coming-soon stubs for ~25 prompt-based events. Helpers: `getCompetition`, `getCompetitionsByCategory`, `getPopularCompetitions`, `getAvailableCompetitions`, `COMPETITION_STATS`.
- **Marketing site**: `(marketing)` route group with shared PublicNav + Footer.
  - `/` - hero with floating accent orbs + stats row + bento feature grid + popular competitions + how-it-works + categories grid + final CTA card.
  - `/about` - origin story + 3 principles cards.
  - `/faq` - 4-section accordion with smooth height transitions.
  - `/privacy`, `/terms` - content-only stubs with hero badge + section helper.
- **Competitions pages**:
  - `/competitions` - `useSearchParams` wrapped in `<Suspense>`, filterable by search + category + content depth, popular-first sort, sticky filter bar with count, empty state with reset.
  - `/competitions/[slug]` - `generateStaticParams` over all 55, `generateMetadata` per event, 2-col layout with main content + sticky sidebar (at-a-glance + related events), hero with chips + breadcrumb + headline + tagline + actions, content cards (about + topics chips + study resources with kind chips + external-link affordance), coming-soon notice for stubs, RegisterButton.
- **Auth**: `/auth` - minimal top bar (logo + back + theme toggle), card with hero badge + headline + 3-mode tabs (sign in / sign up / magic link) + Google + GitHub OAuth buttons + email/password form + inline error/info + terms link. Preview-mode banner when Supabase not configured.
- **App shell**: `AppShell.tsx` rendered by `app/app/layout.tsx`. Sidebar: logo + 5 nav links (Dashboard / My competitions / Practice tracker / Chapter / Settings) with active state (gold tint + left rail) + auth status + sign in/out button. Topbar: theme toggle + Browse Competitions link. Mobile: drawer.
  - `/app` - greeting (time-of-day + display name), 4 stat cards (Registered / Logs this week / Total practice / Saved resources), active competitions grid (per-comp log count + last log time), Last 5 logs sidebar card, Suggested actions checklist (4 setup steps with checkmark/strikethrough states).
  - `/app/competitions` - table-style list of registered events with category + format + log count + average score + Prep + Remove actions.
  - `/app/tracker` - 2-col: log form (competition select + score + out-of + duration + notes) + history table (date + competition + score + % + minutes + delete).
  - `/app/chapter` - chapter name editor + coming-soon-free card with 5 advisor feature bullets.
  - `/app/settings` - display name + chapter + theme picker + auth status + clear-local-data danger button.
- **Storage layer**: `lib/storage.ts` - localStorage-first persistence with custom-event broadcast + cross-tab sync. Maps 1:1 to Supabase tables so DB-backed implementation can layer on later without component changes.
- **Supabase**: `lib/supabase.ts` updated to use `createBrowserClient` properly. New `lib/supabase-server.ts` for server components with hardened cookies. `proxy.ts` (Next 16's renamed middleware) for SSR session refresh, with try/catch around getUser and explicit cookie hardening.
- **DB schema**: `supabase/migrations/0001_init.sql` - profiles (extends auth.users with role enum), chapters (with invite_code), registrations (unique per user+comp), practice_logs (with indexes), saved_resources, deadlines (chapter-scoped). All RLS policies idempotent via DO blocks. Advisor read-through on member registrations + chapter deadline management.
- **Build hygiene**: `next.config.ts` has security headers. `eslint.config.mjs` disables 3 noisy React 19 rules (no-unescaped-entities, set-state-in-effect, purity) that misfire on legitimate codebase patterns. `.gitignore` allows `.env*.example`. Build passes (71 routes, all 55 detail pages SSG). Lint passes clean.

### v0.1 (May 27, 2026) - Scaffold + landing
Initial `create-next-app` scaffold. First FBLA blue + gold theme attempt. Text-wordmark Logo. Stub Supabase. Basic landing page with 3 feature cards.
