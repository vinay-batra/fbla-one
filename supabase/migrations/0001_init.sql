-- FBLA One — initial schema
-- Run this in the Supabase SQL editor for the FBLA One project.
-- Idempotent: safe to re-run.

-- ───── profiles (extends auth.users) ─────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  chapter_id uuid,
  role text not null default 'member' check (role in ('member', 'officer', 'advisor', 'admin')),
  grade text,
  events_interest text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users read own profile') then
    create policy "Users read own profile" on public.profiles
      for select to authenticated using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users update own profile') then
    create policy "Users update own profile" on public.profiles
      for update to authenticated using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users insert own profile') then
    create policy "Users insert own profile" on public.profiles
      for insert to authenticated with check (auth.uid() = id);
  end if;
end $$;

-- ───── chapters ─────
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  school text,
  state text,
  advisor_user_id uuid references auth.users(id) on delete set null,
  invite_code text unique,
  created_at timestamptz not null default now()
);

alter table public.chapters enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='chapters' and policyname='Members read own chapter') then
    create policy "Members read own chapter" on public.chapters
      for select to authenticated using (
        id in (select chapter_id from public.profiles where id = auth.uid() and chapter_id is not null)
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='chapters' and policyname='Advisors manage own chapter') then
    create policy "Advisors manage own chapter" on public.chapters
      for all to authenticated using (advisor_user_id = auth.uid()) with check (advisor_user_id = auth.uid());
  end if;
end $$;

-- ───── registrations (member signed up for a competition) ─────
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  competition_slug text not null,
  status text not null default 'preparing' check (status in ('preparing', 'submitted', 'qualified', 'won', 'dropped')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, competition_slug)
);

alter table public.registrations enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='registrations' and policyname='Users manage own registrations') then
    create policy "Users manage own registrations" on public.registrations
      for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='registrations' and policyname='Chapter advisor reads member registrations') then
    create policy "Chapter advisor reads member registrations" on public.registrations
      for select to authenticated using (
        user_id in (
          select p.id from public.profiles p
          join public.chapters c on c.id = p.chapter_id
          where c.advisor_user_id = auth.uid()
        )
      );
  end if;
end $$;

-- ───── practice_logs (per-user practice tests) ─────
create table if not exists public.practice_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  competition_slug text not null,
  score integer,
  out_of integer,
  duration_min integer,
  notes text,
  logged_at timestamptz not null default now()
);

alter table public.practice_logs enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='practice_logs' and policyname='Users manage own practice logs') then
    create policy "Users manage own practice logs" on public.practice_logs
      for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

create index if not exists idx_practice_logs_user_comp on public.practice_logs(user_id, competition_slug, logged_at desc);

-- ───── saved_resources (user-saved external resources) ─────
create table if not exists public.saved_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  competition_slug text,
  title text not null,
  url text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.saved_resources enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='saved_resources' and policyname='Users manage own saved resources') then
    create policy "Users manage own saved resources" on public.saved_resources
      for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

-- ───── deadlines (chapter-level deadlines) ─────
create table if not exists public.deadlines (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz not null,
  competition_slug text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.deadlines enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='deadlines' and policyname='Chapter members read deadlines') then
    create policy "Chapter members read deadlines" on public.deadlines
      for select to authenticated using (
        chapter_id in (select chapter_id from public.profiles where id = auth.uid() and chapter_id is not null)
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='deadlines' and policyname='Chapter advisors manage deadlines') then
    create policy "Chapter advisors manage deadlines" on public.deadlines
      for all to authenticated using (
        chapter_id in (select id from public.chapters where advisor_user_id = auth.uid())
      ) with check (
        chapter_id in (select id from public.chapters where advisor_user_id = auth.uid())
      );
  end if;
end $$;

create index if not exists idx_deadlines_chapter_due on public.deadlines(chapter_id, due_at);

-- Notify PostgREST to reload schema cache
notify pgrst, 'reload schema';
