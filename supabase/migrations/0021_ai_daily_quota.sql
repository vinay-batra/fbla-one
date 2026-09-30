-- 0021: daily AI usage caps that survive server restarts and are shared by
-- every serverless instance (the in-memory limiter in lib/rate-limit is per
-- instance and only covers bursts).
--
-- One row per identity per day per kind. The identity is "user:<uuid>" for a
-- signed-in account or "ip:<address>" for preview mode. The day is the calendar
-- day in US Eastern time, so every cap resets at midnight Eastern.
--
-- Nobody reads or writes the table directly. The server calls
-- consume_ai_quota() with the service role key; browsers cannot call it at all,
-- so a student cannot reset or inflate their own count. Idempotent.

create table if not exists public.ai_usage (
  key   text    not null,
  day   date    not null,
  kind  text    not null,
  used  integer not null default 0 check (used >= 0),
  primary key (key, day, kind)
);

alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;

-- Atomically adds p_amount to today's count if that stays within p_limit.
-- Returns how many are left after this use, or -1 when the request would go
-- over the cap (nothing is counted in that case).
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

-- Old rows are only useful for a few days of history.
create index if not exists ai_usage_day_idx on public.ai_usage (day);
