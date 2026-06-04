-- Migration 0012 - bound feedback row size (anon-writable table hardening)
--
-- The feedback insert policy allows anon writes (the FeedbackButton posts via the
-- anon Supabase client). Cap message/type/page lengths at the DB so a script
-- cannot store arbitrarily large rows. The client textarea also enforces
-- maxLength=4000. Idempotent (drops the constraints first so re-running is safe).

alter table public.feedback drop constraint if exists feedback_message_len;
alter table public.feedback drop constraint if exists feedback_type_len;
alter table public.feedback drop constraint if exists feedback_page_len;

alter table public.feedback add constraint feedback_message_len check (char_length(message) <= 4000);
alter table public.feedback add constraint feedback_type_len check (type is null or char_length(type) <= 40);
alter table public.feedback add constraint feedback_page_len check (page is null or char_length(page) <= 300);

notify pgrst, 'reload schema';
