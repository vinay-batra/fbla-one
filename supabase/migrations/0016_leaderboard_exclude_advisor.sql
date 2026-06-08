-- Migration 0016 - keep advisors off the student leaderboard
--
-- 0011's get_chapter_leaderboard() returned every profile in the chapter,
-- including the advisor (who runs the chapter and does not compete). The
-- advisor showed up ranked at 0 tests. Recreate the function with a role
-- filter so only members appear. Idempotent (create or replace).

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
    and coalesce(p.role, 'member') <> 'advisor'
  group by p.id, p.display_name
  order by tests desc, last7 desc, p.display_name;
$$;

grant execute on function public.get_chapter_leaderboard() to authenticated;

notify pgrst, 'reload schema';
