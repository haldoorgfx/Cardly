-- 103_notifications_hot_indexes.sql
--
-- Hot-path indexes for public.notifications.
--
-- The `notifications` table has no CREATE TABLE in this repo (it was created
-- out-of-band, like the RLS-only migration 046 that also guards on existence),
-- so its index set could not be verified from source. Every statement below is
-- IF NOT EXISTS and wrapped in an existence guard — re-running or applying it
-- against a table that already has these indexes is a no-op.
--
-- Queries this serves:
--   app/api/notifications/route.ts        .eq(user_id).order(created_at desc).limit(n)
--   app/(app)/notifications/page.tsx      same shape, limit 50
--   app/api/notifications/route.ts        .eq(user_id).is(read_at, null) count  → unread badge
--   app/api/cron/reminders/route.ts       .eq(event_id).eq(type)               → reminder dedup
--
-- The unread-badge count runs on every notification poll and is a pure
-- index-only lookup with the partial index below.

do $$
begin
  if to_regclass('public.notifications') is null then
    raise notice 'public.notifications does not exist — skipping index creation';
    return;
  end if;

  -- Newest-first list for one user.
  create index if not exists notifications_user_created_idx
    on public.notifications (user_id, created_at desc);

  -- Unread count for one user. Partial: read rows are the overwhelming majority
  -- over time, so the index stays small no matter how much history accumulates.
  create index if not exists notifications_user_unread_idx
    on public.notifications (user_id)
    where read_at is null;

  -- Reminder-cron dedup lookup ("who already got an event_reminder for this
  -- event"). Without this the cron sequentially scans the whole table once per
  -- event starting in the next 24h.
  create index if not exists notifications_event_type_idx
    on public.notifications (event_id, type)
    where event_id is not null;
end $$;
