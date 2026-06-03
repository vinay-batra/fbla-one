-- Migration 0009 - bind feedback.user_id to the caller
--
-- 0008 created the insert policy with `with check (true)`, so a client could
-- insert a feedback row with ANY user_id (including another user's UUID) since
-- the client sends user_id itself. This tightens the check: anonymous inserts
-- must leave user_id null; authenticated inserts may only set their own uid.
-- Read isolation ("Users read own feedback") is unchanged. Idempotent.

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'feedback' and policyname = 'Anyone can submit feedback'
  ) then
    drop policy "Anyone can submit feedback" on public.feedback;
  end if;

  create policy "Anyone can submit feedback" on public.feedback
    for insert to anon, authenticated
    with check (user_id is null or user_id = auth.uid());
end $$;

notify pgrst, 'reload schema';
