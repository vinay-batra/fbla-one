-- Migration 0007 - invite-validated chapter join + lock down chapters reads
--
-- Closes two linked privacy holes (audit #3 + #4):
--   1. chapters."Any authenticated user can read chapters" (using(true), from 0004)
--      exposed every chapter's invite_code/name/advisor to ALL signed-in users.
--   2. A user could self-join ANY chapter by directly setting profiles.chapter_id
--      (no invite needed) - confirmed by a live integration test.
--
-- Fix: chapter_id may now change ONLY inside the SECURITY DEFINER functions below
-- (enforced by a transaction-local flag the guard trigger checks). join_chapter_by_code
-- validates the invite server-side, so clients no longer need - or get - direct read
-- access to other chapters.
--
-- REQUIRES migration 0006 (helper functions + base guard trigger). Idempotent.

-- ── create_chapter: server-side chapter creation + advisor assignment ──
create or replace function public.create_chapter(p_name text)
returns public.chapters
language plpgsql security definer set search_path = public as $$
declare
  v_chapter public.chapters;
  v_code text;
  v_name text := nullif(btrim(p_name), '');
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if v_name is null then raise exception 'chapter name is required'; end if;

  -- Insert with a unique invite code (retry on the rare collision).
  for i in 1..5 loop
    v_code := upper(substr(md5(gen_random_uuid()::text), 1, 6));
    begin
      insert into public.chapters (name, invite_code, advisor_user_id)
        values (v_name, v_code, auth.uid())
        returning * into v_chapter;
      exit;
    exception when unique_violation then
      if i = 5 then raise; end if;
    end;
  end loop;

  perform set_config('app.allow_chapter_change', 'on', true);
  update public.profiles set chapter_id = v_chapter.id, role = 'advisor' where id = auth.uid();

  return v_chapter;
end;
$$;

-- ── join_chapter_by_code: validate the invite server-side, then join ──
create or replace function public.join_chapter_by_code(p_code text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_chapter_id uuid;
  v_code text := upper(btrim(coalesce(p_code, '')));
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if v_code = '' then raise exception 'invalid invite code'; end if;

  select id into v_chapter_id from public.chapters where invite_code = v_code;
  if v_chapter_id is null then
    raise exception 'invalid invite code';
  end if;

  perform set_config('app.allow_chapter_change', 'on', true);
  -- Advisors keep their role on their own chapter; everyone else joins as member.
  update public.profiles
     set chapter_id = v_chapter_id,
         role = case
                  when role = 'advisor'
                       and exists (select 1 from public.chapters c
                                   where c.id = v_chapter_id and c.advisor_user_id = auth.uid())
                  then 'advisor' else 'member' end
   where id = auth.uid();

  return v_chapter_id;
end;
$$;

grant execute on function public.create_chapter(text) to authenticated;
grant execute on function public.join_chapter_by_code(text) to authenticated;

-- ── Guard: chapter_id may only change via the functions above ──
create or replace function public.guard_profile_privilege()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Role-escalation guard (from migration 0006).
  if new.role is distinct from old.role then
    if new.role = 'admin' then
      raise exception 'cannot self-assign admin role';
    end if;
    if new.role = 'advisor' and not exists (
      select 1 from public.chapters where advisor_user_id = new.id
    ) then
      raise exception 'cannot self-assign advisor role without owning a chapter';
    end if;
  end if;

  -- chapter_id may only change inside create_chapter / join_chapter_by_code,
  -- which set this transaction-local flag. Direct client updates are blocked.
  if new.chapter_id is distinct from old.chapter_id
     and coalesce(current_setting('app.allow_chapter_change', true), 'off') <> 'on' then
    raise exception 'chapter_id can only be changed via join_chapter_by_code or create_chapter';
  end if;

  return new;
end;
$$;
-- The trigger guard_profile_privilege_trg was created in 0006; replacing the
-- function it calls (above) is sufficient.

-- ── Lock down chapters reads: drop the world-readable policy ──
-- Remaining SELECT access after this:
--   "Members read own chapter"   (id = public.current_chapter_id(), from 0006)
--   "Advisors manage own chapter" (advisor_user_id = auth.uid(), from 0001, FOR ALL)
drop policy if exists "Any authenticated user can read chapters" on public.chapters;

notify pgrst, 'reload schema';
