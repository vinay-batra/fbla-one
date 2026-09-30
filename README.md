# ChapterPrep

AI-powered all-in-one platform for FBLA chapters: every competitive event verified against FBLA's guidelines, AI practice tests checked by a second model, an AI judge for role plays and presentations, a mistake bank, Mock Regionals for chapter meetings, and an advisor readiness report.

**Live at [chapterprep.com](https://chapterprep.com)** · Pilot: Council Rock High School South

| | |
|---|---|
| Repo | `github.com/vinay-batra/fbla-one` (push to `main` -> Vercel auto-deploys) |
| Hosting | Vercel, domain `chapterprep.com` (SSL active) |
| Database | Supabase project `osxoygndwazbygiqyjhu` (migrations 0001-0021, all applied + verified live; Mock Regionals 47/47, readiness 36/36, mistake bank 16/16, daily AI caps 13/13). |
| Auth | Google OAuth + email/password + magic link (PKCE via `/auth/callback`) |
| AI | Anthropic via `ANTHROPIC_API_KEY`: `claude-haiku-4-5` writes practice questions (`/api/practice-test`) and runs the public chat; `claude-sonnet-5` checks every question (`/api/verify-questions`) and powers the AI Judge (`/api/judge`) |

See [`CLAUDE.md`](./CLAUDE.md) for architecture + rules. [`CHANGELOG.md`](./CHANGELOG.md) for version history.

---

## What it does

Sign up (as a student or advisor), pick your event, then everything lives in the gated dashboard at `/app`.

**For students**
- **Every FBLA event** -- all 76, each with how it is judged (test, test then role play, presentation), its topic outline, and study resources
- **AI practice tests** -- 10/25/50 questions or a full 100-question, 50-minute simulation, built from the event's topic outline. A calculator tool computes every number, and a second model solves every question without the answer key; anything it cannot confirm is replaced
- **AI Judge** -- draw a role play card or hand in a presentation script, prep on the real clock, and get scored on the event's rating sheet with notes on what to fix
- **Mistake bank** -- missed questions come back in later tests until you get them right twice; synced to your account
- **Weak-topic drills, day streak, score trends, Road to Nationals study plan, chapter leaderboard, deadline calendar**
- **"Which event is for me?"** -- a 7-question quiz on the landing page that recommends three events with reasons

**For advisors** (see `/for-advisors`)
- **Run your chapter** -- create a chapter, share a one-tap invite link + QR, see the roster, leaderboard, stats, and CSV exports (including a regional-registration export)
- **Assignments** -- set practice goals and watch a live completion grid
- **Mock Regionals** -- one timed test on the projector, the whole chapter joins from their phones, server clock, podium and hardest question
- **Readiness report** -- each member marked Ready / On track / Needs attention, with weakest topics

**Limits**: AI use is capped per day (accounts: 200 practice questions, 30 judge calls, 60 chat messages; signed-out visitors less, per IP), resetting at midnight Eastern.

**Onboarding**: a guided spotlight tour on first visit (replayable from Settings). Free for every FBLA member.

---

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack), TypeScript, React 19
- **Styling**: CSS variables only (no Tailwind), paper-and-ink theme; Inter + Fraunces (headings) via `next/font`
- **Auth/DB**: Supabase (`@supabase/ssr` + `@supabase/supabase-js`)
- **AI**: `@anthropic-ai/sdk` -- streaming practice test generation via `/api/practice-test`
- **Hosting**: Vercel (frontend + edge functions), Supabase Postgres (DB)
- **Domain**: chapterprep.com

---

## Local development

```bash
npm install
cp .env.example .env.local       # fill in Supabase keys + ANTHROPIC_API_KEY
npm run dev                      # http://localhost:3000
npm run build                    # production build + type check
npm run lint                     # ESLint
```

Without `.env.local`, the site runs in **preview mode** - every page works, the app uses `localStorage` for state, and AI tests are disabled (no API key). Wire up both Supabase and Anthropic to enable all features.

---

## Supabase (already configured)

Project `osxoygndwazbygiqyjhu` is connected. Env vars set locally and on Vercel:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

**Migrations to run in order** (SQL Editor):

| Migration | Purpose |
|---|---|
| `0001_init.sql` | profiles, chapters, registrations, practice_logs, saved_resources, deadlines |
| `0002_profile_trigger_avatar.sql` | avatar_url column, storage bucket, profile trigger |
| `0003_grants_and_trigger_fix.sql` | **Critical** - grants SELECT/INSERT/UPDATE/DELETE to `authenticated` role. Without this every signed-in write fails. |
| `0004_chapter_advisor_rls.sql` | Advisors can read member profiles; any auth user can look up chapters by invite code |
| `0005` (inline below) | Advisors can read chapter member practice logs |
| `0006`-`0014` | RLS recursion fix, invite-validated join RPC, feedback table + caps, assignments, leaderboard RPC, profile-role insert guard |
| `0015_email_signups.sql` | landing-page email capture list |
| `0016_leaderboard_exclude_advisor.sql` | leaderboard excludes advisors |
| `0017_audit_remediation.sql` | audit fixes: indexes, role/feedback/email-list guards, audit_log, email_signups delete grant, 8-char invite codes |
| `0018_mock_regionals.sql` | Mock Regionals sessions, answer-key protection, server-side grading |
| `0019_practice_topic_results.sql` | per-topic results on practice logs (readiness report) |
| `0020_mistake_bank.sql` | mistake bank synced to accounts |
| `0021_ai_daily_quota.sql` | daily AI caps (`consume_ai_quota`, service role only) |

