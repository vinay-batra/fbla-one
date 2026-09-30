-- Migration 0020: sync the mistake bank to the student's account
--
-- The mistake bank (lib/mistakes.ts) used to live only in one browser's
-- localStorage, so it did not follow a student from phone to laptop. Each row
-- here is one banked question for one student.
--
--   question_key   the app's stable id for the question (bankId: a hash of the
--                  question text and the correct answer's text)
--   data           the question itself: {question, options{A..D}, correct,
--                  explanation, topic}; size-capped and shape-checked
--   times_missed / times_right / last_right_test
--                  the clearing state (right in two different tests clears it)
--
-- Access: a student reads and writes only their own rows. Nobody else can see
-- them, including their chapter advisor (the readiness report uses
-- practice_logs.topic_results, not this table).
--
-- Idempotent: safe to re-run.

create table if not exists public.mistake_bank (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  competition_slug text not null check (competition_slug ~ '^[a-z0-9-]{1,100}$'),
  question_key text not null check (question_key ~ '^m[a-z0-9]{2,40}$'),
  data jsonb not null check (
    jsonb_typeof(data) = 'object'
    and octet_length(data::text) <= 8000
    and jsonb_typeof(data -> 'question') = 'string'
    and jsonb_typeof(data -> 'options') = 'object'
    and (data ->> 'correct') in ('A', 'B', 'C', 'D')
  ),
  times_missed int not null default 1 check (times_missed between 0 and 10000),
  times_right int not null default 0 check (times_right between 0 and 10000),
  last_right_test text check (last_right_test is null or char_length(last_right_test) <= 100),
  first_missed_at timestamptz not null default now(),
  last_missed_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (user_id, competition_slug, question_key)
);

create index if not exists mistake_bank_user_idx
  on public.mistake_bank (user_id, competition_slug);

alter table public.mistake_bank enable row level security;

drop policy if exists "Students manage own mistake bank" on public.mistake_bank;
create policy "Students manage own mistake bank" on public.mistake_bank
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on public.mistake_bank from anon, authenticated;
grant select, insert, update, delete on public.mistake_bank to authenticated;

notify pgrst, 'reload schema';
