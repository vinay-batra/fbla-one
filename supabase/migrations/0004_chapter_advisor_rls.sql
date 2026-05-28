-- Migration 0004 - chapter advisor RLS policies
--
-- Adds two missing RLS policies required for the chapter advisor flow:
--
-- 1. Advisors can read profiles of all members in their chapter.
--    Needed so the advisor dashboard can show the member roster.
--
-- 2. Any authenticated user can SELECT from chapters.
--    Needed so the join-by-invite-code flow can look up a chapter
--    before the user has joined (the existing "Members read own chapter"
--    policy only works after the user's profile already has chapter_id set).
--
-- Idempotent, safe to re-run.

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='profiles'
    and policyname='Advisors read chapter member profiles'
  ) then
    create policy "Advisors read chapter member profiles" on public.profiles
      for select to authenticated using (
        chapter_id in (
          select id from public.chapters where advisor_user_id = auth.uid()
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='chapters'
    and policyname='Any authenticated user can read chapters'
  ) then
    create policy "Any authenticated user can read chapters" on public.chapters
      for select to authenticated using (true);
  end if;
end $$;

notify pgrst, 'reload schema';
