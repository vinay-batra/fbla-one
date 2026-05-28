# FBLA One

All-in-one platform for FBLA chapters: competition guides, study resources, prep tracker, and chapter management.

**Live at [fbla.one](https://fbla.one)** · Pilot: Council Rock High School South · Deadline: Aug 25, 2026 (FBLA officer meeting)

| | |
|---|---|
| Repo | `github.com/vinay-batra/fbla-one` (push to `main` -> Vercel auto-deploys) |
| Hosting | Vercel, domain `fbla.one` (SSL active) |
| Database | Supabase project `osxoygndwazbygiqyjhu` (migrations 0001-0003 run) |
| Auth | Google OAuth + email/password + magic link (PKCE via `/auth/callback`) |

See [`CLAUDE.md`](./CLAUDE.md) for architecture + rules, [`CHANGELOG.md`](./CHANGELOG.md) for version history.

---

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack), TypeScript, React 19
- **Styling**: CSS variables only (no Tailwind), Inter + Space Mono + Space Grotesk fonts via `@import`
- **Auth/DB**: Supabase (`@supabase/ssr` + `@supabase/supabase-js`)
- **Hosting**: Vercel (frontend), Supabase Postgres (DB)
- **Domain**: fbla.one

---

## Local development

```bash
npm install
cp .env.example .env.local       # fill in Supabase keys
npm run dev                      # http://localhost:3000
npm run build                    # production build + type check
npm run lint                     # ESLint
```

Without `.env.local`, the site runs in **preview mode** - every page works, the
app dashboard uses `localStorage` for state, and the auth page shows a "preview
mode" banner. Wire up Supabase to enable real auth and DB persistence.

---

## Supabase (already configured)

Project `osxoygndwazbygiqyjhu` is connected and all migrations are run. The
`.env.local` on the dev machine and the Vercel env vars hold:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

**If you ever rebuild the DB from scratch**, run the migrations in order in the
SQL Editor: `0001_init.sql`, `0002_profile_trigger_avatar.sql`,
`0003_grants_and_trigger_fix.sql`. The 0003 grants are essential - without them
every signed-in insert fails with "permission denied for table."

Google OAuth is live (Authentication -> Providers -> Google). Redirect URLs in
**Authentication -> URL Configuration**: `https://fbla.one/auth/callback` +
`http://localhost:3000/auth/callback`. Site URL: `https://fbla.one`.

---

## Deploying (already live)

The Vercel project is connected to the GitHub repo - **every push to `main`
auto-deploys**. No manual deploy step.

To reproduce from scratch: import the repo at [vercel.com/new](https://vercel.com/new),
framework auto-detects as Next.js, add the three env vars above, deploy.

### Domain (already connected)

1. In Vercel, **Project Settings → Domains** → add `fbla.one` and `www.fbla.one`.
2. Vercel will show DNS records to add (usually an A record + CNAME).
3. Add those records at whichever registrar you bought `fbla.one` from (e.g., Namecheap, Porkbun).
4. Wait for DNS propagation (usually <30 min). Vercel auto-provisions an SSL cert.

Every push to `main` triggers a new production deploy.

---

## Project structure

```
fbla-one/
  app/
    layout.tsx                   <- root: ThemeProvider + AmbientOrbs + FOUC script
    globals.css                  <- full token system, button + input + card library
    (marketing)/
      layout.tsx                 <- PublicNav + Footer wrapper for marketing pages
      page.tsx                   <- /
      about/page.tsx
      faq/page.tsx
      privacy/page.tsx
      terms/page.tsx
      competitions/
        page.tsx                 <- list + filters
        [slug]/page.tsx          <- per-event detail (SSG for all 55 events)
    auth/page.tsx                <- sign in / sign up / magic link (Supabase + OAuth)
    app/
      layout.tsx                 <- AppShell wrapper
      page.tsx                   <- dashboard
      competitions/page.tsx      <- my registered events
      tracker/page.tsx           <- practice log
      chapter/page.tsx
      settings/page.tsx
  components/
    PublicNav.tsx                <- scroll-aware sticky nav
    Footer.tsx                   <- 3-col footer
    AppShell.tsx                 <- sidebar + topbar for /app routes
    ThemeProvider.tsx            <- light/dark via [data-theme]
    ThemeToggle.tsx
    Logo.tsx                     <- "FBLA One" wordmark
    ScrollReveal.tsx             <- IntersectionObserver fade-up
    AmbientOrbs.tsx              <- dark-mode-only background gradients
    ConditionalAmbientOrbs.tsx
    SectionHeader.tsx            <- eyebrow + title + tagline
    HeroBadge.tsx                <- pulsing gold-dot pill
    Card.tsx                     <- shared card primitive
    IconBtn.tsx
    RegisterButton.tsx           <- client-side competition register/unregister
  lib/
    competitions.ts              <- 55-event FBLA competition registry
    storage.ts                   <- localStorage-first persistence layer
    supabase.ts                  <- browser client (graceful degradation)
    supabase-server.ts           <- server component client
  proxy.ts                       <- Next.js 16 middleware (Supabase session refresh)
  supabase/migrations/
    0001_init.sql                <- chapters, registrations, practice_logs, etc.
  public/
    logo.png                     <- brand mark (white BG; replace w/ transparent)
```

---

## Rules

See `CLAUDE.md` for the full list. The non-negotiable ones:

- CSS variables only - never hardcode hex colors.
- Theme via `data-theme="dark"|"light"` on `<html>`.
- No emojis in UI, no em dashes in source.
- localStorage key is `fbla_theme` (not `corvo_theme`, not `lark_theme`).
- Space Mono for every number, eyebrow, and chip.
- Always commit + push after a set of changes (no remote yet - push goes live once GitHub is connected).
