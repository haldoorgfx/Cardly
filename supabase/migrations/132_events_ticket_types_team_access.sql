-- ============================================================================
-- 132_events_ticket_types_team_access.sql
--
-- WHAT WAS WRONG
--   116/127's own headers said this explicitly and it stayed true until now:
--   "the events'/ticket_types'/event_pages' RLS policies were deliberately
--   never widened with a team clause -- only the RPC layer was." Confirmed
--   by dumping the live policy bodies before writing this file (`select *
--   from pg_policies where tablename in ('events','ticket_types',
--   'event_pages')`, 2026-08-14) -- 9 policies, none reference
--   is_event_team_member() or team_members.
--
--   Net effect, even with 116/127/131 already applied: a Studio team member
--   can see an owner's event in the mobile organizer list (127), see its
--   attendees, approve/reject registrations (131) -- but the moment they
--   open the event's own detail/edit screen, try to publish/unpublish it,
--   delete it, edit its event_page, or touch a ticket type, every one of
--   those calls goes straight to the RAW `events`/`event_pages`/
--   `ticket_types` tables with the session client (mobile's
--   eventera_api.dart loadOwnEvent/setPublished/deleteEvent/saveZones,
--   organizer_api.dart's upsertEventPage/setEventPublic,
--   manage_tickets_screen.dart) -- and RLS silently returns nothing or
--   rejects the write, because these policies check literal
--   `events.user_id = auth.uid()` with no team clause at all. A draft
--   (unpublished) event a teammate has access to isn't even readable --
--   `events: owner select` is the only non-public SELECT path.
--
--   This is web-affecting too: any web code path that reads/writes these
--   three tables directly (not through an RPC or the service-role admin
--   client) was subject to the exact same literal-ownership-only RLS.
--
-- FIX
--   Extend the 5 owner-only policies below with the same
--   `public.is_event_team_member(...)` clause 116/126/131 already use.
--   event_pages/ticket_types keep `with_check` implicit (matching their
--   current NULL) -- Postgres falls back to the USING clause for WITH CHECK
--   on a FOR ALL policy with none given, same behaviour as before this
--   migration. events: owner insert is UNCHANGED -- creating a new event
--   is a self-serve action, not something done "as" a team owner.
--   events: public read published / event_pages: public_read /
--   ticket_types: public_read are UNCHANGED -- unrelated to ownership.
--
-- IDEMPOTENT: drop + create, matching every prior policy migration in this
-- repo (008/012/116/128). Safe to re-run.
-- HOW TO APPLY: paste into the Supabase SQL editor and Run. Requires 116
-- (is_event_team_member) to already be applied -- it is, applied 2026-08-14.
-- ============================================================================


-- ── events: read/update/delete ───────────────────────────────────────────────
drop policy if exists "events: owner select" on events;
create policy "events: owner select" on events
for select
using (auth.uid() = user_id or public.is_event_team_member(id));

drop policy if exists "events: owner update" on events;
create policy "events: owner update" on events
for update
using (auth.uid() = user_id or public.is_event_team_member(id));

drop policy if exists "events: owner delete" on events;
create policy "events: owner delete" on events
for delete
using (auth.uid() = user_id or public.is_event_team_member(id));


-- ── event_pages: publish/unpublish, page edits ───────────────────────────────
drop policy if exists owner_all on event_pages;
create policy owner_all on event_pages
for all
using (
  event_id in (select events.id from events where events.user_id = auth.uid())
  or public.is_event_team_member(event_id)
);


-- ── ticket_types: create/edit/delete ticket types ────────────────────────────
drop policy if exists owner_all on ticket_types;
create policy owner_all on ticket_types
for all
using (
  event_id in (select events.id from events where events.user_id = auth.uid())
  or public.is_event_team_member(event_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Sanity checks -- run after applying, as a Studio team member with no owned
-- events and no user_event_roles row, against an event owned by the team's
-- owner:
--
--   select * from events where id = '<event-uuid>';
--   -> should now return the row instead of an empty set.
--
--   update events set name = name where id = '<event-uuid>';
--   -> should succeed instead of "0 rows updated".
--
--   Confirm nobody gained access who shouldn't have -- must return 0:
--     select count(*) from events e
--     where public.is_event_team_member(e.id)
--       and e.user_id <> auth.uid()
--       and not exists (
--         select 1 from teams t join team_members m on m.team_id = t.id
--         where t.owner_id = e.user_id and m.user_id = auth.uid()
--       );
-- ─────────────────────────────────────────────────────────────────────────────
