-- ─────────────────────────────────────────────────────────────────────────────
-- 101 — Row level security for event_photos (photo wall)
--
-- WHY: the photo wall table (migration 037_photo_wall.sql) shipped with NO
-- `enable row level security` and no policies at all — the only table in the
-- schema in that state. With RLS disabled, Supabase's default grants to the
-- anon/authenticated roles leave it fully readable AND writable through the
-- public API key. That means anyone with the anon key could:
--   • enumerate every event's photos, including `pending` and `rejected`
--     submissions that are awaiting moderation and were never meant to be seen,
--   • insert photos into any organizer's wall,
--   • update or delete other people's photos (and the `likes` counter).
--
-- SAFE TO APPLY: both existing code paths — the organizer photo page
-- (app/(app)/events/[id]/photos/page.tsx) and the moderation route
-- (app/api/events/[id]/photos/route.ts) — use the service-role client, which
-- bypasses RLS entirely. Enabling it changes nothing for them.
-- ─────────────────────────────────────────────────────────────────────────────

alter table event_photos enable row level security;

-- Organizer owns the wall for their own events.
drop policy if exists owner_all on event_photos;
create policy owner_all on event_photos for all
  using (
    event_id in (select id from events where user_id = auth.uid())
  )
  with check (
    event_id in (select id from events where user_id = auth.uid())
  );

-- Public may read ONLY moderated-in photos, and only for a publicly visible
-- event. Pending/rejected submissions stay private to the organizer.
drop policy if exists public_read_approved on event_photos;
create policy public_read_approved on event_photos for select
  using (
    status in ('approved', 'featured')
    and event_id in (select event_id from event_pages where is_public = true)
  );

-- No anon/authenticated INSERT/UPDATE/DELETE policy is granted on purpose:
-- uploads and moderation both go through server routes on the service-role
-- client today. Add a scoped insert policy here if/when attendees upload
-- directly from the client.
