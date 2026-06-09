# Disaster Recovery & Backups

All durable state (profiles, chapters, registrations, practice_logs,
saved_resources, deadlines, assignments, feedback, email_signups, audit_log, and
auth.users) lives in **one** Supabase project: `osxoygndwazbygiqyjhu`. That single
project is the only copy of student/chapter data, so it needs an explicit,
tested recovery plan. (Audit finding SRE-5F-01.)

## RPO / RTO targets

- **RPO (max acceptable data loss):** 24 hours (nightly logical backup; tighten
  to minutes with Supabase PITR on a paid tier).
- **RTO (max acceptable downtime):** 4 hours (restore a logical dump into a new
  Supabase project + repoint env vars).

## Backups

1. **Supabase platform backups.** Confirm the tier in the Supabase dashboard
   (Database -> Backups). The Free tier has limited daily snapshots and **no**
   point-in-time recovery. Since this holds minors' education data, upgrading to a
   tier with PITR + daily backups is recommended before wider rollout.
2. **Off-platform nightly dump.** `.github/workflows/db-backup.yml` runs a nightly
   `pg_dump` and uploads it as a 90-day GitHub artifact, so a copy survives even a
   Supabase-side incident. **Requires a `SUPABASE_DB_URL` repo secret** (Settings
   -> Secrets and variables -> Actions): the Postgres connection string from
   Supabase -> Project Settings -> Database -> Connection string (URI). Until that
   secret is set the workflow is a no-op.

## Restore procedure

1. Create a new Supabase project (or reset the existing one).
2. Download the latest `db-backup` artifact from GitHub Actions (or a Supabase
   snapshot).
3. Restore: `pg_restore --no-owner --clean --if-exists -d "$NEW_DB_URL" backup-YYYY-MM-DD.dump`
   (or `psql "$NEW_DB_URL" -f backup.sql` for a plain dump).
4. Re-apply any migrations newer than the dump from `supabase/migrations/`.
5. Update Vercel env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`) to the new project and redeploy.
6. Smoke-test: `GET /api/health` returns `{ ok: true }`, sign in, generate a test,
   load the advisor chapter view.

## Single points of failure

- **Supabase project** — see above; mitigated by the nightly off-platform dump.
- **Anthropic API** — outage degrades AI practice/chat only (the rest of the app
  works). `GET /api/health` reports key presence; surface it to an uptime monitor.
- **Vercel** — hosting; redeploy from `main` recovers it.

## Drill

Run a restore drill into a throwaway project at least once per term and confirm
the smoke-test passes. Record the date here when done.