All migration files live in `supabase/migrations/`; run any unapplied ones in order. 0016 onward are idempotent.

**Migration 0005** - run in Supabase SQL Editor:
```sql
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='practice_logs'
    and policyname='Advisors read chapter member practice logs'
  ) then
    create policy "Advisors read chapter member practice logs" on public.practice_logs
      for select to authenticated using (
        user_id in (
          select p.id from public.profiles p
          join public.chapters c on c.id = p.chapter_id
          where c.advisor_user_id = auth.uid()
        )
      );
  end if;
end $$;
notify pgrst, 'reload schema';
```

Google OAuth is live. Auth settings: email confirmation **disabled** (instant signup).
Redirect URLs in Authentication -> URL Configuration: `https://chapterprep.com/**`, `https://www.chapterprep.com/**` and `http://localhost:3000/**` (the `/**` matters - a bare origin will not match `/auth/callback`). Site URL: `https://chapterprep.com`.

---

## Deploying (already live)

Every push to `main` auto-deploys via Vercel. No manual step.

Env vars required on Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

---

## Project structure

```
fbla-one/
  app/
    layout.tsx                   <- root: fonts, ThemeProvider, GlobalShell, Vercel Analytics, theme script
    globals.css                  <- full token system, button/input/card library (~600 lines)
    api/
      practice-test/route.ts     <- streaming AI practice test generation (POST)
      ai-chat/route.ts           <- public AI assistant (POST, rate-limited)
      delete-account/route.ts    <- account deletion (DELETE, service role + erasure)
      health/route.ts            <- /api/health readiness probe (GET)
      preview/route.ts           <- sets fbla_preview cookie for demo mode (GET)
    (landing)/
      page.tsx                   <- / landing page (editorial.css)
      for-advisors/page.tsx      <- /for-advisors
    (marketing)/
      layout.tsx                 <- PublicNav + Footer
      faq/page.tsx               <- /faq
      privacy/page.tsx
      terms/page.tsx
      competitions/
        page.tsx                 <- /competitions (filterable grid)
        [slug]/page.tsx          <- /competitions/[slug] (SSG, 76 pages)
    auth/page.tsx                <- sign in / sign up / magic link
    app/
      layout.tsx                 <- AppShell wrapper + auth gate (preview cookie bypass)
      page.tsx                   <- /app dashboard
      coach/page.tsx             <- /app/coach AI practice test UI
      competitions/page.tsx      <- /app/competitions
      tracker/page.tsx           <- /app/tracker
      chapter/page.tsx           <- /app/chapter (advisor dashboard)
      resources/page.tsx         <- /app/resources
      settings/page.tsx
  components/
    PublicNav.tsx                <- scroll-aware sticky nav + Cmd+K trigger
    Footer.tsx
    AppShell.tsx                 <- sidebar + topbar + preview banner + deadline alert
    AppTour.tsx                  <- first-visit spotlight guided tour
    GlobalShell.tsx              <- mounts PublicAIChat + FeedbackButton + OnboardingModal
    PublicAIChat.tsx             <- floating AI assistant FAB (-> /api/ai-chat)
    FeedbackButton.tsx           <- fixed FAB -> feedback modal (writes to public.feedback)
    OnboardingModal.tsx          <- first-visit welcome modal
    DeadlineAlert.tsx            <- in-app alert for deadlines within 3 days
    ChapterRankChip.tsx          <- dashboard chapter-rank nudge (shared leaderboard cache)
    StudyResourcesList.tsx       <- client component with bookmark save buttons
    chapter/                     <- chapter page module (#47): useChapterData hook +
                                    ChapterSetup/ChapterInfo/MemberView/AdvisorView/
                                    ChapterDeadlines/MyEvents + chapterHelpers
    ThemeProvider.tsx
    ThemeToggle.tsx
    Logo.tsx                     <- inline SVG shield+torch mark + wordmark
    ScrollReveal.tsx
    SectionHeader.tsx
    HeroBadge.tsx
    Card.tsx
    RegisterButton.tsx
  lib/
    competitions.ts              <- 76-event FBLA registry, formats verified against the guidelines
    storage.ts                   <- localStorage-first state + Supabase sync
    chapter.ts                   <- chapter Supabase ops (create, join, roster, activity)
    url.ts                       <- safeNextPath() same-origin redirect guard
    leaderboard-cache.ts         <- 60s single-flight cache for the leaderboard RPC
    format.ts                    <- shared date/score/CSV helpers + dayKeyET
    supabase.ts                  <- browser client
    supabase-server.ts           <- server component client
  proxy.ts                       <- Next.js 16 middleware
  supabase/migrations/           <- 0001-0017
  docs/DISASTER-RECOVERY.md      <- backup/restore runbook (RPO/RTO)
  .github/workflows/db-backup.yml<- nightly logical backup (needs SUPABASE_DB_URL secret)
```

---

## Rules

See `CLAUDE.md` for the full list. Non-negotiable:

- CSS variables only - never hardcode hex colors.
- Theme via `data-theme="dark"|"light"` on `<html>`. localStorage key: `fbla_theme`.
- No emojis. No em dashes anywhere. Spell it "advisor".
- Paper and ink with one accent, the red pen. Fraunces for headings. No blue, teal or glow.
- `proxy.ts` not `middleware.ts` (Next.js 16).
- `await params` in every dynamic route (Next.js 16).
- New `public.*` tables need explicit GRANTs (see migration 0003).
- Always commit + push after changes.
