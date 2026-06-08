-- Migration 0015 - email_signups table for the landing-page email CTA
--
-- Submissions come straight from the browser via the anon Supabase client (the
-- "Get notified" capture at the bottom of the marketing landing page), so BOTH
-- anon and authenticated need INSERT. This project's tables are not auto-granted
-- (see 0003 - default privileges only grant `authenticated`), so the explicit
-- GRANT below is required or anon inserts fail "permission denied".
--
-- email is unique + lower-cased by the client so re-submits don't pile up; a
-- duplicate insert raises 23505, which the client treats as "already on list".
-- No SELECT is granted (the list is write-only from the browser; read it with
-- the service role / SQL editor). Idempotent, safe to re-run.

create table if not exists public.email_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default now()
);

alter table public.email_signups enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'email_signups' and policyname = 'Anyone can join the list'
  ) then
    create policy "Anyone can join the list" on public.email_signups
      for insert to anon, authenticated with check (true);
  end if;
end $$;

grant insert on public.email_signups to anon, authenticated;

notify pgrst, 'reload schema';
