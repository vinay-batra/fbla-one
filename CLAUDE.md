@AGENTS.md

# CLAUDE.md — FBLA One

All-in-one platform for FBLA chapters: competition guides, study resources, prep tracker, deadline calendar, and chapter management. Pilot at Council Rock High School South (Vinay is Competition Chair), built generic so any chapter can use it.

---

## Deadline

**Aug 25, 2026** — present at FBLA officer meeting.

---

## Current focus

**Last shipped: v0.2 (May 27, 2026) — full v1 platform.** Massive Corvo-quality rebuild on top of the v0.1 scaffold.

- Full marketing site at `/`, `/about`, `/faq`, `/privacy`, `/terms` under the `(marketing)` route group sharing PublicNav + Footer. **FBLA One is always free** — no pricing page, no paid tiers, no upsells.
- 55-event FBLA competition registry in `lib/competitions.ts` with full content for ~25 objective-test events (Accounting I/II, Marketing, Cyber Security, Economics, etc.) and stubs for prompt-based events.
- `/competitions` — filterable + searchable grid (search, category, content depth). Statically generated.
- `/competitions/[slug]` — per-event detail page, SSG for all 55 events. Long description, test topics chip grid, curated external study resources, official rubric link, RegisterButton.
- `/auth` — sign in / sign up / magic link tabs + Google + GitHub OAuth. Graceful degradation when Supabase env vars missing (preview-mode banner).
- `/app` shell — sidebar (Dashboard / My competitions / Practice tracker / Chapter / Settings) + topbar (theme toggle, Browse Competitions). Dashboard with stats, active competitions, recent practice, suggested actions checklist.
- `/app/competitions` — registered events with last-practice timestamp + average score.
- `/app/tracker` — practice log form + history table.
- `/app/chapter` — chapter name editor + coming-soon advisor features (free).
- `/app/settings` — display name, chapter, theme, sign out, clear local data.
- **localStorage-first state** via `lib/storage.ts` — works in preview mode with no Supabase, mirrors to DB when configured.
- Supabase schema (`supabase/migrations/0001_init.sql`) — profiles, chapters, registrations, practice_logs, saved_resources, deadlines, all RLS-protected with idempotent migration.
- `proxy.ts` (Next.js 16's renamed middleware) — Supabase session refresh + hardened cookies (httpOnly, sameSite=lax, secure in prod).
- Corvo-grade theme system: 3-color palette, Inter + Space Mono + Space Grotesk via `@import`, 0.5px hairline borders, button library, input system, animations, mobile rules.
- AmbientOrbs (dark-mode-only) + ScrollReveal (IntersectionObserver-based per Corvo audit).
- Lint clean. Build clean (71 routes generated, all 55 competition pages prerendered).
- Domain bought: `fbla.one`. GitHub + Vercel + Supabase setup still pending (see README for steps).

### Next up
1. Push to GitHub, import to Vercel, point `fbla.one` DNS.
2. Create Supabase project + run `0001_init.sql` + add env vars to Vercel.
3. Replace AI-generated logo PNG (`public/logo.png`) with a transparent-background version, wire into nav.
4. Write content for remaining ~30 partial / coming-soon competition events as the year goes.
5. Implement DB-backed state on top of the storage helpers when ready (the localStorage layer maps 1:1 to the Supabase schema).
6. Email reminders for deadlines (Resend or Supabase Functions).
7. Chapter-tier launch: advisor dashboard, member roster, chapter-wide deadlines.

---

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack), TypeScript, React 19
- **Styling**: CSS variables only (no Tailwind). Inter + Space Mono + Space Grotesk via Google Fonts `@import` in globals.css.
- **Auth/DB**: Supabase (`@supabase/ssr` + `@supabase/supabase-js`). Project ref: `osxoygndwazbygiqyjhu`. URL: `https://osxoygndwazbygiqyjhu.supabase.co`.
- **Animation**: framer-motion (installed; ScrollReveal currently uses pure IntersectionObserver per Corvo audit).
- **Hosting**: Vercel (planned). Domain: fbla.one.
- **Local path**: `~/Downloads/fbla-one/`

---

## Critical rules — never break these

