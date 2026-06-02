-- Migration 0007 - invite-validated chapter join + lock down chapters reads
--
-- Closes two linked privacy holes (audit #3 + #4):
--   #3 chapters."Any authenticated user can read chapters" (using(true), from 0004)
--      exposed every chapter's invite_code/name/advisor to ALL signed-in users.
--   #4 A user could self-join ANY chapter by directly setting profiles.chapter_id
--      (no invite needed) - confirmed by a live integration test.
--
-- Fix: chapter_id may now change ONLY inside the SECURITY DEFINER functions below
-- (enforced by a transaction-local flag the guard trigger checks). join_chapter_by_code
-- validates the invite server-side, so clients no longer need - or get - direct read
-- access to other chapters.
--
-- The functions UPDATE the caller's existing profile row (created on sign-in by
-- ensureProfile() in lib/storage.ts, like every other profile write in the app).
--
-- REQUIRES migration 0006 first (helper functions current_chapter_id /
-- is_chapter_advisor + the guard_profile_privilege trigger). Idempotent: safe to re-run.

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

  -- Authorise the chapter_id write for the guard trigger, then link the profile.
  perform set_config('app.allow_chapter_change', 'on', true);
  update public.profiles
     set chapter_id = v_chapter.id, role = 'advisor', updated_at = now()
   where id = auth.uid();
  perform set_config('app.allow_chapter_change', 'off', true);

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

  -- Authorise the chapter_id write for the guard trigger, then join. The chapter's
  -- own advisor keeps their advisor role; everyone else joins as a member.
  perform set_config('app.allow_chapter_change', 'on', true);
  update public.profiles
     set chapter_id = v_chapter_id,
         updated_at = now(),
         role = case
                  when role = 'advisor'
                       and exists (select 1 from public.chapters c
                                   where c.id = v_chapter_id and c.advisor_user_id = auth.uid())
                  then 'advisor' else 'member' end
   where id = auth.uid();
  perform set_config('app.allow_chapter_change', 'off', true);

  return v_chapter_id;
end;
$$;

-- SECURITY DEFINER functions: deny PUBLIC (incl. anon) the default execute grant,
-- then allow only signed-in users. (They also guard with auth.uid() internally.)
revoke all on function public.create_chapter(text) from public;
revoke all on function public.join_chapter_by_code(text) from public;
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
  -- which set this transaction-local flag. Direct client updates are blocked
  -- (audit #4: self-join any chapter by writing chapter_id straight into profile).
  if new.chapter_id is distinct from old.chapter_id
     and coalesce(current_setting('app.allow_chapter_change', true), 'off') <> 'on' then
    raise exception 'chapter_id can only be changed via join_chapter_by_code or create_chapter';
  end if;

  return new;
end;
$$;

-- The trigger was created in 0006; recreate idempotently so the guard is active
-- even if this migration's function replacement is applied on its own.
drop trigger if exists guard_profile_privilege_trg on public.profiles;
create trigger guard_profile_privilege_trg
  before update on public.profiles
  for each row execute function public.guard_profile_privilege();

-- ── Lock down chapters reads (audit #3) ──
-- Drop the world-readable policy and state the surviving SELECT rule explicitly:
-- a chapter is readable only if it is YOUR chapter or one you advise. Both checks
-- use 0006's SECURITY DEFINER helpers, so there is no policy recursion. The join
-- path no longer needs a direct chapters read (join_chapter_by_code is DEFINER).
drop policy if exists "Any authenticated user can read chapters" on public.chapters;
drop policy if exists "Members read own chapter" on public.chapters;
create policy "Members read own chapter" on public.chapters
  for select to authenticated
  using (id = public.current_chapter_id() or public.is_chapter_advisor(id));

notify pgrst, 'reload schema';
