-- ============================================================================
-- 078_rls_hardening.sql   (pre-existing platform — security fixes)
--
-- Three RLS defects found in a full audit of the core (pre-expansion) schema.
-- All three live in 017_event_registration.sql. This migration corrects them
-- in place without touching any other policy.
--
-- IDEMPOTENT: drop policy if exists + create policy. Apply in the Supabase SQL
--   editor. Safe to re-run.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. registrations.public_insert was `with check (true)` — fully open.
--
--    The anon key is public, so anyone could POST directly to /rest/v1/registrations
--    and mint a CONFIRMED / PAID / CHECKED-IN registration, attribute it to any
--    user_id, or pre-check-in — bypassing the guarded server route entirely.
--
--    Every legitimate registration is created SERVER-SIDE with the service-role
--    client (which bypasses RLS), so this policy only ever governed hostile
--    direct-anon inserts. We keep a narrow public insert (so a benign pending
--    row can still be created if a client path ever needs it) but forbid every
--    trust field a forger would set.
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "public_insert" on public.registrations;
create policy "public_insert" on public.registrations
  for insert
  with check (
    -- cannot self-confirm or self-admit
    status not in ('confirmed', 'checked_in')
    -- cannot claim to have paid
    and coalesce(payment_status, 'pending') <> 'paid'
    and coalesce(amount_paid, 0) = 0
    -- cannot attribute the registration to someone else's account
    and user_id is null
    -- cannot pre-stamp attendance
    and checked_in_at is null
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. registration_form_fields.public_read compared the WRONG columns.
--
--    Original: event_id in (select id from event_pages where is_public = true)
--    `registration_form_fields.event_id` is an events.id, but the subquery
--    selects event_pages.id (its own PK) — two disjoint UUID spaces, so the
--    policy matched nothing. Custom registration questions silently vanished on
--    the anon / mobile read path (masked on web, which reads via service role).
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "public_read" on public.registration_form_fields;
create policy "public_read" on public.registration_form_fields
  for select
  using (
    event_id in (select event_id from public.event_pages where is_public = true)
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ticket_types.public_read had the IDENTICAL wrong-column bug.
--    Anon / mobile readers could not see any ticket types or prices for a public
--    event. Masked on web (service-role reads).
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "public_read" on public.ticket_types;
create policy "public_read" on public.ticket_types
  for select
  using (
    event_id in (select event_id from public.event_pages where is_public = true)
  );
