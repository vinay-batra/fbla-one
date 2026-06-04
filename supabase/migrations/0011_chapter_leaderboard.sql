-- Migration 0011 - student-visible chapter leaderboard
--
-- Members cannot read each other's practice_logs under RLS (only advisors can,
-- via 0005). To let every student see a friendly-competition leaderboard WITHOUT
-- leaking anyone's raw scores, expose only AGGREGATES through a SECURITY DEFINER
-- function scoped to the caller's own chapter. It ranks by practice volume
-- (effort), not accuracy, so it motivates rather than shames. Idempotent.

create or replace function public.get_chapter_leaderboard()
returns table (user_id uuid, display_name text, tests bigint, last7 bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.display_name,
    count(pl.id) as tests,
    count(pl.id) filter (where pl.logged_at >= now() - interval '7 days') as last7
  from public.profiles p
  left join public.practice_logs pl on pl.user_id = p.id
  where public.current_chapter_id() is not null
    and p.chapter_id = public.current_chapter_id()
  group by p.id, p.display_name
  order by tests desc, last7 desc, p.display_name;
$$;

grant execute on function public.get_chapter_leaderboard() to authenticated;

notify pgrst, 'reload schema';
