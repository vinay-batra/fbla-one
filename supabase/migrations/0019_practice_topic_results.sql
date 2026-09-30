-- Migration 0019: per-topic results on practice logs (advisor readiness report)
--
-- Weak topics used to live only in each student's browser (localStorage
-- fbla_topic_stats), so an advisor could never see them. This adds an optional
-- tally to every practice log:
--
--   topic_results jsonb, e.g. [{"topic":"Budgeting","correct":1,"total":2}]
--
--   * AI practice test rows: questions right / questions asked, per topic. The
--     advisor readiness report sums these per member to find weakest topics.
--   * AI Judge rows (notes start with "AI Judge:"): rating-sheet points earned
--     / points possible per criterion (total 10). The report never mixes these
--     into weak topics; they are kept so a round's sheet can be read back.
--   * Manual tracker rows and every row written before this migration: null.
--
-- Access: nothing new. The column rides on the existing practice_logs row
-- policies: "Users manage own practice logs" (a member reads and writes only
-- their own rows) and "Advisors read chapter member practice logs" (0006,
-- advises_user(user_id): an advisor reads rows of members of the chapter they
-- advise, never another chapter's). Table-level grants from 0003 cover new
-- columns, so no column grant is needed.
--
-- Shape and size are enforced by a check constraint, because this is
-- client-written data that another user (the advisor) renders:
--   array of at most 40 objects, at most 6000 bytes as text; each object has a
--   topic string of 1 to 120 characters and whole numbers with
--   0 <= correct <= total, 1 <= total <= 1000.
--
-- The app tolerates this migration NOT being applied (it retries reads and
-- writes without the column and shows no weak topics), so code and DB can
-- deploy in either order. Idempotent: safe to re-run.

alter table public.practice_logs
  add column if not exists topic_results jsonb;

-- Validator for the check constraint. IMMUTABLE (depends only on its input) so
-- Postgres accepts it in a constraint. CASE forces evaluation order: nothing
-- below a branch runs unless the branches above it passed, so a wrong type is
-- rejected (returns false) instead of raising a cast error.
create or replace function public.practice_topic_results_valid(p jsonb)
returns boolean
language sql
immutable
set search_path = public
as $$
  select case
    when p is null then true
    when jsonb_typeof(p) <> 'array' then false
    when jsonb_array_length(p) > 40 then false
    when octet_length(p::text) > 6000 then false
    else not exists (
      select 1
      from jsonb_array_elements(p) as e(item)
      where case
        when jsonb_typeof(e.item) <> 'object' then true
        when jsonb_typeof(e.item -> 'topic') is distinct from 'string' then true
        when char_length(e.item ->> 'topic') not between 1 and 120 then true
        when jsonb_typeof(e.item -> 'correct') is distinct from 'number' then true
        when jsonb_typeof(e.item -> 'total') is distinct from 'number' then true
        when (e.item ->> 'correct')::numeric <> trunc((e.item ->> 'correct')::numeric) then true
        when (e.item ->> 'total')::numeric <> trunc((e.item ->> 'total')::numeric) then true
        when (e.item ->> 'total')::numeric not between 1 and 1000 then true
        when (e.item ->> 'correct')::numeric < 0 then true
        when (e.item ->> 'correct')::numeric > (e.item ->> 'total')::numeric then true
        else false
      end
    )
  end
$$;

grant execute on function public.practice_topic_results_valid(jsonb) to authenticated;

alter table public.practice_logs
  drop constraint if exists practice_logs_topic_results_valid;
alter table public.practice_logs
  add constraint practice_logs_topic_results_valid
  check (public.practice_topic_results_valid(topic_results));

notify pgrst, 'reload schema';
