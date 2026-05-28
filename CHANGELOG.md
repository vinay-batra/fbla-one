# Changelog

All notable changes to FBLA One. Live at [fbla.one](https://fbla.one).

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
