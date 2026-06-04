-- Migration 0013 - force role='member' on profile INSERT (close self-escalation)
--
-- guard_profile_privilege (0006/0007) runs only BEFORE UPDATE, and the profiles
-- INSERT policy checks `auth.uid() = id` but NOT `role`. So an authenticated user
-- could INSERT its own profile row with role='admin' or 'advisor' directly and
-- skip every elevation guard. Add a BEFORE INSERT trigger that always forces
-- role:='member'. Legitimate elevation still happens afterward via UPDATE inside
-- create_chapter / join_chapter_by_code (the UPDATE guard permits it once the
-- chapter exists). This also closes the "self-signed-up advisor with no chapter"
-- case. Idempotent.

create or replace function public.force_member_role_on_insert()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.role := 'member';
  return new;
end;
$$;

drop trigger if exists force_member_role_on_insert_trg on public.profiles;
create trigger force_member_role_on_insert_trg
  before insert on public.profiles
  for each row execute function public.force_member_role_on_insert();

notify pgrst, 'reload schema';
