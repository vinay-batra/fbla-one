-- Migration 0005 - advisors read chapter member practice logs
--
-- Lets a chapter advisor SELECT the practice_logs of every member in their
-- chapter. Required by the advisor activity feed + chapter stats / leaderboard
-- (lib/chapter.ts getChapterActivity / getChapterStats). Members still only
-- see their own logs via the "Users manage own practice logs" policy.
--
-- This policy was applied directly to the live DB in an earlier session but
-- never committed as a file, so the repo could not reproduce production.
-- Idempotent, safe to re-run.

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='practice_logs'
    and policyname='Advisors read chapter member practice logs'
  ) then
    create policy "Advisors read chapter member practice logs" on public.practice_logs
      for select to authenticated using (
        user_id in (
          select p.id from public.profiles p
          join public.chapters c on c.id = p.chapter_id
          where c.advisor_user_id = auth.uid()
        )
      );
  end if;
end $$;

notify pgrst, 'reload schema';
