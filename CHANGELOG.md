# Changelog

All notable changes to FBLA One. Live at [fbla.one](https://fbla.one).

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
