# FBLA One

AI-powered all-in-one platform for FBLA chapters: competition guides, AI practice tests, prep tracker, deadline calendar, and advisor dashboard.

**Live at [fbla.one](https://fbla.one)** · Pilot: Council Rock High School South · Officer meeting: Aug 25, 2026

| | |
|---|---|
| Repo | `github.com/vinay-batra/fbla-one` (push to `main` -> Vercel auto-deploys) |
| Hosting | Vercel, domain `fbla.one` (SSL active) |
| Database | Supabase project `osxoygndwazbygiqyjhu` (migrations 0001-0005 run) |
| Auth | Google OAuth + email/password + magic link (PKCE via `/auth/callback`) |
| AI | Anthropic claude-sonnet-4-5 via `@anthropic-ai/sdk` (`ANTHROPIC_API_KEY` in Vercel) |

See [`CLAUDE.md`](./CLAUDE.md) for architecture + rules. [`CHANGELOG.md`](./CHANGELOG.md) for version history.

---

## What it does

- **55 competition guides** -- every FBLA event with test format, topic list, curated study resources, and "What to expect on test day"
- **AI Practice Test Engine** -- Claude generates 10/25/50-question tests calibrated to each event's topic outline, streams them live, and explains every wrong answer. 45 objective-test events supported.
- **Score tracker** -- log practice sessions, see score trend charts per competition on the dashboard
- **Deadline calendar** -- add sign-up dates and test days, get in-app alerts when deadlines are 3 days out
- **Saved resources** -- bookmark any study resource from any competition page, manage at `/app/resources`
- **Chapter advisor dashboard** -- create a chapter, generate an invite code, see member roster + their registered events + recent practice activity, export CSVs for regional registration
- **Demo mode** -- `/api/preview` lets anyone explore the full app without signing up (1-hour cookie)
- **Command palette** -- Cmd+K searches all 55 events and navigates the app

---

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack), TypeScript, React 19
- **Styling**: CSS variables only (no Tailwind), Inter + Space Mono + Space Grotesk via `@import`
- **Auth/DB**: Supabase (`@supabase/ssr` + `@supabase/supabase-js`)
- **AI**: `@anthropic-ai/sdk` -- streaming practice test generation via `/api/practice-test`
- **Hosting**: Vercel (frontend + edge functions), Supabase Postgres (DB)
- **Domain**: fbla.one

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
Redirect URLs in Authentication -> URL Configuration: `https://fbla.one/auth/callback` + `http://localhost:3000/auth/callback`.

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
    layout.tsx                   <- root: ThemeProvider + GlobalShell + AmbientOrbs + FOUC
    globals.css                  <- full token system, button/input/card library (~600 lines)
    api/
      practice-test/route.ts     <- streaming AI practice test generation (POST)
      preview/route.ts           <- sets fbla_preview cookie for demo mode (GET)
    (marketing)/
      layout.tsx                 <- PublicNav + Footer
      page.tsx                   <- / landing page
      about/page.tsx             <- /about
      faq/page.tsx               <- /faq
      privacy/page.tsx
      terms/page.tsx
      competitions/
        page.tsx                 <- /competitions (filterable grid)
        [slug]/page.tsx          <- /competitions/[slug] (SSG, 55 pages)
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
    GlobalShell.tsx              <- mounts CommandPalette + FeedbackButton + OnboardingModal
    CommandPalette.tsx           <- Cmd+K palette (competition search + nav)
    FeedbackButton.tsx           <- fixed FAB -> mailto feedback
    OnboardingModal.tsx          <- first-visit welcome modal
    DeadlineAlert.tsx            <- in-app alert for deadlines within 3 days
    StudyResourcesList.tsx       <- client component with bookmark save buttons
    ThemeProvider.tsx
    ThemeToggle.tsx
    Logo.tsx                     <- inline SVG shield+torch mark + wordmark
    ScrollReveal.tsx
    AmbientOrbs.tsx
    ConditionalAmbientOrbs.tsx
    SectionHeader.tsx
    HeroBadge.tsx
    Card.tsx
    RegisterButton.tsx
  lib/
    competitions.ts              <- 55-event FBLA registry (all complete)
    storage.ts                   <- localStorage-first state + Supabase sync
    chapter.ts                   <- chapter Supabase ops (create, join, roster, activity)
    supabase.ts                  <- browser client
    supabase-server.ts           <- server component client
  proxy.ts                       <- Next.js 16 middleware
  supabase/migrations/           <- 0001-0004 (0005 inline in README)
```

---

## Rules

See `CLAUDE.md` for the full list. Non-negotiable:

- CSS variables only - never hardcode hex colors.
- Theme via `data-theme="dark"|"light"` on `<html>`. localStorage key: `fbla_theme`.
- No emojis in UI. No em dashes in source files.
- Space Mono for numbers, eyebrows, chips.
- `proxy.ts` not `middleware.ts` (Next.js 16).
- `await params` in every dynamic route (Next.js 16).
- New `public.*` tables need explicit GRANTs (see migration 0003).
- Always commit + push after changes.
