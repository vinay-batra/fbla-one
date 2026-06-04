-- Migration 0010 - chapter assignments
--
-- An advisor sets a goal ("log 3 Accounting tests by Friday"); every member of
-- the chapter sees it and their progress is computed from practice_logs. Mirrors
-- the deadlines RLS shape from 0006 (members of the chapter read; only the
-- chapter advisor writes), using the SECURITY DEFINER helpers so there's no
-- policy recursion. Idempotent.

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  title text not null,
  event_slug text,                       -- specific competition, or null = any event
  target_count int not null default 1 check (target_count >= 1 and target_count <= 100),
  due_at date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists assignments_chapter_idx on public.assignments(chapter_id);

alter table public.assignments enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='assignments' and policyname='Chapter members read assignments') then
    create policy "Chapter members read assignments" on public.assignments
      for select to authenticated using (chapter_id = public.current_chapter_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='assignments' and policyname='Advisor inserts assignments') then
    create policy "Advisor inserts assignments" on public.assignments
      for insert to authenticated
      with check (public.is_chapter_advisor(chapter_id) and created_by = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='assignments' and policyname='Advisor updates assignments') then
    create policy "Advisor updates assignments" on public.assignments
      for update to authenticated
      using (public.is_chapter_advisor(chapter_id))
      with check (public.is_chapter_advisor(chapter_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='assignments' and policyname='Advisor deletes assignments') then
    create policy "Advisor deletes assignments" on public.assignments
      for delete to authenticated using (public.is_chapter_advisor(chapter_id));
  end if;
end $$;

-- This project's tables are not auto-granted (see 0003); authenticated needs the
-- explicit grant or every insert fails "permission denied for table".
grant select, insert, update, delete on public.assignments to authenticated;

notify pgrst, 'reload schema';
