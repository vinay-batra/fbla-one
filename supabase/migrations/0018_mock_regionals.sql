-- Migration 0018: Mock Regionals, a live chapter-wide test for chapter meetings
--
-- An advisor hosts a timed test for their chapter: the session is created in a
-- lobby with a 6-character join code, members join, the advisor starts it, and
-- every member takes the same questions against the same server-side clock.
--
-- Tables:
--   mock_sessions      one row per hosted test (questions + answer key live here)
--   mock_participants  one row per member per session (answers + server-computed score)
--
-- Answer-key protection (the important part):
--   * mock_sessions.questions holds the answer key. authenticated gets a
--     COLUMN-LEVEL select grant that leaves `questions` out, so no chapter member
--     can read it (or filter on it) through PostgREST, even with RLS allowing the row.
--   * Members get the paper through mock_get_paper(), a SECURITY DEFINER RPC that
--     returns only question text + options (no correct, explanation or calc), and
--     only once the session is live.
--   * The key (with explanations) is released by mock_review() only after the
--     session is over, so a student who finished early cannot pass answers on.
--   * score / submitted_at are never client-writable (no column grant, plus a
--     guard trigger). mock_submit() grades the submitted answers against the
--     stored key server-side. A student cannot post a fake score.
--   * Peers' answers are hidden too (answers is left out of the participants
--     select grant), so nobody can copy a classmate who submitted first.
--
-- Clients must name columns explicitly (select=* would hit the missing column
-- grant and fail). Every cross-table lookup in a policy goes through a SECURITY
-- DEFINER helper, like 0006, so there is no policy recursion.
--
-- Requires 0006 (current_chapter_id, is_chapter_advisor). Idempotent: safe to re-run.
-- No pgcrypto anywhere: codes come from gen_random_uuid() (core), per CLAUDE.md.

-- ── Tables ──────────────────────────────────────────────────────────────────

create table if not exists public.mock_sessions (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  host_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z2-9]{6}$'),
  event_slug text not null check (event_slug ~ '^[a-z0-9-]{1,100}$'),
  question_count int not null check (question_count between 1 and 50),
  questions jsonb not null default '[]'::jsonb check (jsonb_typeof(questions) = 'array'),
  duration_sec int not null check (duration_sec between 60 and 7200),
  status text not null default 'lobby' check (status in ('lobby', 'live', 'ended')),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ends_at timestamptz,
  ended_at timestamptz
);

create index if not exists mock_sessions_chapter_idx
  on public.mock_sessions (chapter_id, created_at desc);

create table if not exists public.mock_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.mock_sessions(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  display_name text not null default 'Member' check (char_length(display_name) between 1 and 60),
  answers jsonb not null default '{}'::jsonb
    check (jsonb_typeof(answers) = 'object' and octet_length(answers::text) <= 4000),
  score int check (score is null or score >= 0),
  submitted_at timestamptz,
  joined_at timestamptz not null default now(),
  unique (session_id, user_id)
);

create index if not exists mock_participants_session_idx
  on public.mock_participants (session_id);

alter table public.mock_sessions enable row level security;
alter table public.mock_participants enable row level security;

-- ── Helpers (SECURITY DEFINER so policies never recurse) ────────────────────

create or replace function public.mock_session_chapter(p_session uuid)
returns uuid
language sql stable security definer set search_path = public as $$
  select chapter_id from public.mock_sessions where id = p_session
$$;

-- Joinable: lobby, or live and the clock has not run out.
create or replace function public.mock_session_joinable(p_session uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.mock_sessions
    where id = p_session
      and (status = 'lobby' or (status = 'live' and now() < ends_at))
  )
$$;

-- Open for answering: live and before ends_at.
create or replace function public.mock_session_open(p_session uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.mock_sessions
    where id = p_session and status = 'live' and now() < ends_at
  )
$$;

create or replace function public.mock_session_in_lobby(p_session uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.mock_sessions where id = p_session and status = 'lobby')
$$;

-- Count of answers that match the key. answers is {"0":"B","1":"D",...} keyed
-- by zero-based question index. Pure function, no table access.
create or replace function public.mock_grade(p_questions jsonb, p_answers jsonb)
returns int
language sql immutable set search_path = public as $$
  select count(*)::int
  from jsonb_array_elements(p_questions) with ordinality as q(val, ord)
  where coalesce(p_answers ->> (q.ord - 1)::text, '') = coalesce(q.val ->> 'correct', '-')
$$;

