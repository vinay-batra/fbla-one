@AGENTS.md

# CLAUDE.md — FBLA One

The all-in-one platform for FBLA chapters: competition guides, study resources, prep tracker, and chapter management. Pilot at Council Rock High School South (Vinay is Competition Chair), built generic so any chapter can use it.

---

## Deadline

**Aug 25, 2026** — present at FBLA officer meeting. v1 must include:
- Content layer: page per FBLA competition (what it is, test topics, study resources, rubric link)
- Tracker layer: user accounts + per-competition progress + practice test logs
- Chapter mgmt: comp sign-up, advisor dashboard, deadline calendar + email reminders

---

## Current Focus

**Last shipped: v0.1 (May 27, 2026) — Scaffold + landing page.**

- Project bootstrapped with `create-next-app` (Next.js 16, React 19, TS, App Router, Turbopack).
- FBLA blue (#003C7E) + gold (#FFB81C) theme system ported from Lark — light + dark via `[data-theme]` on `<html>`, SSR-safe FOUC script, localStorage persist key `fbla_theme`.
- Landing page at `/` — sticky nav, hero with floating accent orbs, feature grid (Guides / Tracker / Chapter), CTA card, footer.
- Logo component is a text wordmark (`FBLA` blue + `One` gold). The PNG mark at `public/logo.png` is the AI-generated shield-with-torch from Vinay; has white background so it isn't used in dark-mode UI yet. **Replace with a transparent-background version before using in nav/footer.**
- Supabase client stub in `lib/supabase.ts` — graceful degradation when env vars missing (returns null, sets `isSupabaseConfigured = false`). No real Supabase project yet.
- Security headers in `next.config.ts`.
- No git remote yet. No deploy yet.

### Next up
1. Per-competition MDX content layer (pages at `/competitions/[slug]`). Skip events that require presentation prompts (we don't know the prompts).
2. Supabase project creation + auth pages.
3. Tracker UI (per-user progress per competition).
4. Chapter mgmt (comp sign-up, advisor dashboard, deadline calendar).
5. Email reminders (Resend or Supabase Functions).
6. Vercel deploy + domain (fbla.one or fblaone.com).

---

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack), TypeScript, React 19
- **Styling**: CSS variables only (no Tailwind), Inter (sans) + Space Mono (accent/numbers/eyebrows)
- **Auth/DB**: Supabase (`@supabase/ssr` + `@supabase/supabase-js`) — not yet configured
- **Deploy**: TBD (Vercel planned)
- **Local path**: `~/Downloads/fbla-one/`
- **Domain**: TBD (not bought)

---

## Critical Rules — Never Break These

- CSS variables only, never hardcode hex colors in components. Theme palette lives in `app/globals.css`.
- Space Mono for accents/numbers/eyebrows via `.eyebrow` class or `.mono` class.
- `overscroll-behavior: none` globally (already set on body).
- Theme is set via `data-theme="dark" | "light"` on `<html>` — never hardcode dark colors.
- `localStorage` key is `fbla_theme` (NOT `lark_theme` — that's the other project).
- No emojis in UI.
- No em dashes in source files or copy (use hyphens or rephrase).
- Always commit and push after making changes. Per Vinay's workflow: ship, don't ask permission. (No remote yet, so just commit.)

---

## Theme System

- CSS variables defined twice in `app/globals.css`: `:root, [data-theme="dark"]` and `[data-theme="light"]`.
- `ThemeProvider` (`components/ThemeProvider.tsx`) wraps the app, exposes `useTheme()` -> `{ theme, toggle, setTheme }`.
- Persists to `localStorage.fbla_theme`.
- SSR-safe inline script in `<head>` of `app/layout.tsx` reads localStorage and sets `data-theme` before paint to prevent FOUC.
- Default: dark.
- `ThemeToggle` is a 36×36 sun/moon icon button.

### Dark vars
`--bg: #060c16` (near-black navy), `--accent: #ffb81c` (gold), `--brand: #4a8fe0` (lighter blue for dark contrast), warm cream text.

### Light vars
`--bg: #faf9f6` (warm cream), `--accent: #c8881a` (darker gold for light contrast), `--brand: #003c7e` (FBLA navy), dark navy text.

---

## File Structure

```
fbla-one/
  app/
    layout.tsx              <- root, ThemeProvider + theme script + Inter/Space Mono fonts
    globals.css             <- full theme (dark+light), button classes, card class, eyebrow
    favicon.ico             <- default from create-next-app (replace later)
    page.tsx                <- / (landing: hero + feature grid + CTA + footer)
  components/
    ThemeProvider.tsx       <- context + useTheme hook + localStorage persist
    ThemeToggle.tsx         <- sun/moon icon button (uses useTheme)
    Logo.tsx                <- text wordmark "FBLA One" (blue + gold)
    PublicNav.tsx           <- sticky nav: logo + links + theme toggle + sign in CTA
    Footer.tsx              <- 3-col grid + brand description + legal disclaimer
    Reveal.tsx              <- IntersectionObserver scroll-triggered fade-up
  lib/
    supabase.ts             <- getSupabase() returns SupabaseClient | null (graceful degradation)
  public/
    logo.png                <- AI-generated brand mark (white BG, replace with transparent)
  next.config.ts            <- security headers
  .env.example        <- env var template (copy to .env.local)
```

---

## Component Patterns

### Eyebrow
`<p className="eyebrow">SOME LABEL</p>`
- Space Mono 10px, 0.22em letter-spacing, accent color, uppercase, 700 weight.

### Reveal
`<Reveal delay={0.1}>...</Reveal>` — IntersectionObserver-based fade-up. Threshold 0.12, rootMargin -40px. Use on marketing sections.

### Buttons
- `.btn .btn-accent` — solid gold pill, glow shadow
- `.btn .btn-brand` — solid FBLA blue pill
- `.btn .btn-ghost` — transparent + border, hover accent
- `.btn .btn-outline` — gold border only, hover full fill
- `.btn-lg` for hero CTAs, `.btn-sm` for compact

### Cards
- `.card` — `card-bg`, 14px radius, 1px border, 24px padding
- Add `.card-hover` for lift + accent border on hover

---

## Auth Pattern (Supabase, when configured)

`lib/supabase.ts`:
- `getSupabase()` returns `SupabaseClient | null` based on env vars.
- `isSupabaseConfigured` boolean for graceful degradation.

To enable:
1. Create Supabase project at supabase.com.
2. Copy URL + anon key.
3. Add to `.env.local` (copy from `.env.example`).
4. Restart dev server.

---

## Setup (fresh clone)

```bash
cd ~/Downloads/fbla-one
npm install
cp .env.example .env.local  # then fill in Supabase keys
npm run dev
```

Open http://localhost:3000.

---

## What Was Built

### v0.1 (May 27, 2026) — Scaffold + landing
- Project scaffold via `create-next-app` (Next 16, React 19, TS, App Router, Turbopack, no Tailwind, no src dir, npm).
- Removed default placeholder assets (next/vercel/file/globe/window SVGs, page.module.css).
- Wrote FBLA blue + gold theme system in `globals.css` (ported from Lark, palette swapped).
- Inter + Space Mono via `next/font/google`.
- `ThemeProvider`, `ThemeToggle`, `Reveal`, `Logo`, `PublicNav`, `Footer` components.
- Landing page: hero w/ accent orbs, feature grid (Competition Guides, Prep Tracker, Chapter Management), CTA, footer.
- Logo PNG copied to `public/logo.png` (has white BG — not used in UI yet; awaiting transparent version).
- Supabase client stub with graceful degradation; deps installed (`@supabase/ssr`, `@supabase/supabase-js`).
- Security headers added to `next.config.ts`.
- `.env.example` template.
