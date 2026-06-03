-- Migration 0008 - feedback table for the FeedbackButton widget
--
-- Submissions come straight from the browser via the anon Supabase client, so
-- BOTH anon and authenticated need INSERT. This project's tables are not
-- auto-granted (see 0003 - default privileges only grant `authenticated`), so
-- the explicit GRANT below is required or anon inserts fail "permission denied".
-- Idempotent, safe to re-run.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  type text,
  message text not null,
  page text,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'feedback' and policyname = 'Anyone can submit feedback'
  ) then
    create policy "Anyone can submit feedback" on public.feedback
      for insert to anon, authenticated with check (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'feedback' and policyname = 'Users read own feedback'
  ) then
    create policy "Users read own feedback" on public.feedback
      for select to authenticated using (auth.uid() = user_id);
  end if;
end $$;

grant select, insert on public.feedback to anon, authenticated;

notify pgrst, 'reload schema';
