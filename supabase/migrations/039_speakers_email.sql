-- ============================================================
-- 039: Speaker email — links a speaker record to a login
--
-- Adds a nullable email to speakers so that when a person signs
-- in with that email, their speaker portal surfaces automatically
-- on /home ("Speaking" section). Speakers remain reachable by their
-- private token link too — this only ADDS the logged-in path.
-- Idempotent.
-- ============================================================

alter table speakers
  add column if not exists email text;

-- Case-insensitive lookup by email (matches lower(auth email))
create index if not exists speakers_email_idx
  on speakers (lower(email));
