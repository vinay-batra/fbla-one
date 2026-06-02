-- Migration 0006 - fix infinite recursion in chapter/advisor RLS
--
-- Migrations 0001/0004/0005 left mutually-recursive policies:
--   chapters."Members read own chapter"            -> subquery on profiles
--   profiles."Advisors read chapter member profiles" -> subquery on chapters
--   registrations / practice_logs advisor reads      -> join profiles + chapters
--   deadlines (members read / advisors manage)        -> subqueries on profiles/chapters
-- Postgres re-enters a relation's policies while still evaluating them and raises
-- "infinite recursion detected in policy for relation ...", which breaks chapter
-- creation AND the entire advisor dashboard (roster, activity, stats, leaderboard).
--
-- Fix: move every cross-table lookup into SECURITY DEFINER helper functions. They
-- run as the function owner and bypass RLS on the tables they read, so the policy
-- chain no longer loops. Behaviour is identical; only the recursion is removed.
-- Idempotent, safe to re-run.

-- ── Helper functions (SECURITY DEFINER -> bypass RLS -> no recursion) ──
create or replace function public.current_chapter_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select chapter_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_chapter_advisor(p_chapter uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.chapters
    where id = p_chapter and advisor_user_id = auth.uid()
  )
$$;

create or replace function public.advises_user(p_user uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.profiles p
    join public.chapters c on c.id = p.chapter_id
    where p.id = p_user and c.advisor_user_id = auth.uid()
  )
$$;

grant execute on function public.current_chapter_id() to authenticated;
grant execute on function public.is_chapter_advisor(uuid) to authenticated;
grant execute on function public.advises_user(uuid) to authenticated;

-- ── chapters: members read their own chapter ──
drop policy if exists "Members read own chapter" on public.chapters;
create policy "Members read own chapter" on public.chapters
  for select to authenticated using (id = public.current_chapter_id());

-- ── profiles: advisors read their chapter's member profiles ──
drop policy if exists "Advisors read chapter member profiles" on public.profiles;
create policy "Advisors read chapter member profiles" on public.profiles
  for select to authenticated using (public.is_chapter_advisor(chapter_id));

-- ── registrations: advisor reads member registrations ──
drop policy if exists "Chapter advisor reads member registrations" on public.registrations;
create policy "Chapter advisor reads member registrations" on public.registrations
  for select to authenticated using (public.advises_user(user_id));

-- ── practice_logs: advisor reads member practice logs (replaces 0005 version) ──
drop policy if exists "Advisors read chapter member practice logs" on public.practice_logs;
create policy "Advisors read chapter member practice logs" on public.practice_logs
  for select to authenticated using (public.advises_user(user_id));

-- ── deadlines: members read, advisors manage ──
drop policy if exists "Chapter members read deadlines" on public.deadlines;
create policy "Chapter members read deadlines" on public.deadlines
  for select to authenticated using (chapter_id = public.current_chapter_id());

drop policy if exists "Chapter advisors manage deadlines" on public.deadlines;
create policy "Chapter advisors manage deadlines" on public.deadlines
  for all to authenticated
  using (public.is_chapter_advisor(chapter_id))
  with check (public.is_chapter_advisor(chapter_id));

-- ── Harden: profiles UPDATE had no WITH CHECK (audit #3). Add it, plus a trigger
-- that blocks self-escalation to advisor/admin. (Validating chapter_id joins by
-- invite code is a larger follow-up - see CLAUDE.md "Next up".) ──
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.guard_profile_privilege()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role then
    if new.role = 'admin' then
      raise exception 'cannot self-assign admin role';
    end if;
    -- 'advisor' is only valid once you actually own a chapter (createChapter
    -- inserts the chapter first, then flips the profile role).
    if new.role = 'advisor' and not exists (
      select 1 from public.chapters where advisor_user_id = new.id
    ) then
      raise exception 'cannot self-assign advisor role without owning a chapter';
    end if;
  end if;
  return new;
end
$$;

drop trigger if exists guard_profile_privilege_trg on public.profiles;
create trigger guard_profile_privilege_trg
  before update on public.profiles
  for each row execute function public.guard_profile_privilege();

notify pgrst, 'reload schema';
