-- 120_registrations_hot_indexes.sql
--
-- Hot-path indexes for public.registrations. Same shape as 103 (notifications).
--
-- `registrations` is the table that grows without bound on every axis: per
-- event (a 5,000-attendee conference), and platform-wide forever. Its existing
-- index set covers lookup but NOT ordering:
--
--   registrations_event_idx    (event_id)
--   registrations_status_idx   (event_id, status)
--   registrations_email_idx    (attendee_email)
--   registrations_user_id_idx  (user_id)
--   registrations_qr_idx       (qr_code_token)
--   registrations_promo_code_idx, registrations_cash_shift_idx
--
-- Every attendee-list surface sorts by created_at desc and reads one page.
-- With only (event_id) to work from, Postgres fetches EVERY row for the event
-- and sorts it to hand back 50. Pagination doesn't save you when the sort key
-- is unindexed — the page is capped, the work behind it is not.
--
-- Queries this serves:
--   app/(app)/events/[id]/registrations/page.tsx  .eq(event_id).order(created_at desc).range(0,49)
--   app/(app)/events/[id]/orders|reports|downloads|roster/print   .eq(event_id).order(created_at)
--   app/admin/registrations/page.tsx              .order(created_at desc).range(offset, +49)   [no event filter]
--   app/api/admin/registrations/export/route.ts   .order(created_at desc).limit(50000)
--   app/admin/billing/page.tsx                    .eq(payment_status,'paid')                   [no event filter]
--
-- NOTE ON LOCKING: plain CREATE INDEX takes ACCESS EXCLUSIVE and blocks writes
-- on registrations for the duration — i.e. blocks people registering. The table
-- is small today, so this is a sub-second no-op. If it is ever large, or if you
-- are applying this DURING a live event, run each statement separately as
-- `create index concurrently if not exists ...` instead (CONCURRENTLY cannot
-- run inside a transaction block or a do-block, which is why it isn't used
-- here).
--
-- All statements are IF NOT EXISTS — re-running is a no-op.

-- Newest-first attendee list for one event. This is the 5,000-attendee case:
-- turns "read 5,000 rows + sort" into "read 50 rows" for the paginated list.
create index if not exists registrations_event_created_idx
  on public.registrations (event_id, created_at desc);

-- Newest-first list across ALL events — the admin registrations table and the
-- CSV export. Unfiltered, these sort the entire table to return one page.
create index if not exists registrations_created_idx
  on public.registrations (created_at desc);

-- Admin billing take-rate scan (`payment_status = 'paid'`, no event filter, no
-- limit). Partial, because most Eventera events are free: the paid rows are a
-- minority of the table, so this index stays small while the table grows.
--
-- This is a mitigation, not a fix. The query itself still reads every paid
-- registration ever taken and sums it in JS — see the audit note. The index
-- makes that read an index scan instead of a sequential scan; it does not stop
-- the row count from growing forever.
create index if not exists registrations_paid_idx
  on public.registrations (payment_status)
  where payment_status = 'paid';
