-- Migration 0017 - audit remediation (June 2026)
--
-- Consolidates the DB-side fixes from the v1.6 audit. Idempotent: safe to re-run.
-- Apply in the Supabase SQL editor. The app code is written to tolerate this
-- migration NOT yet being applied (best-effort email erasure / audit insert, and
-- the EmailCta RPC falls back to a direct insert when the RPC is absent), so code
-- and DB can deploy in either order.
--
-- Requires migrations 0006 + 0007 (helper functions + guard trigger) first.

-- ── PERF-4B-01: index profiles.chapter_id (four advisor queries filter on it) ──
create index if not exists idx_profiles_chapter_id
  on public.profiles (chapter_id)
  where chapter_id is not null;
-- Composite so the .neq('role','advisor') paths are index-covered too.
create index if not exists idx_profiles_chapter_role
  on public.profiles (chapter_id, role)
  where chapter_id is not null;

-- ── PERF-4B-02: index saved_resources.user_id (sign-in sync query) ──
create index if not exists idx_saved_resources_user_created
  on public.saved_resources (user_id, created_at desc);

-- ── SEC-AUTHZ-01: role may only ever be self-set to 'member' (or 'advisor' when
--    the user owns a chapter). 'officer'/'admin'/any future value are never
--    self-assignable. (The 0007 guard only blocked admin/advisor, leaving
--    'officer' freely self-writable.) chapter_id guard preserved verbatim. ──
create or replace function public.guard_profile_privilege()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role then
    if new.role = 'member' then
      null; -- always allowed (e.g. join_chapter_by_code demoting an old advisor)
    elsif new.role = 'advisor' then
      if not exists (select 1 from public.chapters where advisor_user_id = new.id) then
        raise exception 'cannot self-assign advisor role without owning a chapter';
      end if;
    else
      raise exception 'role % cannot be self-assigned', new.role; -- officer/admin/future
    end if;
  end if;

  if new.chapter_id is distinct from old.chapter_id
     and coalesce(current_setting('app.allow_chapter_change', true), 'off') <> 'on' then
    raise exception 'chapter_id can only be changed via join_chapter_by_code or create_chapter';
  end if;

  return new;
end;
$$;
drop trigger if exists guard_profile_privilege_trg on public.profiles;
create trigger guard_profile_privilege_trg
  before update on public.profiles
  for each row execute function public.guard_profile_privilege();

-- ── SEC-CRYPTO-01 (server): widen the invite code to 8 chars. Use gen_random_uuid
--    (core, in pg_catalog, CSPRNG) NOT gen_random_bytes (pgcrypto lives in the
--    `extensions` schema, off this function's search_path = public, so it would
--    raise "function gen_random_bytes does not exist" at call time). ──
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

  for i in 1..5 loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)); -- 8 hex chars, CSPRNG, no pgcrypto
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
  update public.profiles
     set chapter_id = v_chapter.id, role = 'advisor', updated_at = now()
   where id = auth.uid();
  perform set_config('app.allow_chapter_change', 'off', true);

  return v_chapter;
end;
$$;
revoke all on function public.create_chapter(text) from public;
grant execute on function public.create_chapter(text) to authenticated;

-- ── SEC-AUTHZ-04: throttle anon/auth feedback inserts (the one unauthenticated
--    write surface with no application rate limit). DB-only, no external store. ──
create or replace function public.throttle_feedback()
returns trigger language plpgsql security definer set search_path = public as $$
declare recent int;
begin
  if auth.uid() is not null then
    select count(*) into recent from public.feedback
      where user_id = auth.uid() and created_at > now() - interval '1 hour';
    if recent >= 20 then raise exception 'too many feedback submissions, slow down'; end if;
  else
    select count(*) into recent from public.feedback
      where user_id is null and created_at > now() - interval '1 minute';
    if recent >= 30 then raise exception 'feedback temporarily rate limited'; end if;
  end if;
  return new;
end $$;
drop trigger if exists throttle_feedback_trg on public.feedback;
create trigger throttle_feedback_trg before insert on public.feedback
  for each row execute function public.throttle_feedback();

-- ── AUDIT-LOG-01: minimal append-only audit table (service-role only). The
--    delete-account route writes an account.delete row best-effort. ──
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  target text,
  meta jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;

-- ── COMP-ERASURE-01: let the service role purge an email from the marketing list
--    during account deletion (email_signups is keyed on email, not user_id, so it
--    is not covered by the auth.users cascade). service_role bypasses RLS but
--    still needs the table grant (0003 granted only `authenticated`). ──
grant select, delete on public.email_signups to service_role;

-- ── SEC-AUTHZ-02: route email signups through an insert-or-ignore RPC that always
--    succeeds, so the 23505 unique-violation can no longer be observed to probe
--    list membership. Then revoke the direct INSERT path. The client tries the
--    RPC first and only falls back to a direct insert when the RPC is absent, so
--    this is safe to apply independently of the deploy. ──
create or replace function public.join_email_list(p_email text, p_source text default 'landing')
returns void
language plpgsql security definer set search_path = public as $$
declare e text := lower(btrim(coalesce(p_email, '')));
begin
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return; end if; -- silently ignore junk
  insert into public.email_signups (email, source) values (e, p_source)
  on conflict (email) do nothing; -- no error surfaces either way
end $$;
revoke all on function public.join_email_list(text, text) from public;
grant execute on function public.join_email_list(text, text) to anon, authenticated;
-- Remove the directly-observable insert path now that the RPC exists.
revoke insert on public.email_signups from anon, authenticated;

notify pgrst, 'reload schema';
