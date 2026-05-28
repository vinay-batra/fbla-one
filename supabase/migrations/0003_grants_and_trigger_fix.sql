-- Migration 0003 — fix table grants + profile trigger
--
-- The public.* tables were created without GRANTing privileges to the API
-- roles, so every authenticated insert/select failed with "permission denied
-- for table". RLS was enabled but never reached, because the role-level GRANT
-- is checked first. This restores the Supabase-standard grants.
-- Idempotent, safe to re-run.

-- 1. Grant schema + table + sequence privileges to the authenticated role.
--    RLS policies still govern which ROWS each user can touch.
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Future tables/sequences inherit these grants automatically.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;

-- 2. Re-create the new-user profile trigger (idempotent).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Backfill profiles for any users who signed up before the trigger worked.
insert into public.profiles (id, email, display_name)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

notify pgrst, 'reload schema';
