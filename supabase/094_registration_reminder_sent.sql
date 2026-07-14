-- 094_registration_reminder_sent.sql
-- Dedup guest (no-account) event reminders.
--
-- Account holders are deduped via their existing `event_reminder` notification
-- row (see app/api/cron/reminders/route.ts). Guests have no account, so no
-- notification row — this timestamp records when a guest reminder email was
-- sent, and the cron skips any registration where it is already set.
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

COMMENT ON COLUMN registrations.reminder_sent_at IS
  'When a guest (user_id IS NULL) reminder email was sent, to send it at most once. Null = not yet reminded.';
