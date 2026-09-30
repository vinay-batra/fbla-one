@AGENTS.md

# CLAUDE.md - ChapterPrep (repo still named fbla-one)

All-in-one platform for FBLA chapters: competition guides, study resources, prep tracker, deadline calendar, and chapter management. Pilot at Council Rock High School South (Vinay is Competition Chair), built generic so any chapter can use it.

---

## Deadline

The Aug 25, 2026 officer-meeting demo has passed. No fixed deadline now; the goal is real chapter use this season.

---

## Current focus

**LIVE at [chapterprep.com](https://chapterprep.com). Last shipped: v1.11.0 (Sept 30, 2026). Migrations: 0001-0020, ALL applied + verified live.** Read the v1.11.0 block first: it is the current feature inventory and design system, and it supersedes the reference sections' older descriptions wherever they conflict. Then v1.10.0, v1.9.0, v1.8.0; the v1.7.0/v1.6.2/v1.5/v1.4/v1.3 blocks below are accurate history from when the product was called FBLA One at fbla.one. **Do not rewrite that history.** The old name shipped and the record of it stays intact.

> **v1.11.0 - site-wide redesign + practice that teaches (Sept 29-30, 2026), DONE + deployed + verified live.**
> - **Design system is now site-wide "paper and ink"** (it was landing-only in v1.10). Tokens in `app/globals.css`: paper `--bg #f5f1e8` / ink `#13110e`; `--accent` IS ink (`#17181c` / `#f0e9da`), `--brand` is deep red pen (`#9e2a1b` / `#ff9b8c`), `--pen` (lighter red for drawn lines), `--pen-text` (red labels). **No blue or teal anywhere.** `--green`/`--red` stay semantic (correct/incorrect). Fraunces (`--font-serif`) loads in the root layout and sets every h1-h3; `.font-mono` is now Inter with tabular figures (80 call sites); real Space Mono survives only on the exam sheet. Logo = solid red ribbon bookmark with a paper check (`#b8362a` / `#fbf8f1`, fixed, not themed), wordmark in Fraunces ink with italic "Prep". `components/PenUnderline.tsx` measures each rendered line (`getClientRects`) and draws one flat stroke per line, so underlined phrases can wrap. Glow orbs, shimmer, pulsing badges, and the `/changelog` page are gone (`/changelog` 308s to `/`). Every page: 0 AA contrast failures in both themes (automated DOM sweep).
> - **Competition data verified against FBLA's official guideline PDFs.** Formats now include `test-then-role-play` (100-question test, top 15 do a role play: International Business, Marketing, Entrepreneurship, etc.), `test-and-presentation`, `production`, `chapter-event`. All 45 judged events' rating-sheet chips and timings checked item by item (38 confirmed, 7 fixed). New `judgedOn?: string[]` on `Competition` holds a presentation rating sheet when `topics` holds test areas (Future Business Leader, Business Ethics). Tests are 50 minutes, not 60. `hasObjectiveTest()` drives AI-test eligibility (45 events). Guideline PDF text extracts lived in the session scratchpad; the PDFs are in FBLA's public bucket `greektrack-fbla-public` under `High School Competitive Events Resources/Individual Guidelines/`.
> - **AI practice test** (`app/app/coach/page.tsx`, pipeline in `components/coach/engine.ts`, shared with Mock Regionals): exam-paper UI (scantron grid, page turns, red-pen graded review, report card by topic). **Every question is checked by a second model** (`/api/verify-questions`, claude-sonnet-5: blind solve + key audit; kept only if the blind answer matches and nothing is flagged; ~25% rejection on Business Law) and dropped questions are topped up so the chosen count is exact. **Mistake bank** (`lib/mistakes.ts`, localStorage `fbla_mistake_bank`, synced to `public.mistake_bank` by migration 0020 when signed in; `_mistakes_test.mjs` 16/16; synced entries missing from the account were cleared elsewhere and are dropped, never-synced ones upload; sign-out clears it): misses return until right in two different tests; up to 30% of a test; instant "Mistakes" review. **Full simulation**: 100 questions, 50:00 countdown, auto turn-in. `lib/text.ts` `tidyDashes` strips dash punctuation from AI text.
> - **AI Judge** (`/app/judge`, `/api/judge`, `components/judge/`): role play cards with official prep/performance clocks, or presentation/interview scripts scored against the rating sheet, typed or spoken (Web Speech API). claude-sonnet-5, strict JSON validated server side; the total is computed from criteria. Rounds save as practice logs (`JUDGE_LOG_PREFIX` "AI Judge:") and are never averaged with test percentages (`isScoredTest` in `lib/chapter.ts` also excludes "Mistake review").
> - **Mock Regionals** (`/app/mock`, `lib/mock.ts`, `components/mock/`, migration 0018): advisor hosts a live chapter test with a projector lobby (join code + QR via public `/mock/CODE`), server clock, podium, hardest question. Answer key never readable by students during the test (column grants + SECURITY DEFINER RPCs), graded server side. `_mock_test.mjs` 47/47.
> - **Advisor readiness report** (`components/chapter/ReadinessReport.tsx`, migration 0019 `practice_logs.topic_results` jsonb with a validating check constraint): per member event, volume, average, trend, judge score, weakest topics, Ready / On track / Needs attention (`READINESS_RULE` in `lib/chapter.ts`), CSV export. `_readiness_test.mjs` 36/36.
> - **Event finder quiz** (`/find-your-event`, `components/eventfinder/`): 7 questions, deterministic weighted scoring (`scoring.ts` weight tables), grade-gates Introduction events.
> - **Landing** (`app/(landing)/page.tsx`, sections in `components/landing/`), kept short on purpose: hero + 5-question sample test -> ledger ("always free") -> **"Why not just ask a chatbot?"** (`WhyDifferent` header naming ChatGPT, Claude and Gemini + `WhyCarousel`: six horizontal, scroll-snapping slides with jump tabs, arrows, "n of 6", swipe; each slide = short claim + "A chatbot:" line + a live visual: `CheckedSheet`, `EventTypes` tabs, `JudgeVisual` (a REAL International Business card + rating sheet, trimmed; one card sentence with a wrong currency effect deliberately omitted), `MistakeStack`, `SimVisual` (50:00 clock that ticks while its slide shows), `AdvisorVisual` (labeled examples, made-up names)) -> `EventIndex` with T/R/P tags -> close. Vinay did not want a long page: new material goes into a slide, not a new section. Carousel gotchas: the active slide gets `.is-active` (replays pen marks); slides clip overflow so a neighbor's easing never peeks in; on WIDTH change the current slide is re-aligned (browsers otherwise re-snap to slide 1); the tab row scrolls the active tab into view. Every claim must be true of the named chatbots out of the box. `ScrollReveal` watches with a 100000px top rootMargin so content a fast fling skips still reveals.
> - **Phones:** the AppShell sidebar had an inline `position: sticky` that always beat its mobile `position: fixed` rule, so every /app page rendered in a ~127px column on phones since v1. Positioning now lives in the stylesheet. A 375px audit of every page fixed 17 sub-44px tap targets and 63 sub-11px labels.
> - **Verification habits that paid off this release:** run the automated contrast sweep after any palette change; audit phones by measuring (overflow, tap targets, input font size), not by eye; spot-check AI answer keys by hand; live RLS scripts after every migration.
> - **Process lesson:** while background agents are editing, commit with explicit paths, never `git add -A` (it once shipped half-written agent files; reverted within a minute).
> - **Copy rules:** "advisor", never "adviser". No em dashes, no emojis, no " - " used as a dash, in UI, prompts, SQL and comments.

> **v1.10.0 - bookmark logo + editorial landing (Sept 29, 2026), DONE + deployed + verified live.** Built for Vinay's FBLA officer-meeting demo; the old landing read as a default dark-SaaS template.
> - **Logo:** a bookmark with a check (marks a chapter, reads as "prepped"). The old mark was a "1" for FBLA *One*, a name that no longer exists. **Source of truth is `scripts/logo-mark.svg`**; `components/BrandMark.tsx` renders the same geometry as inline SVG (gradient id via `useId()`). To change the logo: edit the SVG, keep BrandMark in sync, rasterize `public/logo-mark.png` (512x512, transparent; headless Chrome with `--default-background-color=00000000` works), then `python3 scripts/regenerate-logo-assets.py` for favicons/PWA/OG. `public/logo.png` is deleted, do not recreate it.
> - *(Superseded by v1.11.0: the paper/ink tokens and Fraunces are site-wide now; `(landing)/editorial.css` holds only landing layout.)* **Landing lives in its own route group `app/(landing)/`** so it can wear the editorial identity nav-to-footer without restyling the rest of the marketing site (`app/(marketing)/` keeps the blue/teal system). URL is still `/`. `.ed` (set in `(landing)/layout.tsx`) **re-declares the shared tokens** in `(landing)/editorial.css`, so PublicNav/Footer/ChapterShowcase/EmailCta restyle themselves. Paper palette in light, warm "ink" palette in dark. Fraunces is loaded only by the landing layout (`--font-serif`).
> - **Sections:** hero + live `components/landing/ExamSheet.tsx` (answerable, graded in red pen; 4 questions, every answer hand-checked and the arithmetic computed; distractors are real student mistakes. **If you edit a question, re-verify the answer.**) -> ledger sentence -> table-of-contents "How it works" -> `ChapterShowcase` -> `components/landing/EventIndex.tsx` (all 76 as a book index, dot = `isAiTestable`) -> "Regionals don't wait." close.
> - **Hero uses CSS `.ed-rise` keyframes, NOT ScrollReveal.** ScrollReveal server-renders at `opacity:0` and reveals only after hydration, which left the h1 (the LCP element) invisible until JS ran (confirmed in prod HTML). Never wrap above-the-fold content in ScrollReveal.
> - **Never statically import `@/lib/supabase` in a marketing component.** Use `components/useSignedIn.ts` (cache seed + dynamic import). HeroCta and EmailCta had each re-added the ~65KB auth SDK to the landing that way.
> - **Onboarding modal auto-opens only for signed-in users.** It used to open 700ms after landing for every first-time visitor, covering the hero on any fresh browser (i.e. every demo laptop).
> - Contrast: every paper/ink token checked on every surface; automated DOM sweep = 0 failures in both themes. Paper needed its own `--medal-silver` (#5f6470); light `--green` is now #11703f site-wide.

> ### RESOLVED (Sept 30, 2026): Supabase captcha appears to be off. Password sign-in works again (verified from scripts and from the site on localhost against production). Kept below as history.
> ### (history) ONE MANUAL STEP REQUIRED, or sign-in stays broken
> **Cloudflare Turnstile has been removed from the codebase entirely** (widget, hook, CSP entries, env var) because its hostname allowlist still pointed at `fbla.one` and it was hard-blocking all authentication.
> **Supabase Auth still has captcha protection enabled server-side against the old Turnstile secret.** Until that is turned OFF in the Supabase dashboard (Authentication -> Attack Protection -> disable captcha), sign-in and sign-up will keep failing, now with a "captcha verification process failed" style error from GoTrue instead of the client-side widget error. Removing the client without disabling the server check does not fix anything on its own.
> The site therefore currently has **no bot protection on signup**. That is a deliberate, reversible trade against auth being 100% broken. If it gets abused, re-add Turnstile (or hCaptcha) and register `chapterprep.com` as an allowed hostname this time.
> Also: `hello@` and `privacy@chapterprep.com` have **no MX records** and bounce. They never worked on `fbla.one` either. The privacy policy promises a GDPR/CCPA channel and a COPPA deletion path there, so until MX exists those pages also point at the in-app feedback form, which does work.

> **v1.9.0 - quality pass (Sept 25, 2026), DONE + deployed + verified live.** Three parallel audits (accessibility, performance, content/SEO) then fixes, each verified in the browser rather than assumed.
> - **Perf, measured live: 590.6KB -> 250KB transfer, FCP 1332ms -> 712ms.** Fonts moved to `next/font` and are self-hosted (the `@import` was invisible to the preload scanner: a serialized ~270ms chain; Google Fonts also dropped from the CSP). `PublicAIChat` shipped the 512x512 215KB mark into a 34px slot via a raw `<img>`; `next/image` serves ~1KB WebP. Supabase auth SDK now dynamically imported in `DataSync` + `PublicNav` (it was in the shared chunk of all 85 routes). **framer-motion removed entirely** (131KB for one dropdown fade, replaced by a CSS keyframe). `images.minimumCacheTTL` + explicit asset cache headers.
> - **Contrast, all WCAG-computed:** dark `.btn-brand` was white on `#60a5fa` at **2.54:1**, the primary CTA on all 76 detail pages. Light `--accent` darkened `#0d9488 -> #0e6f64`, which clears AA both as text on white (6.04:1) and as a button bg with white text, fixing ~40 call sites that used `--accent` directly instead of `--accent-text`. Also light `--warning` and `--medal-gold`. **An automated DOM sweep of every rendered text node reports 0 failures on landing / competitions / FAQ / auth in both themes** - rerun it after any palette change.
> - **A11y:** skip link + `GlobalShell` moved after `{children}` (the FABs were the first two tab stops site-wide); `/auth` had zero landmarks; focus rings restored (`outline: none` in `.input-field` beat `:focus-visible`, and two inline ones beat the stylesheet); `aria-current` on all nav sets; drawer focus trap; chat `role="log"`; competition card headings H3 -> H2.
> - **SEO:** FAQPage JSON-LD + BreadcrumbList/LearningResource on the 76 detail pages; robots matched by PREFIX so a bare `/app` was blocking `/apple-touch-icon.png`; `/join/[code]` noindexed; canonicals on `/privacy` + `/terms`; homepage `openGraph`.
> - **Facts:** the FAQ claimed all 76 events had complete content (62 do) and 34 AI-eligible (41). Both now derive from `COMPETITION_STATS`, as does the hero. New `isAiTestable()` in `lib/competitions.ts` is the single source shared with the coach's `ELIGIBLE`. **Hardcoded counts are the recurring bug on this project - always derive.**
> - **Visual:** hero preview has a pointer-reactive 3D tilt (`components/TiltCard.tsx`, CSS perspective not WebGL - a 3D lib is ~600KB and would undo the entire perf win); card hover accent ring; fine grain over dark mode only.
> - **ScrollReveal trap, worth knowing:** an IntersectionObserver percentage threshold is measured against the **element**, not the viewport, so anything taller than the viewport can never reach `threshold: 0.12`. Collapsing the competitions grid to one reveal made the wrapper 6839px in a 768px viewport (max ratio 0.112) and would have left the whole grid permanently invisible. `ScrollReveal` now drops to threshold 0 for elements taller than the viewport.

> **v1.8.0 - ChapterPrep rebrand (Sept 25, 2026), DONE + deployed + verified live.** The product moved off the FBLA name and the `fbla.one` domain to its own identity, by agreement with FBLA's national office, ahead of an Oct 1 2026 date. `fbla.one` is being transferred to FBLA. (This repo is public - the correspondence and the details behind the change are deliberately not written up here.)
> - **Name:** `FBLA One` -> **ChapterPrep** across metadata, manifest, marketing copy, auth, tour, onboarding, AI chat prompt, footer and the `Logo` wordmark. The first rename pass was case sensitive and missed the uppercase `FBLA ONE` eyebrow on the auth card plus the admin CSV filename - **always grep case-insensitively (`grep -rni "fbla[ _-]*one"`) when checking for leftovers.**
> - **Domain:** `fbla.one` -> **chapterprep.com** in `metadataBase`, sitemap, robots, JSON-LD, invite links, `safeNextPath` base and support addresses. Apex is canonical now (www 308s to it), which matches every URL the code emits. `fbla.one` is off the Vercel project and is being transferred to FBLA.
> - **Palette:** dropped FBLA's navy + gold. `--brand` is now blue `#1d4ed8` / `#60a5fa` taken from the logo mark, `--accent` is teal `#0d9488` / `#2dd4bf`. Dark `--text` moved from warm cream `#f0ecde` to cool `#e9eef7` since the cream existed to pair with gold. All WCAG-checked: light brand 6.70:1, light `--accent-text` 5.47:1, dark accent 10.52:1, dark text on the accent button 10.36:1. Medal gold/silver/bronze and `--warning` amber are **semantic, not brand**, and deliberately stayed.
> - **Kept deliberately:** the `fbla_*` localStorage keys (renaming them would wipe every existing user's registrations, practice logs and saved resources), all *descriptive* references to FBLA competitive events, and the not-affiliated disclaimer in the footer.
> - **Turnstile fallout (resolved in v1.9.1 by removing it):** the widget's hostname allowlist still only contained `fbla.one`, so it threw `Error 110200` on chapterprep.com and blocked all auth. See the box at the top for the one manual Supabase step still required. Also `hello@` and `privacy@chapterprep.com` have no MX records so they bounce - and they never worked on fbla.one either, which matters because the privacy policy promises a data-deletion channel there.

> **Unreleased (July 21, 2026) - competitive events registry refresh.** Vinay flagged International Business missing; audit against FBLA's official 2025-26 HS Competitive Events List (76 events) found the registry had drifted to 54 with several renamed/discontinued events. `lib/competitions.ts` is now 76/76 exact: added International Business + 25 other missing events (12 objective-test with full topics/resources, 14 non-objective-test as `coming-soon` stubs); renamed 6 stale entries to current names keeping slugs stable (Accounting I->Accounting, Accounting II->Advanced Accounting, Cyber Security->Cybersecurity, Intro to Business->Introduction to Business Concepts, Business Financial Plan->Financial Planning, Publication Design->Visual Design); removed 5 discontinued events (Financial Math, Intro to Financial Math, Business Calculations, Word Processing, Political Science). `COMPETITION_STATS.total` and the coach's `ELIGIBLE` filter both derive from `COMPETITIONS.length`/format, so counts and AI-practice-test eligibility for the new objective-test events updated with zero other file changes. Verified tsc/lint/build clean (76 SSG detail pages) + live-checked in browser (competitions grid 76/76, International Business stub page, Data Science & AI full page), 0 console errors. See CHANGELOG "Unreleased" for the full list. Not yet committed/pushed.

> **v1.7.0 - hardening + AI-test correctness + live captcha (June 11, 2026), DONE + deployed + verified live.** Large session. (1) **Turnstile bot protection is LIVE on /auth** - Cloudflare widget created, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` set on Vercel, Supabase Auth -> Attack Protection captcha enabled with the Turnstile secret. Verified on www.fbla.one/auth (site key baked into the deployed bundle, CSP enforced in prod). **Fixed a real `useTurnstile` bug:** the widget effect ran during the `sessionChecked` loader before the form was in the DOM, so it bailed and never mounted - now takes `sessionChecked` as a `ready` flag + effect dep. (2) **CSP is now ENFORCED** (`next.config.ts` flipped from `-Report-Only`); `'unsafe-eval'` is added in DEVELOPMENT ONLY (React Refresh needs it; prod stays strict). Validated the prod header + that the only external subresources (Google Fonts, Supabase, Anthropic, Turnstile, QR host) are allowlisted. (3) **AI practice tests - numeric answers are now GUARANTEED correct.** Root cause: Haiku cannot do reliable multi-step arithmetic (botched an annuity factor 5.2917 vs 4.7665, an overtime split $828 vs $774, a bond keyed at $500 that prices at $920). Two layers: **`lib/calc.ts`** is a real recursive-descent expression evaluator (precedence, parentheses, `^` exponent incl. negative/fractional - NOT eval, which treats `^` as XOR; unit-proven on the annuity = $9,533.08); the generator runs a **tool-use loop** (`messages.stream` + `finalMessage`, model `claude-haiku-4-5-20251001`, `tools:[CALCULATOR_TOOL]`) where the model calls a `calculator` tool and we return the exact result. PLUS **answer verification in the coach** (`verifyNumericAnswer`): each computed-number question carries a `calc` expression; the client evaluates it and RE-KEYS to the option matching the exact value (fixes a mis-keyed answer) or DROPS the question if the right answer isn't even present. A student can no longer be shown a wrong numeric answer. **Explanations are now letter-free** (the option shuffle had made "A is correct"-style explanations point at the wrong choice - the real "marked wrong when I picked right" complaint). (4) **In-test stopwatch** in the coach (starts when the test finishes generating, ticks each second to submit, resets on retry/exit; real elapsed time saved to the practice log `durationMin`). (5) **Owner admin view** `app/app/admin/page.tsx` + `app/api/admin/signups/route.ts` - service-role read of `email_signups`, gated by `NEXT_PUBLIC_ADMIN_EMAIL` == session email (set on Vercel, LIVE; link shows in UserMenu only for the owner). (6) **Regional registration CSV** in AdvisorView (`exportRegionalCSV` in `chapterHelpers` - event-grouped, sorted by event then last name, Last/First split). (7) **Rate limiting now matches Corvo/Lark** - `lib/rate-limit.ts` is a simple in-memory sliding window + `getClientIP` (rightmost Vercel-verified XFF hop); Upstash dropped per Vinay. ai-chat + practice-test call it synchronously. **#20 resolved by decision** (per-instance, like the sibling apps). (8) **CI fix** - the nightly db-backup workflow produced a startup-failure red X on EVERY push because it referenced `secrets.SUPABASE_DB_URL` inside step `if:` (the `secrets` context is NOT allowed in `if:` -> invalid workflow). Rewritten to read the secret into job-level `env` + gate on a `steps.guard.outputs.configured` output; modernized the deprecated apt-key step. Now runs nightly only, green no-op until the secret is added. (9) **Version anti-drift:** new `lib/version.ts` (`APP_VERSION`) is the single source; the Footer reads it (was hardcoded `v1.3`); public `/changelog` got a v1.4-v1.6.2 era card (was 3 releases stale). Plus a polish pass: a11y label associations on chapter forms, mobile 16px-on-all-inputs via a `!important` media rule (kills iOS focus-zoom even on inline-styled inputs), `.catch` on the `getUser`/`getSession` promise chains (a rejected auth call could hang the page), theme-token cleanups. **STILL OPEN:** `SUPABASE_DB_URL` GitHub Actions secret not yet added (backup is a green no-op until then; **if Supabase is on Postgres 17, bump `postgresql-client-16` -> 17** in the workflow). 50-question AI tests may approach the 60s function limit now that the calculator adds tool round-trips (cap/split if it ever cuts off mid-stream). Resend branded emails + VAPID push still deferred (Vinay: "no emails/push yet"). New env: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_ADMIN_EMAIL` (both on Vercel + `.env.local`). New files: `lib/version.ts`, `lib/rate-limit.ts`, `lib/calc.ts`, `app/api/admin/signups/route.ts`, `app/app/admin/page.tsx`.

> **v1.6.2 - audit remediation (June 8, 2026), DONE + deployed + DB-applied + verified live.** Fixed every finding from the v1.6 audit (0 Crit, 0 High, 19 Med, 35 Low, 5 Info). tsc/lint/build clean, `npm audit` 0 vulns, full live regression (advisor + member chapter flows, auth, tracker, email CTA, coach) with no console errors. Migrations 0016 + 0017 applied to prod + verified. See CHANGELOG v1.6.2 for the per-finding list. **Two rollout hotfixes (already fixed in the repo + prod):** (1) **0017's `create_chapter` used `gen_random_bytes` -> broke chapter creation** with `42883 function gen_random_bytes(integer) does not exist`: pgcrypto lives in Supabase's `extensions` schema, OFF a `SECURITY DEFINER ... set search_path = public` function. Now uses `gen_random_uuid()` (core/pg_catalog). RULE: never call pgcrypto fns (gen_random_bytes/crypt/digest) from a search_path=public DEFINER function. (2) **`/api/health` falsely reported `supabaseReachable:false`** because a healthy Supabase returns 401 to an unkeyed probe and the check only accepted ok/400/404; now probes `/auth/v1/health` WITH the apikey header and uses `r.ok` (GoTrue /health needs the apikey or it 401s). **Still optional / blocked on external accounts:** add a `SUPABASE_DB_URL` GitHub secret to enable the nightly backup workflow (`.github/workflows/db-backup.yml`); set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + enable Supabase captcha; flip the `next.config.ts` CSP from **report-only** to enforce after validating the live console; cross-instance rate limiting still needs Vercel KV/Upstash (#20, the in-code limiter now fails closed but is per-instance). New shared modules: `lib/url.ts` (safeNextPath, kills the backslash open-redirect across preview/auth/callback), `lib/leaderboard-cache.ts` (60s single-flight), `lib/chapter.ts` `AI_LOG_PREFIX` (assignment completion counts AI tests only). Local audit report kept gitignored: `AUDIT-2026-06-08.md` (and `AUDIT-*.md` in .gitignore).
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

**What's built and verified working (v1.3-era inventory, kept as history; the v1.11.0 block above is current):**
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
1. Get real students using it (3 or 4 chapter members on their own phones) and fix what confuses them.
2. Emails and reminders (on hold per Vinay): needs a Resend account + DNS for chapterprep.com. `lib/email.ts` is scaffolded and no-ops without `RESEND_API_KEY`.
3. `hello@` / `privacy@chapterprep.com` still have no MX records.

### How to verify the DB path after schema changes
There's a self-contained integration test pattern (used twice this session to catch a critical grant bug). Write a one-off node script that reads `.env.local`, uses the service role to create a throwaway user, signs in as them with the anon client, inserts/reads under RLS, checks cross-user isolation, then deletes the user. Run with `node --input-type=module`. This catches grant/RLS/trigger bugs that the build won't.

---

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack), TypeScript, React 19. Read `node_modules/next/dist/docs` before assuming an API (see AGENTS.md).
- **Styling**: CSS variables only (no Tailwind). Fonts via `next/font` in `app/layout.tsx` (self-hosted): Inter (body), Fraunces (`--font-serif`, all headings), Space Mono (exam sheet only), Space Grotesk (loaded, barely used).
- **Auth/DB**: Supabase (`@supabase/ssr` + `@supabase/supabase-js`). Project ref `osxoygndwazbygiqyjhu`. Migrations 0001-0020 in `supabase/migrations/`, all applied to prod.
- **AI**: Anthropic SDK. claude-haiku-4-5 generates practice questions (calculator tool loop) and runs the public chat; claude-sonnet-5 verifies every question and powers the AI Judge.
- **Animation**: CSS only (framer-motion was removed in v1.9). ScrollReveal is IntersectionObserver-based and never hides above-the-fold content.
- **Hosting**: Vercel, apex `chapterprep.com` (www 308s to it). Push to `main` auto-deploys.
- **GitHub**: `github.com/vinay-batra/fbla-one` (public repo: keep legal detail out of it).
- **Local path**: `~/Downloads/fbla-one/`. For a production-like local preview: `npm run build` then `npm run start -- -p 3100` (the preview tool's `fbla-one-prod` config). The dev server's `.next/dev` cache can exceed 450MB; disk on this Mac runs low, so prefer the prod build.

---

## Critical rules - never break these

- **CSS variables only**, never hardcode hex colors in components (exceptions: the fixed logo colors in `BrandMark`, Google's brand colors in the OAuth button, and the white QR plate). Palette lives in `app/globals.css`.
- **The theme is paper and ink with one chromatic color, the red pen.** Do not reintroduce blue, teal or glow effects. `--accent` is ink; red (`--brand`, `--pen-text`) is for labels, emphasis and grading marks; `--green`/`--red` only mean correct/incorrect.
- **Headings are Fraunces** (automatic for h1-h3). Emphasis inside a headline is italic, not a second color. Small labels above headlines use `.eyebrow` (red, sentence case, a short rule).
- **After any palette change, rerun the automated contrast sweep** on every page in both themes. Target: 0 AA failures.
- **Phones are a first-class target:** no horizontal scroll at 375px, tap targets at least 44px, text at least 11px, inputs at least 16px (a global mobile rule enforces this). Measure, do not eyeball.
- **Never inline `position` on elements that a media query must change** (the AppShell sidebar bug).
- **`data-theme="dark"|"light"` on `<html>`** is the source of truth. localStorage key is `fbla_theme`.
- **No emojis, no em dashes, no " - " used as a dash**: UI text, AI prompts, SQL, comments, commits. AI output passes through `tidyDashes`. Spell it **"advisor"**.
- **Derive every count** from `COMPETITION_STATS` / the registry. Hardcoded counts are this project's recurring bug.
- **Any fact about an FBLA event must come from FBLA's official guidelines.** If a detail cannot be confirmed, leave it out.
- **No `onMouseEnter` / `onMouseLeave` in server components** - use CSS `:hover` classes.
- **`useSearchParams()` inside `<Suspense>`**; dynamic `params` are Promises in Next 16; the middleware file is `proxy.ts`.
- **Never statically import `@/lib/supabase` in a marketing component** (use `components/useSignedIn.ts`).
- **New public.* tables need explicit GRANTs to `authenticated`**; never call pgcrypto from a `search_path = public` SECURITY DEFINER function; verify every migration with a live RLS script (`_*_test.mjs`, gitignored). `service_role` has no table grants here, so scripts act as signed-in users.
- **Profiles**: a signup trigger may already create the row, so `ensureProfile`'s insert-if-missing can be a no-op; set fields with an update.
- **Always commit + push after changes** (Vinay's workflow), with explicit paths when anything else is editing the tree.

---

## Theme system

- Tokens defined twice in `app/globals.css`: `:root, [data-theme="light"]` (paper) and `[data-theme="dark"]` (ink). Landing-only layout lives in `app/(landing)/editorial.css`.
- `ThemeProvider` / `useTheme()`; SSR-safe inline script in `app/layout.tsx` sets `data-theme` before paint.
- Paper: `--bg #f5f1e8`, `--card-bg #fbf8f1`, `--text #17181c`, `--accent #17181c`, `--brand #9e2a1b`, `--pen #dc5f50`. Ink: `--bg #13110e`, `--card-bg #1c1a15`, `--text #f0e9da`, `--accent #f0e9da`, `--brand #ff9b8c`, `--pen #f07f70`.
- Paper texture: `--paper-tooth` (inline SVG noise) on `<body>`.

---

## Where things live

```
app/
  layout.tsx                 root: fonts, ThemeProvider, GlobalShell (chat + feedback FABs)
  globals.css                tokens, buttons, chips, cards, exam sheet (.sheet/.opt/.bubble/.pen),
                             report card (.report-*), coach (.coach-*), pen underline, motion
  (landing)/                 "/" : page.tsx, editorial.css (landing layout only)
  (marketing)/               competitions/, competitions/[slug]/, find-your-event/, faq, privacy, terms
  auth/                      sign in / sign up / magic link / Google
  mock/[code]/               public QR target for Mock Regionals (survives sign-in)
  app/                       auth-gated (preview cookie bypass): page (dashboard), coach, judge, mock,
                             tracker, chapter, resources, settings, admin
  api/                       practice-test, verify-questions, judge, ai-chat, preview, admin, health
components/
  AppShell, PublicNav, Footer, Logo, BrandMark, PenUnderline, PenMarks, ScrollReveal, HeroCta
  landing/ (ExamSheet, EventIndex)   coach/ (engine, GeneratingView)   judge/   mock/
  chapter/ (useChapterData, AdvisorView, MemberView, ReadinessReport, ...)   eventfinder/
lib/
  competitions.ts            76-event registry (formats, topics, judgedOn, timings), COMPETITION_STATS
  storage.ts                 localStorage-first data layer + Supabase sync (practice logs carry topicResults)
  chapter.ts                 chapter RLS helpers, leaderboard, assignments, readiness, log prefixes
  mistakes.ts  mock.ts  text.ts  calc.ts  format.ts  url.ts  rate-limit.ts  version.ts
scripts/                     logo-mark.svg (logo source) + regenerate-logo-assets.py
supabase/migrations/         0001-0020
```

---

## Component patterns

- **Eyebrow**: `<p className="eyebrow">Practice tests</p>` (red, 13px, sentence case, short rule before it). `HeroBadge` renders the same thing.
- **Headline underline**: `<PenUnderline>already knowing the test.</PenUnderline>`; may wrap.
- **Exam paper**: `.sheet` inside `.sheet-stack` (stack + page turn), `.sheet-head`, `.sheet-q`, `.opt` with `.bubble`; grade with `PenCircle` / `PenCheck` / `PenCross` from `components/PenMarks.tsx`; margin note `.sheet-why.is-open`; score card `.report-big` + `.report-circle`.
- **Buttons**: `.btn .btn-accent` (ink, primary), `.btn .btn-brand` (red pen), `.btn .btn-ghost`, `.btn .btn-outline`, `.btn .btn-danger`; `.btn-sm`, `.btn-lg`, `.btn-pill`.
- **Chips**: `.chip` (sentence-case sans), `.chip-format` (ink, used for event formats), `.chip-brand`.
- **Card**: `<Card variant="hover">` + `CardHeader` (eyebrow + title + tagline).
- **Scroll reveal**: `<ScrollReveal>` only for below-the-fold content; hero entrances use CSS `.rise`.

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

- **Frontend**: push to `main` and Vercel auto-deploys to `chapterprep.com`.
- **Env vars on Vercel and in `.env.local`**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_ADMIN_EMAIL`.
- **Supabase migrations** (0001-0020 applied): Vinay pastes each new file into the Supabase SQL Editor (Claude prints it in chat). All are idempotent. After applying, run that migration's `_*_test.mjs` live check.
- **Version**: bump `lib/version.ts` and add a CHANGELOG entry each release.

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
