-- ============================================================================
-- 047_ticketing_integrity_fixes.sql
-- Root-cause fixes for the four ticketing bugs (wrong ownership / missing
-- tickets, duplicate registrations, register-with-no-ticket, paid/free status).
-- Fixes the shared DB, so BOTH the web app and the Flutter app inherit them.
--
-- IDEMPOTENT — safe to run more than once.
-- RUN ORDER: apply pending_migrations_to_run.sql (041, 042, 043) and migrations
-- 044, 045, 046 FIRST, then run this file. Paste into Supabase → SQL Editor → Run.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1) STATUS CONSTRAINT (re-assert the full set — same as 042, idempotent).
--    If 042 was never applied, inserting/updating a registration to
--    'pending_approval' / 'refunded' / 'waitlisted' fails with a check-
--    constraint 500 — i.e. "register → no ticket". This guarantees it exists.
-- ----------------------------------------------------------------------------
alter table registrations drop constraint if exists registrations_status_check;
alter table registrations add constraint registrations_status_check
  check (status in (
    'pending', 'confirmed', 'checked_in', 'cancelled', 'refunded',
    'waitlisted', 'pending_approval'
  ));


-- ----------------------------------------------------------------------------
-- 2) OWNERSHIP / MISSING TICKETS (RLS).
--    The old `attendee_read` policy only matched registrations whose
--    attendee_email EXACTLY equals the profile email. So a signed-in user could
--    NOT see:
--      • tickets linked to them by user_id but bought under a different email,
--      • tickets whose stored email differs only in letter-case.
--    New policy: read your registrations by user_id OR a case-insensitive email
--    match. Strictly scoped to the current user — never exposes anyone else.
-- ----------------------------------------------------------------------------
drop policy if exists attendee_read on registrations;
create policy attendee_read on registrations
  for select
  using (
    (user_id is not null and user_id = auth.uid())
    or lower(attendee_email) = lower(coalesce(
         (select email from profiles where id = auth.uid()), '')
       )
  );


-- ----------------------------------------------------------------------------
-- 3) DUPLICATE REGISTRATIONS.
--    The old uniqueness was UNIQUE (event_id, attendee_email) on the RAW email,
--    so 'Alice@x.com' and 'alice@x.com' counted as two people. Replace it with a
--    CASE-INSENSITIVE unique index. (Both apps already lowercase on insert, so
--    this matches existing data; it still raises 23505 on duplicates, which the
--    register route already handles.)
--
--    NOTE: if this errors with "could not create unique index", you have real
--    case-duplicate rows — run the SELECT in the audit doc to find & merge them,
--    then re-run this block.
-- ----------------------------------------------------------------------------
alter table registrations drop constraint if exists registrations_event_email_unique;
create unique index if not exists registrations_event_email_lower_uniq
  on registrations (event_id, lower(attendee_email));


-- ----------------------------------------------------------------------------
-- 4) NON-NEGATIVE MONEY (validated for new rows only — won't touch history).
--    (Inventory quantity_sold is intentionally left to the app's existing
--    increment_ticket_quantity_sold() call on payment confirmation — adding a
--    DB trigger here would double-count paid tickets.)
-- ----------------------------------------------------------------------------
alter table registrations drop constraint if exists chk_registration_amount_non_negative;
alter table registrations add constraint chk_registration_amount_non_negative
  check (amount_paid >= 0) not valid;

alter table ticket_types drop constraint if exists chk_ticket_quantity_sold_non_negative;
alter table ticket_types add constraint chk_ticket_quantity_sold_non_negative
  check (quantity_sold >= 0) not valid;