- **CSS variables only**, never hardcode hex colors in components. Theme palette lives in `app/globals.css`.
- **Space Mono** for accents, numbers, eyebrows, chips (via `.eyebrow`, `.font-mono`, `.metric-number`).
- **`data-theme="dark"|"light"` on `<html>`** is the source of truth. Never read theme from React state in CSS.
- **localStorage key is `fbla_theme`** — never `corvo_theme` (that's the other project), never `lark_theme`.
- **No emojis in UI**. SVG icons only.
- **No em dashes in source files** (use hyphens or rephrase). Exception: this CLAUDE.md may use them for readability.
- **No `onMouseEnter` / `onMouseLeave` in server components** — use CSS `:hover` via classes like `.resource-link`, `.category-tile`, `.related-link`, `.footer-link`. Client components are fine.
- **`useSearchParams()` must be wrapped in `<Suspense>`** at the page level. See `app/(marketing)/competitions/page.tsx` for the pattern.
- **`generateStaticParams` typed as Promise**. Next.js 16 changed `params` to a Promise — every dynamic page must `await params`.
- **`proxy.ts`, not `middleware.ts`** — Next.js 16 renamed it. Exported function is also `proxy`, not `middleware`.
- **Always commit + push after changes**. Per Vinay's workflow.
- **0.5px borders** are intentional — they read as hairlines and match Corvo's aesthetic. Don't bump to 1px.

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
      chapter/page.tsx          <- /app/chapter
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
`<p className="eyebrow">SOME LABEL</p>` — Space Mono 10px, 0.22em letter-spacing, accent color, uppercase, 700.

### Pulsing badge
`<HeroBadge>For FBLA Chapters</HeroBadge>` — gold-dot pill, used above marketing section headlines and hero copy.

### Section header
`<SectionHeader eyebrow="What's inside" title="Three things, done right." tagline="No fluff." accentLastWord />` — drop-in for marketing sections. ScrollReveal-wrapped.

### Scroll reveal
`<ScrollReveal delay={0.1}>...</ScrollReveal>` — IntersectionObserver-based fade-up. Threshold 0.12, rootMargin -8% bottom. Use everywhere on marketing pages.

### Card
`<Card variant="hover">...</Card>` — variants: default | hover | elevated | accent | glass. Use `CardHeader` for the standard eyebrow + title + tagline + right-slot pattern.

### Buttons
- `.btn .btn-accent` — gold pill with glow shadow (primary CTA)
- `.btn .btn-brand` — navy pill (alternative primary)
- `.btn .btn-ghost` — transparent + border, hover accent
- `.btn .btn-outline` — gold border, hover full fill
- `.btn .btn-danger` — red-tinted
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

### v0.2 (May 27, 2026) — Corvo-quality v1 platform

Massive rebuild on top of v0.1. Pulled patterns from Corvo (`~/Downloads/corvo/frontend/`) per an explicit audit: full token system, 0.5px hairline borders, Space Mono everywhere, IntersectionObserver-based ScrollReveal (not framer's `whileInView`), hand-rolled CSS-class hover (not onMouseEnter in server components), inline AppShell pattern.

Shipped in one session:
- **Foundation**: globals.css rewritten from scratch (~600 lines) — full token system with light + dark themes, Inter + Space Mono + Space Grotesk via @import, button + input + card libraries, animation keyframes, mobile responsive rules, hover utility classes for server components, ambient orb support.
- **Layout**: `app/layout.tsx` simplified (no next/font, FOUC script preserved, ConditionalAmbientOrbs mounted). Metadata set for fbla.one with OpenGraph + Twitter cards.
- **Components**: ScrollReveal (IO-based with delay + threshold + y-distance props), AmbientOrbs (dark-mode-only fixed gradients), ConditionalAmbientOrbs (hides on /app + /auth), SectionHeader (eyebrow + accentLastWord title + tagline), HeroBadge (pulsing gold dot), Card + CardHeader (variants), IconBtn (mi-btn micro-interaction), RegisterButton (localStorage-backed comp toggle), updated Logo (Space Grotesk wordmark), rewritten PublicNav (scroll-accumulator hide/show + mobile drawer + active state), rewritten Footer (3-col + disclaimer + bottom bar with version + domain), AppShell (sidebar + topbar + auth state + mobile drawer).
- **Competition registry**: `lib/competitions.ts` with 55 FBLA events. Full content (long description, test topics, study resources) for ~25 objective-test events. Coming-soon stubs for ~25 prompt-based events. Helpers: `getCompetition`, `getCompetitionsByCategory`, `getPopularCompetitions`, `getAvailableCompetitions`, `COMPETITION_STATS`.
- **Marketing site**: `(marketing)` route group with shared PublicNav + Footer.
  - `/` — hero with floating accent orbs + stats row + bento feature grid + popular competitions + how-it-works + categories grid + final CTA card.
  - `/about` — origin story + 3 principles cards.
  - `/faq` — 4-section accordion with smooth height transitions.
  - `/privacy`, `/terms` — content-only stubs with hero badge + section helper.
- **Competitions pages**:
  - `/competitions` — `useSearchParams` wrapped in `<Suspense>`, filterable by search + category + content depth, popular-first sort, sticky filter bar with count, empty state with reset.
  - `/competitions/[slug]` — `generateStaticParams` over all 55, `generateMetadata` per event, 2-col layout with main content + sticky sidebar (at-a-glance + related events), hero with chips + breadcrumb + headline + tagline + actions, content cards (about + topics chips + study resources with kind chips + external-link affordance), coming-soon notice for stubs, RegisterButton.
- **Auth**: `/auth` — minimal top bar (logo + back + theme toggle), card with hero badge + headline + 3-mode tabs (sign in / sign up / magic link) + Google + GitHub OAuth buttons + email/password form + inline error/info + terms link. Preview-mode banner when Supabase not configured.
- **App shell**: `AppShell.tsx` rendered by `app/app/layout.tsx`. Sidebar: logo + 5 nav links (Dashboard / My competitions / Practice tracker / Chapter / Settings) with active state (gold tint + left rail) + auth status + sign in/out button. Topbar: theme toggle + Browse Competitions link. Mobile: drawer.
  - `/app` — greeting (time-of-day + display name), 4 stat cards (Registered / Logs this week / Total practice / Saved resources), active competitions grid (per-comp log count + last log time), Last 5 logs sidebar card, Suggested actions checklist (4 setup steps with checkmark/strikethrough states).
  - `/app/competitions` — table-style list of registered events with category + format + log count + average score + Prep + Remove actions.
  - `/app/tracker` — 2-col: log form (competition select + score + out-of + duration + notes) + history table (date + competition + score + % + minutes + delete).
  - `/app/chapter` — chapter name editor + coming-soon-free card with 5 advisor feature bullets.
  - `/app/settings` — display name + chapter + theme picker + auth status + clear-local-data danger button.
- **Storage layer**: `lib/storage.ts` — localStorage-first persistence with custom-event broadcast + cross-tab sync. Maps 1:1 to Supabase tables so DB-backed implementation can layer on later without component changes.
- **Supabase**: `lib/supabase.ts` updated to use `createBrowserClient` properly. New `lib/supabase-server.ts` for server components with hardened cookies. `proxy.ts` (Next 16's renamed middleware) for SSR session refresh, with try/catch around getUser and explicit cookie hardening.
- **DB schema**: `supabase/migrations/0001_init.sql` — profiles (extends auth.users with role enum), chapters (with invite_code), registrations (unique per user+comp), practice_logs (with indexes), saved_resources, deadlines (chapter-scoped). All RLS policies idempotent via DO blocks. Advisor read-through on member registrations + chapter deadline management.
- **Build hygiene**: `next.config.ts` has security headers. `eslint.config.mjs` disables 3 noisy React 19 rules (no-unescaped-entities, set-state-in-effect, purity) that misfire on legitimate codebase patterns. `.gitignore` allows `.env*.example`. Build passes (71 routes, all 55 detail pages SSG). Lint passes clean.

### v0.1 (May 27, 2026) — Scaffold + landing
Initial `create-next-app` scaffold. First FBLA blue + gold theme attempt. Text-wordmark Logo. Stub Supabase. Basic landing page with 3 feature cards.