revoke all on function public.mock_session_chapter(uuid) from public;
revoke all on function public.mock_session_joinable(uuid) from public;
revoke all on function public.mock_session_open(uuid) from public;
revoke all on function public.mock_session_in_lobby(uuid) from public;
revoke all on function public.mock_grade(jsonb, jsonb) from public;
grant execute on function public.mock_session_chapter(uuid) to authenticated;
grant execute on function public.mock_session_joinable(uuid) to authenticated;
grant execute on function public.mock_session_open(uuid) to authenticated;
grant execute on function public.mock_session_in_lobby(uuid) to authenticated;

-- ── RLS: mock_sessions ──────────────────────────────────────────────────────
-- Chapter members (and the advisor) read their chapter's sessions. Only the
-- chapter's advisor creates, updates (start / end) or deletes them. The app path
-- for create / start / end is the RPCs below, which apply the same check.

drop policy if exists "Chapter reads mock sessions" on public.mock_sessions;
create policy "Chapter reads mock sessions" on public.mock_sessions
  for select to authenticated
  using (chapter_id = public.current_chapter_id() or public.is_chapter_advisor(chapter_id));

drop policy if exists "Advisor creates mock sessions" on public.mock_sessions;
create policy "Advisor creates mock sessions" on public.mock_sessions
  for insert to authenticated
  with check (public.is_chapter_advisor(chapter_id) and host_id = auth.uid());

drop policy if exists "Advisor updates mock sessions" on public.mock_sessions;
create policy "Advisor updates mock sessions" on public.mock_sessions
  for update to authenticated
  using (public.is_chapter_advisor(chapter_id))
  with check (public.is_chapter_advisor(chapter_id));

drop policy if exists "Advisor deletes mock sessions" on public.mock_sessions;
create policy "Advisor deletes mock sessions" on public.mock_sessions
  for delete to authenticated
  using (public.is_chapter_advisor(chapter_id));

-- ── RLS: mock_participants ──────────────────────────────────────────────────

drop policy if exists "Chapter reads mock participants" on public.mock_participants;
create policy "Chapter reads mock participants" on public.mock_participants
  for select to authenticated
  using (
    public.mock_session_chapter(session_id) = public.current_chapter_id()
    or public.is_chapter_advisor(public.mock_session_chapter(session_id))
  );

-- A member joins only their own chapter's session, only as themselves, only
-- while it is joinable (lobby, or live before ends_at). The advisor hosts and
-- does not compete (same rule as the leaderboard in 0016).
drop policy if exists "Member joins mock session" on public.mock_participants;
create policy "Member joins mock session" on public.mock_participants
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.mock_session_chapter(session_id) = public.current_chapter_id()
    and not public.is_chapter_advisor(public.mock_session_chapter(session_id))
    and public.mock_session_joinable(session_id)
  );

-- Draft autosave: own row, not yet submitted, session live and before ends_at.
drop policy if exists "Member updates own mock answers" on public.mock_participants;
create policy "Member updates own mock answers" on public.mock_participants
  for update to authenticated
  using (user_id = auth.uid() and submitted_at is null and public.mock_session_open(session_id))
  with check (user_id = auth.uid() and submitted_at is null and public.mock_session_open(session_id));

-- A member may leave while still in the lobby; the advisor may remove anyone.
drop policy if exists "Leave or remove mock participant" on public.mock_participants;
create policy "Leave or remove mock participant" on public.mock_participants
  for delete to authenticated
  using (
    (user_id = auth.uid() and public.mock_session_in_lobby(session_id))
    or public.is_chapter_advisor(public.mock_session_chapter(session_id))
  );

-- ── Guard trigger: server decides identity, name and grading fields ─────────

-- The caller's own display name (profile name, else email local part). Scoped
-- to auth.uid(), so it cannot be used to look up anyone else.
create or replace function public.mock_my_display_name()
returns text
language sql stable security definer set search_path = public as $$
  select left(coalesce(
           (select coalesce(nullif(btrim(p.display_name), ''),
                            nullif(split_part(coalesce(p.email, ''), '@', 1), ''))
              from public.profiles p where p.id = auth.uid()),
           'Member'), 60)
$$;
revoke all on function public.mock_my_display_name() from public;
grant execute on function public.mock_my_display_name() to authenticated;

