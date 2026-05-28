# FBLA One

All-in-one platform for FBLA chapters: competition guides, study resources, prep tracker, and chapter management.

Live target: **[fbla.one](https://fbla.one)**
Pilot at: Council Rock High School South FBLA chapter
Deadline: Aug 25, 2026 (FBLA officer meeting)

---

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack), TypeScript, React 19
- **Styling**: CSS variables only (no Tailwind), Inter + Space Mono + Space Grotesk fonts via `@import`
- **Auth/DB**: Supabase (`@supabase/ssr` + `@supabase/supabase-js`)
- **Hosting**: Vercel (frontend), Supabase Postgres (DB)
- **Domain**: fbla.one

See [`CLAUDE.md`](./CLAUDE.md) for full architecture notes, rules, and conventions.

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

## Setting up Supabase

1. Create a new project at [supabase.com](https://supabase.com) (the FBLA One project).
2. From **Project Settings → API**, copy the **Project URL** and **anon public key**.
3. Add them to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```
4. Open the **SQL Editor** and paste the contents of `supabase/migrations/0001_init.sql`. Run it. (Idempotent - safe to re-run.)
5. Optional: enable Google + GitHub OAuth providers in **Authentication → Providers**. Set the redirect URL to `https://fbla.one/auth/callback` (and `http://localhost:3000/auth/callback` for local).
6. Restart `npm run dev`. The auth page will switch from preview banner to live, OAuth buttons will appear, and the app dashboard will use the DB.

---

## Deploying to Vercel

### One-time setup

1. Push the repo to GitHub:
   ```bash
   gh repo create vinay-batra/fbla-one --public --source=. --remote=origin --push
   ```
   (Or create the repo at github.com/new and follow its push instructions.)

2. At [vercel.com/new](https://vercel.com/new), import the GitHub repo.
3. Framework preset: **Next.js** (auto-detected).
4. Add environment variables (copy from your `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**. First build takes ~2 min.

### Connecting fbla.one

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
