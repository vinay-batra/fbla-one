-- Migration 0002 — auto-create profile on sign-up + avatar support
-- Run in the Supabase SQL Editor. Idempotent — safe to re-run.

-- ── 1. Add avatar_url to profiles ─────────────────────────────────────────
alter table public.profiles
  add column if not exists avatar_url text;

-- ── 2. Auto-create a profile row when a user signs up ─────────────────────
-- Without this, every OAuth / email signup creates an auth.users row but
-- leaves public.profiles empty, so display names and avatars never persist.
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

-- ── 3. Storage bucket for avatars ─────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

-- Allow authenticated users to upload their own avatar
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects'
    and policyname='Users upload own avatar'
  ) then
    create policy "Users upload own avatar"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects'
    and policyname='Users update own avatar'
  ) then
    create policy "Users update own avatar"
    on storage.objects for update to authenticated
    using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects'
    and policyname='Avatar images are publicly readable'
  ) then
    create policy "Avatar images are publicly readable"
    on storage.objects for select to public
    using (bucket_id = 'avatars');
  end if;
end $$;

notify pgrst, 'reload schema';
