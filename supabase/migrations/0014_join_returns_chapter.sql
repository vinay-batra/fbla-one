-- Migration 0014 - join_chapter_by_code returns the full chapter row
--
-- It previously returned just the chapter uuid, so the client did a second fetch
-- (getChapterById) to load the row. Return public.chapters directly and drop the
-- round-trip. Changing a function's return type needs drop + recreate. The client
-- tolerates BOTH the old (uuid) and new (row) shapes, so this is safe to apply at
-- any time. Idempotent.

drop function if exists public.join_chapter_by_code(text);

create function public.join_chapter_by_code(p_code text)
returns public.chapters
language plpgsql security definer set search_path = public as $$
declare
  v_chapter public.chapters;
  v_code text := upper(btrim(coalesce(p_code, '')));
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if v_code = '' then raise exception 'invalid invite code'; end if;

  select * into v_chapter from public.chapters where invite_code = v_code;
  if v_chapter.id is null then
    raise exception 'invalid invite code';
  end if;

  -- Authorise the chapter_id write for the guard trigger, then join. The chapter's
  -- own advisor keeps their advisor role; everyone else joins as a member.
  perform set_config('app.allow_chapter_change', 'on', true);
  update public.profiles
     set chapter_id = v_chapter.id,
         updated_at = now(),
         role = case
                  when role = 'advisor'
                       and exists (select 1 from public.chapters c
                                   where c.id = v_chapter.id and c.advisor_user_id = auth.uid())
                  then 'advisor' else 'member' end
   where id = auth.uid();
  perform set_config('app.allow_chapter_change', 'off', true);

  return v_chapter;
end;
$$;

revoke all on function public.join_chapter_by_code(text) from public;
grant execute on function public.join_chapter_by_code(text) to authenticated;

notify pgrst, 'reload schema';