-- SECURITY INVOKER on purpose: current_user must be the real caller, so a direct
-- client UPDATE (current_user = authenticated) is told apart from the grading
-- RPCs (which run as the function owner).
create or replace function public.mock_participant_guard()
returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.user_id := auth.uid();
      -- Name comes from the profile, so nobody can join as "Mr. Smith".
      new.display_name := coalesce(public.mock_my_display_name(), 'Member');
    end if;
    new.answers := '{}'::jsonb;
    new.score := null;
    new.submitted_at := null;
    new.joined_at := now();
    return new;
  end if;

  -- UPDATE from a client role: only answers may change.
  if current_user in ('authenticated', 'anon') then
    if new.score is distinct from old.score
       or new.submitted_at is distinct from old.submitted_at
       or new.user_id is distinct from old.user_id
       or new.session_id is distinct from old.session_id
       or new.display_name is distinct from old.display_name
       or new.joined_at is distinct from old.joined_at then
      raise exception 'only answers can be changed directly';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists mock_participant_guard_trg on public.mock_participants;
create trigger mock_participant_guard_trg
  before insert or update on public.mock_participants
  for each row execute function public.mock_participant_guard();

-- ── Grants (raw tables are not auto-granted here, see CLAUDE.md) ────────────
-- Start from nothing, then grant exactly what the app needs. The `questions`
-- column and the `answers` column are deliberately left out of SELECT.

revoke all on public.mock_sessions from anon, authenticated;
revoke all on public.mock_participants from anon, authenticated;

grant select (id, chapter_id, host_id, code, event_slug, question_count, duration_sec,
              status, created_at, started_at, ends_at, ended_at)
  on public.mock_sessions to authenticated;
grant insert, update, delete on public.mock_sessions to authenticated;

grant select (id, session_id, user_id, display_name, score, submitted_at, joined_at)
  on public.mock_participants to authenticated;
grant insert (session_id, user_id) on public.mock_participants to authenticated;
grant update (answers) on public.mock_participants to authenticated;
grant delete on public.mock_participants to authenticated;

-- ── RPC: server clock ───────────────────────────────────────────────────────
-- Clients compute their offset from this so every countdown agrees with ends_at.

create or replace function public.mock_server_time()
returns timestamptz
language sql stable set search_path = public as $$
  select now()
$$;

-- ── RPC: create a session (advisor) ─────────────────────────────────────────

