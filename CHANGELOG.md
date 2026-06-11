# Changelog

All notable changes to FBLA One. Live at [fbla.one](https://fbla.one).

## v1.7.0 - June 11, 2026 - Hardening, correct AI math, live captcha

A large session: bot protection went live, the CSP is enforced, the AI practice tests are now arithmetically correct, and an owner admin view shipped.

### Security
- **Turnstile captcha is LIVE on `/auth`.** Cloudflare widget + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` on Vercel + Supabase Attack Protection captcha enabled with the Turnstile secret. Fixed a `useTurnstile` mount bug (the widget effect ran behind the session-check loader and never mounted) - it now keys off `sessionChecked`.
- **CSP is now ENFORCED** (`next.config.ts`, flipped from report-only). `'unsafe-eval'` is added in development only so `next dev`'s React Refresh works while production stays strict.
- **Rate limiting** rewritten to the Corvo/Lark in-memory sliding window (`lib/rate-limit.ts`, rightmost-XFF `getClientIP`); Upstash dropped. Resolves #20 by decision (per-instance).

### AI practice tests - numeric answers now guaranteed correct
- **Calculator tool** (`lib/calc.ts`): a real recursive-descent evaluator with correct precedence, parentheses, and `^` exponentiation (not `eval`, which treats `^` as XOR). The generator runs an Anthropic tool-use loop so the model computes via the tool, not mental math.
- **Answer verification** (coach): every computed-number question carries a `calc` expression; the client evaluates it and re-keys to the matching option, or drops the question when the right answer is absent. A student can no longer be shown a wrong numeric answer.
- **Letter-free explanations** - the option shuffle had made "A is correct"-style explanations point at the wrong choice.
- **In-test stopwatch** (starts at generation, ticks to submit, saved to the practice log).

### Admin & advisor
- **Owner-only `/app/admin`** email-signups view (`/api/admin/signups`, service-role read, gated by `NEXT_PUBLIC_ADMIN_EMAIL`).
- **Regional registration CSV** export in the advisor view (event-grouped, Last/First split).

### CI & housekeeping
- **db-backup workflow fixed** - it referenced `secrets.*` inside `if:` (not allowed), causing a startup-failure red X on every push. Rewritten to gate on a step output; modernized the apt-key step. Nightly only; green no-op until `SUPABASE_DB_URL` is set.
- **`lib/version.ts`** is now the single version source (the footer was hardcoded at v1.3); public changelog page caught up to a v1.4-v1.6.2 era card; a11y label associations; mobile 16px-on-all-inputs rule; `.catch` on the auth promise chains.

## v1.6.2 - June 8, 2026 - Audit remediation (all 59 findings)

Fixed every finding from the v1.6 audit (0 Critical, 0 High, 19 Medium, 35 Low, 5 Info). Verified: tsc + lint + build clean, `npm audit` 0 vulnerabilities, and a full live regression (advisor + member chapter flows, auth, tracker, email capture, coach generation) with no console errors.

**ACTION REQUIRED to fully activate the DB-side fixes:** apply `supabase/migrations/0017_audit_remediation.sql` in the Supabase SQL editor (idempotent). The app is written to tolerate it being unapplied, so deploy order doesn't matter.

### Security
- **Open redirect (SEC-RED-01):** new `lib/url.ts` `safeNextPath()` resolves redirects against our origin and rejects backslashes (the WHATWG parser treats `\` as `/`). Wired into `/api/preview`, `/auth`, and `/auth/callback`.
- **Invite codes (SEC-CRYPTO-01):** client fallback now uses `crypto.getRandomValues` (8-char base32); migration 0017 widens the server `create_chapter` code to 8 hex chars.
- **Rate limiting (SEC-RL-01/02):** AI-chat limiter now fails closed on an unidentifiable IP (no shared "unknown" bucket) and rejects >64KB bodies. (True cross-instance limiting still needs KV - #20.)
- **CSP (SEC-HDR-01/SEC-SESS-01):** added a Content-Security-Policy in **report-only** mode (enforcing needs nonce wiring for Next's inline scripts).
- **delete-account (SEC-AUTHZ-03, LOG-DELACCT-01, SRE-5C-01):** Origin/Host fallback when Sec-Fetch-Site is absent; prod logs a non-PII message; retries once.
- **Role guard (SEC-AUTHZ-01), feedback throttle (SEC-AUTHZ-04), email-list oracle (SEC-AUTHZ-02):** migration 0017 (officer/admin no longer self-assignable; per-window feedback insert cap; email signup moved behind an insert-or-ignore RPC, client falls back to a direct insert pre-migration).

### Compliance (minors' data)
- Privacy policy now discloses feedback, the email list, IP logging, and Anthropic as a sub-processor; COPPA wording corrected to "not directed to under-13" (COMP-NOTICE-01, COMP-COPPA-01). FAQ deletion claim softened (UX-COPY-01). Account deletion best-effort purges the marketing email + writes an audit row (COMP-ERASURE-01, AUDIT-LOG-01; needs 0017 grant + table).

### Correctness
- **Single-event sync (BUG-SYNC-01):** sign-in no longer UNIONs registrations (which resurrected deleted events); the server pick wins. Log/resource re-sync uses idempotent upsert (SRE-5B-02/03/04, DOM-IDEM-03/04).
- **Assignment completion (DOM-RULE-02):** counts only AI-generated tests (shared `AI_LOG_PREFIX`), not hand-typed tracker rows.
- **Weak-topic stats (DOM-CALC-01, BUG-MEM-04):** recorded once per test (never on retry), topic keys canonicalized; dismissed-deadline set pruned.
- Advisor excluded from the activity feed (BUG-CHAP-03); createChapter rolls back on a failed profile link (SRE-5B-01); coach cancel resets state (UX-FLOW-01).

### Performance & reliability
- Migration 0017 adds indexes on `profiles(chapter_id)` and `saved_resources(user_id)` (PERF-4B-01/02); assignment board pre-buckets logs (PERF-4A-01); leaderboard RPC shared via a 60s cache (PERF-4C-01); explicit column selects (PERF-4B-03).
- Streaming practice-test route sets `maxDuration` (SRE-5A-01); new `/api/health` endpoint (SRE-5D-01); DR runbook + nightly backup workflow (SRE-5F-01, needs a `SUPABASE_DB_URL` secret).

### UX & a11y
- 16px inputs to stop iOS zoom (UX-MOB-01); 44px mobile touch targets (UX-MOB-02); `/auth` is a real `<form>` with visible labels (UX-FORM-01); tracker save confirmation (UX-FORM-02); EmailCta accessible busy state (UX-STATE-01); QR lazy-loaded (PERF-4D-01); "Exit preview" actually clears the cookie (FLAG-PREVIEW-01).

### Dependencies
- Bumped next 16.2.7 / react 19.2.7 / supabase-js 2.108 / anthropic-sdk 0.102, plus a `postcss` override to clear the transitive CVE (SC-CVE-01, SC-STALE-01). Added `NOTICE.md` for transitive LGPL/MPL/CC-BY attribution (SC-LIC-01).

### Rollout fixes (caught in live verification)
- Migration 0017's `create_chapter` used `gen_random_bytes` (pgcrypto, which Supabase keeps in the `extensions` schema, off a `search_path = public` SECURITY DEFINER function) - it threw "function gen_random_bytes does not exist" and broke chapter creation. Switched to `gen_random_uuid()` (core). Verified: `_rls_test.mjs` 18/18.
- `/api/health` falsely reported Supabase unreachable (a healthy Supabase answers an unkeyed probe with 401). Now probes `/auth/v1/health` with the apikey and checks `r.ok`.
- Migrations 0016 + 0017 applied to prod and verified live (RLS 18/18, leaderboard 8/8, 0017 behaviors 4/4).

## v1.6.1 - June 8, 2026 - Chapter page refactor (#47) + full audit

Maintenance release. No user-facing behavior change.

### Chapter page split (#47)
- The ~1220-line `app/app/chapter/page.tsx` god component is now a 59-line orchestrator over a focused `components/chapter/` module: a `useChapterData` controller hook (all state, the Supabase load/auto-join effect, every handler, derived flags), a `chapterHelpers` file (formatting, CSV exports, table styles, `MiniStat`), and six presentational sections - `ChapterSetup`, `ChapterInfo`, `MemberView`, `AdvisorView`, `ChapterDeadlines`, `MyEvents`. Pure structure: the JSX was transcribed verbatim and the logic lifted unchanged, so the advisor and member experiences are identical.
- Verified clean: `tsc --noEmit`, lint, and `next build` (80 routes), plus a live end-to-end regression of both the advisor view (create a chapter) and the member view (join by invite code) with zero console errors.

### Codebase audit
- Ran a full multi-domain audit (architecture, security, performance, reliability, business logic, UX, accessibility, compliance, docs, data, testing). Result: 0 Critical, 0 High, 19 Medium, 35 Low, 5 Informational, plus 137 explicitly cleared items. The report is kept local (gitignored `AUDIT-*.md`) since it details unfixed findings and the repo is public.

## v1.6 - June 8, 2026 - Growth CTA, single-event UX, advisor/member split

Feature release on top of the v1.5 audit pass. Email capture on the landing page, a cleaner auth nav, the single-event model finished end to end, and a proper separation between advisors and members inside a chapter.

### Email-capture landing CTA (migration 0015)
- The bottom "Get your chapter on FBLA One" CTA now has a real email capture next to the primary button (mirrors Corvo). Signed out it pairs "Get started free" with an email field; signed in it shows "Go to dashboard." Emails write to a new write-only `email_signups` table (anon insert, no read from the browser), de-duplicated on a unique email, with client-side validation. The hero "Get started" button is unchanged.

### Auth nav split
- Signed out, the top-right now shows both "Log in" and "Sign up" (was a single "Get started"). Signed in it shows "Go to dashboard" plus the profile menu (avatar, name, dropdown). On mobile the secondary action folds into the menu drawer.

### One event, one place (no more "My event" tab)
- You compete in one event, so the standalone "My event" page is gone (its URL now redirects to the dashboard). The dashboard's old "Active competitions" card is now a single "Your event" card: pick it, see your logs and average, jump to prep, or change it. The first-run tour points there now.

### Settings: chapter syncs automatically
- The Chapter field in Settings now fills in from the chapter you created or joined and saves automatically, instead of being a blank box you had to retype. While you are in a chapter the field is locked with a link to the Chapter page.

### Advisors are not members (migration 0016)
- An advisor who creates a chapter no longer shows up as a member inside it: they are excluded from the assignment completion grid, the leaderboard (both the advisor view and the student-visible one), and the roster. All of that is members-only now.

### Fixes
- The Chapter "Email invite" button opened a blank tab instead of your email app. It now opens a proper draft (switched from a new-tab open to a mailto navigation).

## v1.5 - June 4, 2026 - Audit hardening pass

A full multi-dimension audit (UI, UX, accessibility, security, performance, copy, completeness) plus two fixes flagged in testing. No new features - a correctness, trust, and accessibility pass across the whole app.

### Trust + copy (the product now matches its own claims)
- "100 questions" became "up to 50" everywhere (the generator caps at 50). "45 AI practice events" was really 34 (31 objective-test + 2 test+presentation + 1 team-test) - fixed on the landing stat, FAQ, and changelog.
- FAQ/privacy/terms no longer promise things that do not exist: dropped the unwired Resend email + "email all account holders," the nonexistent Settings data-export, "deletion within 30 days" (it is immediate), and "5-character" invite codes (they are 6). Stopped calling the current logo a retired "navy-and-gold shield." Deleted a stale "Coming soon - advisor dashboard" card advertising features already shipping.

### Practice-test answer quality
- Killed two answer giveaways: the correct option was often the longest/most-detailed, and the correct letter could cluster. The prompt now requires all four options to match in length with an even A/B/C/D spread, and the client Fisher-Yates shuffles each question's options (remapping the correct letter) - verified to never mis-score and to distribute evenly.

### Broken study links
- Every event's "Official guidelines" link pointed at a constructed connect.fbla.org PDF path; FBLA renames those files each cycle (and renamed several events for 2025-26), so they 404'd with "Missing file ID." All official-guideline links now point at FBLA's stable competitive-events hub.

### Security (migrations 0012-0014)
- **0013**: profile INSERT is pinned to role `member` - the privilege guard was UPDATE-only, so a client could insert itself as admin/advisor. Verified live: escalation blocked via both insert and update.
- **0012**: DB length caps on the anon-writable feedback table (message/type/page) + a textarea maxLength.
- **0014**: `join_chapter_by_code` returns the full chapter row, dropping a client round-trip on join (verified 18/18 via the RLS test).
- The practice-test rate limit keys on Vercel's non-spoofable IP header (matching ai-chat), the AI chat caps its total forwarded size, and the practice-test rate bucket now evicts so it can't leak memory.

### Accessibility
- prefers-reduced-motion is honored (ScrollReveal + a global animation/transition override).
- Contrast: eyebrows/accent text use an AA-safe gold in light mode, dark muted text clears 4.5:1, and the light-mode leaderboard medals use theme tokens instead of illegible metallic hexes.
- Focus traps (focus first control, trap Tab, Escape, restore focus) on the Delete-account and Remove-event dialogs and the spotlight tour, via a shared `useFocusTrap` hook. Error/success banners announce via `role="alert"` / `aria-live`; coach answers expose `aria-pressed`; form labels are associated; the off-screen mobile sidebar and collapsed FAQ answers leave the tab + screen-reader tree; the avatar upload is a real button.

### UI polish
- The nav logo sits on a white rounded plate matching the favicon/PWA icons; the AI-chat close X reads white in dark mode and the feedback FAB toggles to a matching X when open; changelog chips use 0.5px hairlines; modal radii are consistent.

### Performance + cleanup
- Dashboard derives its stats in a memo (not every render); the advisor 8-week trend buckets in one pass instead of eight; chapter event lists are hoisted out of render; the tracker caps history to the most recent 100 with a "show all"; the rank chip parallelizes its fetches; the footer watermark uses `next/image`.
- Extracted duplicated helpers (relativeTime, daysUntil, scoreColor, CSV build/download) into `lib/format.ts`; removed dead code + a stale status filter; standardized in-app wording on "event."

## v1.4 - June 4, 2026 - Chapter + learning platform

The release that makes a whole chapter adopt it: advisors run their chapter, students have a daily reason to come back.

### Advisor tools
- **Chapter assignments** (migration `0010`): an advisor sets a practice goal ("log 3 Accounting tests by Friday" - specific event or any) and sees a live completion grid: a progress bar, "X / Y members done," and a chip per member that turns green on completion (computed from members' practice logs). Members see "Your assignments" with their own progress bar + a "Practice now" shortcut. RLS mirrors the deadlines pattern (members read; only the advisor writes) via the 0006 SECURITY DEFINER helpers. Verified live 9/9.
- **Shareable invite**: a one-tap join link + Copy/Share + QR code on the advisor Chapter page. New `/join/<code>` route stashes the code and routes to the chapter (signed in) or signup (new user); the chapter page then auto-joins - no code to type.

### Student retention + learning
- **Chapter leaderboard students can see** (migration `0011`): a `get_chapter_leaderboard()` SECURITY DEFINER RPC returns only aggregates (name, test count, this-week) for the caller's own chapter, ranked by practice volume. Every student sees the board on their Chapter page (medal top 3, "You" highlighted) plus a "Chapter rank #X of Y" chip on the dashboard. Ranks by effort, not scores - no peer score leak. Verified live 8/8.
- **Weak-topic drills**: practice tests now tag each question with its topic; the coach builds a per-event "Your weak spots" panel (lowest-accuracy topics with bars) and a "Drill" button that generates a test focused entirely on that one topic.
- **Road to Nationals study plan** on the dashboard: the full season path Regionals -> States -> Nationals with editable dates, a live countdown to the next stage, completed stages checked off, and a weekly practice-pace target that ramps as the next competition nears.
- **Day streak** (consecutive practice days) on the dashboard, and **retry-your-misses** on the practice review screen (re-quiz only the ones you got wrong).

### Product + onboarding
- **Single event**: you pick the one event you're competing in (registering replaces). "My competitions" -> "My event" everywhere. Removing an event uses a styled modal, not the browser popup.
- **Guided spotlight tour** that dims the app and highlights each section (Back/Next/Skip), on first visit or via Settings -> Replay tour.
- **Role at signup**: a Student / Advisor picker. Advisors land on the Chapter page to create their chapter + invite code.
- **Expanded Settings**: account (email + role) and preferences (deadline-reminder toggle, default practice length, replay tour); delete-account is a styled modal.

### Polish
- AI chat button simplified to the logo on a clean disc with a gold glow; auth page uses the real logo; hero/CTAs are auth-aware (one button: "Go to dashboard" when signed in, "Get started" when not); app pages center their content; practice tests generate faster (Haiku 4.5 + concise explanations); the competitions filter bar sticks flush to the top; "Official guidelines" links to each event's FBLA guideline PDF; "Email us" opens a real mail client; removed "Claude generates the tests" framing in favor of the FBLA-specific value.

## v1.3 - June 3, 2026 - Public AI chat, auth + sign-in flow, new logo, full audit

### Sign-in actually works now (the headline fix)
- `proxy.ts` was force-setting `httpOnly: true` on Supabase cookies; the `@supabase/ssr` browser client reads the auth cookie from `document.cookie`, so the session was invisible to the client and "signing in did nothing" (bounced back to `/auth`). Set `httpOnly: false` (same bug + fix as Corvo). Auth redirects use a full `window.location` reload so the server sees the fresh cookie. Email confirmation is disabled, so signup goes straight to the dashboard. Verified live with Playwright (login -> `/app`, session persists across reload).
- The product now gates cleanly: public marketing pages funnel to `/auth`; `/app/*` is the study area and redirects to `/auth` when signed out.

### Public AI assistant (new)
- Floating "Ask FBLA One" chat bubble on **every** page (including `/app`). Backed by `/api/ai-chat` (Claude Haiku), 5 free messages/IP/day for anonymous visitors, unlimited when signed in. Lark-style panel: eyebrow + `X / 5 today` counter + suggestion chips + paper-plane send.
- Polish: replies are kept short (2-4 sentences), the view no longer auto-scrolls when a reply arrives (only when you send), and the "thinking" state is three animated gold dots instead of a static `...`.
- Hardened: the `messages` payload is validated + capped (no role injection / giant payloads), upstream errors are surfaced, and the rate-limit IP comes from Vercel's trusted header.

### Auth page redesign
- Rebuilt Corvo/Lark-style in FBLA colors: Log in / Sign up tabs, Google OAuth, email + password, magic link, forgot-password, and Cloudflare Turnstile (inline, enabled when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set). Same-origin guard on the `?next=` redirect.

### Landing + navigation
- Hero redesigned with a product-preview card (a live-feel practice question) and a layered grid/orb background; headline is now "Practice smarter. Score higher." with a clean solid-gold accent in light mode (the gradient was muddy there).
- Hero + final CTAs are now "Get started" + "Go to dashboard".
- Removed the repetitive "Three things" feature bento and "Every category" sections; new flow is hero -> how it works -> most-picked competitions -> CTA.
- **About page removed.** Nav is now Features / Competitions / Changelog / FAQ ("Features" -> home). New **Changelog** page: six equal-size chapter cards in a horizontal timeline.

### Brand: new logo everywhere
- New blue arrow/book mark applied across nav, footer, favicons, apple-touch, PWA icons, and a redesigned OG card. All sizes regenerate from one master via `scripts/regenerate-logo-assets.py`.
- The two floating buttons: AI chat shows the FBLA One logo (white disc on a gold gradient, both themes); the feedback flag is a cleaner stroked waving-flag. Both render on all pages and pair in the corner.

### Audit pass (UI / UX / mobile / security / AI / links)
- Mobile: app sidebar drawer gets a tap-to-close backdrop, tighter content padding, and the feedback FAB hugs the chat bubble.
- AI: practice-test prompt forbids em dashes/emojis in output and scales `max_tokens` with question count (was truncating 50-question tests); coach parser validates the answer key + all options (was silently mis-scoring); removed checkmark/X emoji glyphs in answer review.
- Security: `migration 0009` binds `feedback.user_id` to the caller; HSTS header; same-origin guard on account deletion.
- Content: Footer `v0.2` -> `v1.3`, fixed a truncated TED URL (3 events), corrected a FAQ reference to a removed button, deleted an orphan component.

---

## v1.2 - June 3, 2026 - Real logo, feedback system, nav cleanup

- **Logo:** replaced the simplified inline SVG mark with the actual brand asset (`public/logo-mark.png` - navy+gold shield+arrow+torch). Was visually wrong vs. the real brand.
- **Feedback button:** upgraded from a mailto FAB to a Corvo-style Supabase-backed widget. 52px floating button opens a centered modal with Bug / Feedback / Feature request type selector + message textarea. Inserts to `public.feedback` table (`migration 0008`). role=dialog + Escape + Tab focus-trap. **Apply migration 0008 in the Supabase SQL editor to activate.**
- **Cmd+K command palette removed:** the search/K button (left of the theme toggle in both navs), the CommandPalette component, and the keyboard shortcut listener are all gone. Also removed the now-unused `lib/competitionIndex.ts` light index.

## v1.1.1 - June 3, 2026 - Content completeness, bundle perf, accessibility

- **Content:** filled in longDescription for the 23 events that were marked "complete" but had none, so all 55 event detail pages now have a real description (audit #7-low).
- **Performance:** CommandPalette (mounted on every page) now ships a standalone light index (slug/name/category) in `lib/competitionIndex.ts` instead of the full registry, dropping the heavy per-event content from every marketing/auth/404 bundle (audit #7-high). A dev-only guard warns on drift.
- **Accessibility:** OnboardingModal + FeedbackButton get `role="dialog"`, focus management, and Escape-to-close (the modal also has a Tab focus-trap); PublicNav + AppShell drawers get `aria-expanded` + Escape + focus management; the focus-visible ring, `--text-muted`, and accent-colored small text now meet WCAG AA in light theme (audit #6/#8/#10/#11/#12).

## v1.1 - June 2, 2026 - Advisor leaderboard + stats, chapter-shared deadlines, security audit

### Advisor leaderboard + chapter stats (new)
- Chapter stats card: total practice tests, active members this week, chapter average score, top event, and an 8-week practice-volume trend.
- Leaderboard: members ranked by practice tests logged, then average score, with avg / best / last-active. Advisor view only, RLS-scoped.
- `getChapterStats()` in `lib/chapter.ts`; shared `Sparkbars` chart component (`components/Sparkbars.tsx`, replaces the dashboard's inline chart and adds aria-labels).

### Chapter-shared deadlines (new)
- In a chapter, the deadline calendar is shared: the advisor sets a deadline once and every member sees it (and gets the 3-day alert). Backed by the existing `public.deadlines` table.
- Advisors add/remove; members read-only. Solo / preview users keep personal localStorage deadlines.
- `lib/storage.ts` mirrors chapter deadlines locally (`syncChapterDeadlines`, `setChapterContext`) so existing synchronous readers work unchanged.

### CRITICAL SQL - apply in the Supabase SQL editor
- **migration 0005** (recovered to the repo): advisor read of member practice logs. Was applied live earlier but never committed, so the repo could not reproduce production.
- **migration 0006** (REQUIRED): fixes infinite recursion in the chapter/advisor RLS policies (a chapters <-> profiles loop introduced by 0004) that was breaking chapter creation and the entire advisor dashboard in production. Moves cross-table lookups into SECURITY DEFINER helpers; also adds a WITH CHECK + privilege-escalation guard on profile updates. Found by a live integration test.
- **migration 0007** (apply after 0006): closes the chapter-join holes - world-readable invite codes + self-join-any-chapter without an invite. Adds SECURITY DEFINER `create_chapter` / `join_chapter_by_code`, a guard so `chapter_id` only changes via those functions, and locks down chapters reads. `lib/chapter.ts` calls the RPCs with a legacy fallback, so it is safe to deploy before 0007 is applied.

### Security + correctness fixes (multi-agent audit, 43 findings)
- Sign-out now clears display name / chapter name / deadlines (was a cross-account leak on shared school computers).
- `/api/practice-test` now requires an authenticated session or preview cookie + a best-effort rate limit (was open to anyone, could drain the Anthropic budget).
- Fixed open redirects in `/api/preview` and `/auth/callback`.
- Guarded divide-by-zero: an `outOf` of 0 no longer renders `Infinity%` (dashboard, tracker, chapter activity, My Events).
- 55 competition pages now emit OpenGraph + Twitter images (Next 16 shallow-merge had dropped them).
- Accessibility: auth inputs labelled, charts have aria-labels. Mobile: `/app/competitions` rows + deadline form reflow. Removed em-dash violations + a dead variable.

### Deferred
- CommandPalette ships the full 55-event registry into every page bundle (needs a data-split refactor).

---

## v1.0 - May 29, 2026 - Advisor pitch features, demo mode, about/FAQ rewrite

### Demo mode
- `/api/preview` route sets a `fbla_preview=1` cookie (1 hr) and redirects into the app. Anyone can explore the full UI without signing up.
- App layout checks the preview cookie and skips auth redirect when set.
- AppShell shows a gold "Preview mode" banner with Sign up and Exit preview CTAs.
- Landing page hero CTAs route through `/api/preview` so "Try AI Practice Tests" works for unauthenticated visitors.

### About page
- Full rewrite for advisor audience. Tells the real story: Competition Chair at CRHS South, broken chapter process, 230k national scale.
- Three principles rewritten: Free forever, AI that knows FBLA, Advisor buy-in built in.
- Bottom CTA speaks to advisors; links to preview mode.

### FAQ
- New "AI Practice Tests" section (5 questions: how it works, accuracy, which events, saving scores, no limits).
- Competitions section rewritten (all 55 complete, annual topics explained).
- Chapters & advisors section rewritten to reflect live invite-code flow and CSV exports.

### Chapter advisor features
- Activity feed: advisors see a live stream of member practice sessions with member name, competition, score %, and relative time. Requires migration 0005.
- Email invite button: one click opens a pre-composed email with invite code and signup link.
- Sign-ups CSV export: one row per member per event, formatted for regional registration forms.
- Roster CSV export: full member list with roles and registered events.

### SQL (migration 0005)
Allows advisors to read practice logs of their chapter members. Run in Supabase SQL Editor.

---

## v0.9.1 - May 29, 2026 - All 55 events complete

Upgraded the final 10 competition events from `partial` to `complete`:
banking-financial-systems, broadcast-journalism, business-ethics, business-financial-plan,
business-plan, community-service-project, digital-animation, digital-video-production,
hospitality-event-management, public-service-announcement.

Each received a thorough `longDescription`, 10 topics covering stable craft/knowledge, and updated study resources. 55/55 events complete. 0 partial, 0 coming-soon.

---

## v0.9 - May 29, 2026 - Onboarding, deadline alerts, CSV export

- **Onboarding modal**: fires 700ms after a user's first `/app` visit. Three clickable steps with icons. Dismissed forever via localStorage flag `fbla_onboarded`.
- **Deadline alerts**: amber/red strip at top of every app page when deadlines are 3 days or less out. Per-deadline dismiss stored in `fbla_dismissed_deadline_alerts`.
- **CSV roster export**: "Export CSV" button on advisor chapter page downloads `chaptername-roster-YYYY-MM-DD.csv` with Name, Email, Role, Events Count, Registered Events.

---

## v0.8 - May 29, 2026 - Save buttons, clickable stats, resources wired up

- **Save buttons on competition pages**: bookmark icon per study resource (filled gold when saved, outline when not). Client component `StudyResourcesList` replaces static server-rendered list.
- **Dashboard stat cards clickable**: Registered links to `/app/competitions`, both log stats to `/app/tracker`, Saved resources to `/app/resources`.
- Fixes the full saved-resources loop: the `/app/resources` page now has data to show.

---

## v0.7 - May 29, 2026 - World-class polish pass

### Landing page
- Hero: "Practice smarter. Score higher at regionals." AI Practice Tests as the lead value prop.
- Stats: 55 competitions / 45 AI test events / 100 questions per test / Free.
- Bento grid reordered: AI Practice Tests as card 01. How-it-works updated to register/train/track.

### Competition detail pages
- "Test format" sidebar card (all objective-test events): time limit, questions, A/B/C/D format, no-penalty rule, Regional -> State -> NLC.
- "What to expect on test day" main content section with three icon+text rows.
- AI Practice Test CTA at top of sidebar for eligible complete events.

### Dashboard
- Score trends card: pure SVG bar chart per competition, color-coded by score. Appears once 3+ scored logs exist. Click to re-test.

### New `/app/resources` page
- Full saved resources library with competition filter, hostnames, dates, remove buttons.

### AppShell nav additions
- "AI Practice" (sparkle icon), "Saved resources" (bookmark icon).

### Command palette
- "AI Practice Tests" nav item added.

### Mobile
- Review options grid collapses to single column below 600px.

---

## v0.6 - May 29, 2026 - AI Practice Test Engine

- `/api/practice-test`: streaming POST endpoint. Sends competition name, format, duration, topics, and `longDescription` to Claude claude-sonnet-4-5 as context. Returns NDJSON (one question per line) for live client parsing.
- `/app/coach`: 4-phase state machine - IDLE (pick competition + question count), GENERATING (live progress bar + dot grid), TAKING (card UI, A/B/C/D keyboard shortcuts, dot navigation), REVIEWING (score banner, per-question explanations, one-click log to tracker).
- "AI Practice Test" button added to competition detail pages for all eligible objective-test events.
- `ANTHROPIC_API_KEY` env var added to `.env.example` and Vercel.

---

## v0.5 - May 29, 2026 - Advisor dashboard, Cmd+K everywhere, deadline widget

- `lib/chapter.ts`: Supabase ops for chapter create/join, profile fetch, member roster + registrations.
- Migration 0004: two new RLS policies (advisors read member profiles; any auth user can read chapters for invite-code join flow).
- Chapter page rebuilt: no-supabase / not-signed-in / no-chapter (create or join) / member (info + invite) / advisor (info + member roster table) states.
- `GlobalShell.tsx`: CommandPalette + FeedbackButton moved to root layout so Cmd+K works on marketing pages too.
- PublicNav: search trigger button added (desktop only).
- Dashboard: upcoming deadlines strip between stats and competitions. Only renders when deadlines exist.

---

## v0.4 - May 29, 2026 - Competition content, deadline calendar, command palette, feedback button, SVG logo

- `competitions.ts`: filled all 24 remaining events (45 complete, 10 partial at time of release). All events now have `longDescription`, `topics`, `studyResources`.
- `storage.ts`: added `Deadline` type + CRUD (key `fbla_deadlines`).
- Chapter page rebuilt with deadline calendar: add form (title, date, competition link, note), countdown badges, registered events chip grid.
- `CommandPalette.tsx`: Cmd+K / Ctrl+K global palette. Searches all 55 events + quick-nav to all app pages.
- `FeedbackButton.tsx`: fixed-position FAB (bottom-right). Compose panel fires `mailto:hello@fbla.one`.
- `Logo.tsx`: replaced `logo-mark.png` with inline SVG shield+torch using CSS variables, auto-adapts to light/dark.

---

## v0.3 - May 28, 2026 - Deployment + Supabase + production audit

**Now live in production at fbla.one.**

### Infrastructure
- GitHub repo `vinay-batra/fbla-one`; push to `main` auto-deploys via Vercel.
- Vercel project with custom domain `fbla.one` + `www.fbla.one` (SSL active).
- Supabase project `osxoygndwazbygiqyjhu` connected; env vars set locally + on Vercel.
- Google OAuth live, consent screen branded "FBLA One"; GitHub OAuth removed.
- PKCE auth flow via new `/auth/callback` route.

### Database
- `0002` migration: `avatar_url` column, avatars storage bucket + RLS, profile trigger attempt.
- `0003` migration: **fixed a critical bug** - tables had no GRANTs to the `authenticated` role, so every signed-in insert failed with "permission denied for table" (RLS never reached). Granted privileges + default privileges for future tables.
- Profile creation moved app-side (`ensureProfile`) because triggers on `auth.users` can't be created from the SQL editor.
- Whole data path verified via live integration test: registrations, practice logs, saved resources sync under RLS; cross-user isolation confirmed; avatar upload + storage isolation + delete-account confirmed.

### Features
- Real data sync: signed-in users' data persists to Supabase + syncs across devices; preview-mode data migrates up on first sign-in (`lib/storage.ts` + `components/DataSync.tsx`).
- `/app/*` auth-gated (redirects to `/auth` when signed out).
- UserMenu dropdown (avatar/initials, Escape-to-close, auth-reactive).
- Settings: avatar upload to Supabase Storage, display name, delete account.

### Polish / audit
- Removed all em dashes from source (14 files).
- SEO: per-page metadata, `sitemap.ts` (61 URLs), `robots.ts`, OG image with brand fonts, WebSite JSON-LD, canonicals.
- PWA: `manifest.ts`, theme-color, apple-web-app meta - installable to home screen.
- Branded `not-found`, `error`, `global-error` pages.
- Accessibility: UserMenu Escape + roles; Footer img dimensions (CLS).
- Audited all 53 study-resource links; fixed 4 broken ones.
- `lib/email.ts` scaffolded (Resend, fetch-based, no-ops without key).

## v0.2 - May 27, 2026 - Corvo-quality v1 platform

- Full rebuild on the scaffold using patterns from Corvo (token system, hairline borders, Space Mono typography, IntersectionObserver reveals, inline AppShell).
- Marketing site: landing, about, FAQ, privacy, terms under `(marketing)` route group.
- 55-event competition registry; `/competitions` filterable grid + `/competitions/[slug]` SSG detail pages.
- Auth page, AppShell, dashboard, tracker, chapter, settings.
- Supabase client + server helpers, `proxy.ts` middleware, `0001` schema migration.
- Removed pricing page / tiers - reframed as always free.
- Logo wired across nav + footer + favicons; smooth hero gradient.

## v0.1 - May 27, 2026 - Scaffold

- `create-next-app` (Next.js 16, React 19, TypeScript, App Router, Turbopack, no Tailwind).
- FBLA blue + gold theme system, text wordmark logo, Supabase stub, basic landing page.
