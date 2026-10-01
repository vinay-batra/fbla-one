-- 0022: limits from the October 2026 audit. Idempotent; safe to run twice.
--
-- 1. AI usage counters (0021) are only needed for today's caps. Rows keyed by
--    "ip:<address>" are personal data, so keep a week and then delete them.
-- 2. Length and range limits on what students type. React escapes it on screen,
--    but without limits one account could store megabytes in a display name
--    that lands on an advisor's roster, or a 170% score that skews averages.
--    NOT VALID: enforced for every new or edited row, without failing on
--    anything already stored.
-- 3. A daily cap on practice logs per account, so nobody can script thousands
--    of fake logs to top the chapter leaderboard (it ranks by practice count).

-- ── 1. Usage counter cleanup ─────────────────────────────────
create or replace function public.consume_ai_quota(
  p_key text,
  p_kind text,
  p_amount integer,
  p_limit integer
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day  date := (now() at time zone 'America/New_York')::date;
  v_used integer;
begin
  if p_key is null or p_kind is null or p_amount is null or p_limit is null
     or p_amount < 1 or p_limit < 0 then
    raise exception 'consume_ai_quota: invalid arguments';
  end if;

  -- About one call in fifty sweeps out counters older than a week.
  if random() < 0.02 then
    delete from public.ai_usage where day < v_day - 7;
  end if;

  insert into public.ai_usage (key, day, kind, used)
  values (p_key, v_day, p_kind, 0)
  on conflict (key, day, kind) do nothing;

  update public.ai_usage
     set used = used + p_amount
   where key = p_key and day = v_day and kind = p_kind
     and used + p_amount <= p_limit
  returning used into v_used;

  if v_used is null then
    return -1;
  end if;
  return p_limit - v_used;
end;
$$;

revoke all on function public.consume_ai_quota(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(text, text, integer, integer) to service_role;

delete from public.ai_usage where day < (now() at time zone 'America/New_York')::date - 7;

-- ── 2. Length and range limits ───────────────────────────────
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_display_name_len') then
    alter table public.profiles
      add constraint profiles_display_name_len check (display_name is null or char_length(display_name) <= 80) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'registrations_notes_len') then
    alter table public.registrations
      add constraint registrations_notes_len check (notes is null or char_length(notes) <= 1000) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'practice_logs_sane') then
    alter table public.practice_logs
      add constraint practice_logs_sane check (
        (score is null or score >= 0)
        and (out_of is null or out_of between 1 and 10000)
        and (score is null or out_of is null or score <= out_of)
        and (duration_min is null or duration_min between 0 and 1440)
        and (notes is null or char_length(notes) <= 4000)
      ) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'saved_resources_len') then
    alter table public.saved_resources
      add constraint saved_resources_len check (
        char_length(title) <= 300
        and char_length(url) <= 2000
        and (note is null or char_length(note) <= 1000)
      ) not valid;
  end if;
end $$;

-- ── 3. Daily cap on practice logs ────────────────────────────
-- 300 a day is far beyond real practice (a 100-question simulation is one log).
create or replace function public.practice_logs_daily_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.practice_logs
       where user_id = new.user_id and logged_at > now() - interval '1 day') >= 300 then
    raise exception 'Daily practice log limit reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists practice_logs_daily_cap on public.practice_logs;
create trigger practice_logs_daily_cap
  before insert on public.practice_logs
  for each row execute function public.practice_logs_daily_cap();
