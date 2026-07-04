-- Fix: web vs mobile ticket/registration divergence.
--
-- The public_read RLS policies on ticket_types and registration_form_fields
-- (migration 017) gated on `event_id in (select id from event_pages where is_public)`.
-- But event_pages.id is the PAGE row's own primary key, NOT the event id.
-- ticket_types.event_id / registration_form_fields.event_id reference events.id,
-- which equals event_pages.event_id (a DIFFERENT column). So the subquery never
-- matched and the anon role got ZERO rows.
--
-- Effect: the WEB register page reads with the service-role client (bypasses RLS)
-- so it saw tickets; the MOBILE app reads with the anon client (RLS enforced) so it
-- saw "No tickets available" for events that clearly have tickets. Same DB, different
-- privilege → different truth. This makes them agree.
--
-- Idempotent: drops + recreates the two policies with the correct column.

drop policy if exists public_read on ticket_types;
create policy public_read on ticket_types for select using (
  event_id in (select event_id from event_pages where is_public = true)
);

drop policy if exists public_read on registration_form_fields;
create policy public_read on registration_form_fields for select using (
  event_id in (select event_id from event_pages where is_public = true)
);