create or replace function public.mock_create_session(
  p_event_slug text,
  p_questions jsonb,
  p_duration_sec int
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_alpha constant text := 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
  v_chapter uuid := public.current_chapter_id();
  v_clean jsonb := '[]'::jsonb;
  v_q jsonb;
  v_hex text;
  v_code text;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if v_chapter is null or not public.is_chapter_advisor(v_chapter) then
    raise exception 'only the chapter advisor can host a mock regionals';
  end if;
  if coalesce(p_event_slug, '') !~ '^[a-z0-9-]{1,100}$' then
    raise exception 'invalid event';
  end if;
  if p_duration_sec is null or p_duration_sec < 60 or p_duration_sec > 7200 then
    raise exception 'time limit must be between 1 and 120 minutes';
  end if;
  if jsonb_typeof(p_questions) is distinct from 'array'
     or jsonb_array_length(p_questions) < 1
     or jsonb_array_length(p_questions) > 50 then
    raise exception 'a session needs between 1 and 50 questions';
  end if;

  -- Validate and normalise every question; drop anything unexpected (calc etc).
  for v_q in select value from jsonb_array_elements(p_questions) loop
    if jsonb_typeof(v_q) is distinct from 'object'
       or coalesce(btrim(v_q ->> 'question'), '') = ''
       or jsonb_typeof(v_q -> 'options') is distinct from 'object'
       or coalesce(btrim(v_q -> 'options' ->> 'A'), '') = ''
       or coalesce(btrim(v_q -> 'options' ->> 'B'), '') = ''
       or coalesce(btrim(v_q -> 'options' ->> 'C'), '') = ''
       or coalesce(btrim(v_q -> 'options' ->> 'D'), '') = ''
       or coalesce(v_q ->> 'correct', '') not in ('A', 'B', 'C', 'D') then
      raise exception 'malformed question';
    end if;
    v_clean := v_clean || jsonb_build_array(jsonb_build_object(
      'question', left(v_q ->> 'question', 2000),
      'options', jsonb_build_object(
        'A', left(v_q -> 'options' ->> 'A', 600),
        'B', left(v_q -> 'options' ->> 'B', 600),
        'C', left(v_q -> 'options' ->> 'C', 600),
        'D', left(v_q -> 'options' ->> 'D', 600)),
      'correct', v_q ->> 'correct',
      'explanation', left(coalesce(v_q ->> 'explanation', ''), 3000),
      'topic', left(coalesce(v_q ->> 'topic', ''), 200)
    ));
  end loop;

  -- 6-character code from a CSPRNG uuid (core gen_random_uuid, not pgcrypto),
  -- in an alphabet with no I/O/0/1. Only the first 12 hex digits are used: they
  -- are fully random (the uuid version nibble sits later). Retry on collision.
  for attempt in 1..8 loop
    v_hex := replace(gen_random_uuid()::text, '-', '');
    v_code := '';
    for i in 0..5 loop
      v_code := v_code || substr(v_alpha, 1 + (('x' || substr(v_hex, 1 + i * 2, 2))::bit(8)::int % 30), 1);
    end loop;
    begin
      insert into public.mock_sessions
        (chapter_id, host_id, code, event_slug, question_count, questions, duration_sec)
      values
        (v_chapter, auth.uid(), v_code, p_event_slug, jsonb_array_length(v_clean), v_clean, p_duration_sec)
      returning id into v_id;
      exit;
    exception when unique_violation then
      if attempt = 8 then raise; end if;
    end;
  end loop;

  return jsonb_build_object('id', v_id, 'code', v_code);
end;
$$;

-- ── RPC: start (advisor). The server clock sets started_at and ends_at. ─────

create or replace function public.mock_start_session(p_session uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  s public.mock_sessions;
begin
  select * into s from public.mock_sessions where id = p_session for update;
  if not found or not public.is_chapter_advisor(s.chapter_id) then
    raise exception 'only the chapter advisor can start this session';
  end if;
  if s.status <> 'lobby' then raise exception 'session already started'; end if;

  update public.mock_sessions
     set status = 'live',
         started_at = now(),
         ends_at = now() + make_interval(secs => s.duration_sec)
   where id = p_session
   returning * into s;

  return jsonb_build_object('started_at', s.started_at, 'ends_at', s.ends_at, 'server_now', now());
end;
$$;

-- ── RPC: end (advisor). Grades every unsubmitted draft; pencils down. ───────

create or replace function public.mock_end_session(p_session uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  s public.mock_sessions;
  v_end timestamptz;
begin
  select * into s from public.mock_sessions where id = p_session for update;
  if not found or not public.is_chapter_advisor(s.chapter_id) then
    raise exception 'only the chapter advisor can end this session';
  end if;
  if s.status = 'ended' then return; end if;

  if s.status = 'live' then
    v_end := least(now(), s.ends_at);
    -- Whatever a student had autosaved when time was called is what they turn in.
    update public.mock_participants
       set score = public.mock_grade(s.questions, answers),
           submitted_at = v_end
     where session_id = p_session and submitted_at is null;
    update public.mock_sessions
       set status = 'ended', ends_at = v_end, ended_at = now()
     where id = p_session;
  else
    -- Cancelled from the lobby: nothing to grade.
    update public.mock_sessions
       set status = 'ended', ended_at = now()
     where id = p_session;
  end if;
end;
$$;

-- ── RPC: the student's paper, without the answer key ────────────────────────

create or replace function public.mock_get_paper(p_session uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  s public.mock_sessions;
  p public.mock_participants;
  v_questions jsonb := '[]'::jsonb;
begin
  select * into s from public.mock_sessions where id = p_session;
  if not found
     or not (s.chapter_id = public.current_chapter_id() or public.is_chapter_advisor(s.chapter_id)) then
    raise exception 'session not found';
  end if;

  select * into p from public.mock_participants
   where session_id = p_session and user_id = auth.uid();

  if s.status in ('live', 'ended') then
    select coalesce(jsonb_agg(jsonb_build_object(
             'question', q.val -> 'question',
             'options', q.val -> 'options') order by q.ord), '[]'::jsonb)
      into v_questions
      from jsonb_array_elements(s.questions) with ordinality as q(val, ord);
  end if;

  return jsonb_build_object(
    'status', s.status,
    'ends_at', s.ends_at,
    'server_now', now(),
    'questions', v_questions,
    'joined', p.id is not null,
    'my_answers', coalesce(p.answers, '{}'::jsonb),
    'submitted', p.submitted_at is not null
  );
end;
$$;

-- ── RPC: submit (student). Grades against the stored key. ──────────────────
-- A 10 second grace after ends_at absorbs the auto-submit fired at 0:00.

create or replace function public.mock_submit(p_session uuid, p_answers jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  s public.mock_sessions;
  p public.mock_participants;
  v_clean jsonb;
  v_score int;
  v_n int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into s from public.mock_sessions where id = p_session;
  if not found or s.chapter_id is distinct from public.current_chapter_id() then
    raise exception 'session not found';
  end if;
  if s.status <> 'live' or now() > s.ends_at + interval '10 seconds' then
    raise exception 'this session is not accepting answers';
  end if;

  select * into p from public.mock_participants
   where session_id = p_session and user_id = auth.uid()
   for update;
  if not found then raise exception 'join the session before submitting'; end if;
  if p.submitted_at is not null then raise exception 'already submitted'; end if;

  v_n := jsonb_array_length(s.questions);
  select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
    into v_clean
    from jsonb_each_text(case when jsonb_typeof(p_answers) = 'object' then p_answers else '{}'::jsonb end) as e
   where e.key ~ '^[0-9]{1,2}$'
     and e.key::int < v_n
     and e.value in ('A', 'B', 'C', 'D');

  v_score := public.mock_grade(s.questions, v_clean);

  update public.mock_participants
     set answers = v_clean,
         score = v_score,
         submitted_at = least(now(), s.ends_at)
   where id = p.id;

  return jsonb_build_object('score', v_score, 'total', v_n);
end;
$$;

-- ── RPC: review (answer key + explanations), only once the session is over ──
-- The host may read the key at any time (for the projector's hardest question).

create or replace function public.mock_review(p_session uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  s public.mock_sessions;
  p public.mock_participants;
  v_is_host boolean;
begin
  select * into s from public.mock_sessions where id = p_session;
  if not found
     or not (s.chapter_id = public.current_chapter_id() or public.is_chapter_advisor(s.chapter_id)) then
    raise exception 'session not found';
  end if;
  v_is_host := public.is_chapter_advisor(s.chapter_id);
  if not v_is_host
     and not (s.status = 'ended' or (s.status = 'live' and now() > s.ends_at + interval '10 seconds')) then
    raise exception 'answers are released when time is called';
  end if;

  select * into p from public.mock_participants
   where session_id = p_session and user_id = auth.uid();

  return jsonb_build_object(
    'questions', s.questions,
    'my_answers', coalesce(p.answers, '{}'::jsonb),
    'my_score', p.score,
    'submitted', p.submitted_at is not null
  );
end;
$$;

-- ── RPC: per-question stats (hardest question) ──────────────────────────────

create or replace function public.mock_question_stats(p_session uuid)
returns table (q_index int, correct_count int, answered_count int, graded_count int)
language plpgsql stable security definer set search_path = public as $$
declare
  s public.mock_sessions;
begin
  select * into s from public.mock_sessions where id = p_session;
  if not found
     or not (s.chapter_id = public.current_chapter_id() or public.is_chapter_advisor(s.chapter_id)) then
    raise exception 'session not found';
  end if;
  if not public.is_chapter_advisor(s.chapter_id)
     and not (s.status = 'ended' or (s.status = 'live' and now() > s.ends_at + interval '10 seconds')) then
    raise exception 'results are released when time is called';
  end if;

  return query
    select (q.ord - 1)::int,
           (count(*) filter (where pt.answers ->> (q.ord - 1)::text = q.val ->> 'correct'))::int,
           (count(*) filter (where pt.answers ? (q.ord - 1)::text))::int,
           count(*)::int
      from jsonb_array_elements(s.questions) with ordinality as q(val, ord)
      cross join (
        select mp.answers from public.mock_participants mp
         where mp.session_id = p_session and mp.submitted_at is not null
      ) pt
     group by q.ord
     order by q.ord;
end;
$$;

revoke all on function public.mock_server_time() from public;
revoke all on function public.mock_create_session(text, jsonb, int) from public;
revoke all on function public.mock_start_session(uuid) from public;
revoke all on function public.mock_end_session(uuid) from public;
revoke all on function public.mock_get_paper(uuid) from public;
revoke all on function public.mock_submit(uuid, jsonb) from public;
revoke all on function public.mock_review(uuid) from public;
revoke all on function public.mock_question_stats(uuid) from public;
grant execute on function public.mock_server_time() to authenticated;
grant execute on function public.mock_create_session(text, jsonb, int) to authenticated;
grant execute on function public.mock_start_session(uuid) to authenticated;
grant execute on function public.mock_end_session(uuid) to authenticated;
grant execute on function public.mock_get_paper(uuid) to authenticated;
grant execute on function public.mock_submit(uuid, jsonb) to authenticated;
grant execute on function public.mock_review(uuid) to authenticated;
grant execute on function public.mock_question_stats(uuid) to authenticated;

notify pgrst, 'reload schema';
