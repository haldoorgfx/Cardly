-- ============================================================================
-- 129_registrations_direct_insert_guard.sql
--
-- CLOSES: the "raw-REST registration-spam bypass" flagged in a prior audit
-- (deep-critical-audit-2026-07-16) and left for Abdalla's risk call.
--
-- THE BUG: registrations.public_insert (017/047) is
--   `for insert with check (true)` — literally any request carrying the
-- PUBLIC anon key can POST directly to {SUPABASE_URL}/rest/v1/registrations
-- and create a row with an arbitrary event_id / ticket_type_id / status /
-- amount_paid / payment_status. That completely bypasses
-- app/api/events/[id]/register/route.ts, which means it also bypasses:
--   - the published/public event check
--   - the registration_deadline check
--   - the ticket sold-out check
--   - the event max_capacity check
--   - the actual payment flow (Stripe/Flutterwave/WaafiPay)
-- ...and it's completely invisible to lib/ratelimit.ts — Next.js middleware
-- rate-limiting only ever sees requests that hit a Next.js route; a raw
-- PostgREST call never does.
--
-- WHY A TRIGGER, NOT JUST A NARROWER RLS POLICY: eventera_mobile writes some
-- tables DIRECTLY via the anon Supabase client, bypassing the Next.js API
-- entirely by design (see e.g. RegStore/qr_code_token patterns fixed earlier
-- this session). Rather than tightening/removing the anon insert policy
-- (risking a legitimate no-auth mobile or guest flow), this trigger keeps
-- inserts allowed for everyone but strips out the dangerous OUTCOMES for any
-- insert that isn't made with the trusted service-role key.
--
-- WEB APP IMPACT: NONE, verified. app/api/events/[id]/register/route.ts and
-- app/api/events/[id]/walk-in/route.ts both insert via createAdminClient()
-- (service-role key), and a repo-wide search found no client/browser code
-- anywhere that calls supabase.from('registrations').insert(...) directly.
-- auth.role() reads 'service_role' for that key, so this trigger no-ops for
-- 100% of the current web registration flow — it only engages for callers
-- using the anon/authenticated role, i.e. exactly the raw-REST path above.
--
-- WHAT THIS BLOCKS for anon/authenticated (non-service-role) inserts:
--   1. Registering against an event that isn't published/public.
--   2. Registering after the event's registration_deadline.
--   3. Registering past event_pages.max_capacity while landing 'confirmed'/
--      'checked_in'.
--   4. Registering past a ticket_type's quantity (sold out) while landing
--      'confirmed'/'checked_in'.
--   5. Landing as 'confirmed'/'checked_in' on a ticket that costs money
--      without payment_status = 'paid', or on an event that requires
--      organizer approval — silently downgraded to 'pending' rather than
--      hard-rejected, so a genuinely legitimate no-auth caller still gets a
--      row, just not an unpaid/unapproved "confirmed" one.
--   6. Self-reporting amount_paid > 0 without payment_status = 'paid'.
--
-- WHAT THIS DELIBERATELY DOES NOT DO — left for Abdalla's call:
--   - No per-IP / per-minute velocity cap. A Postgres trigger can't see the
--     caller's IP without trusting a PostgREST-forwarded header (spoofable
--     unless Supabase's edge is confirmed to overwrite it), and — unlike the
--     auth.role() check above — a velocity cap can't cleanly exempt "the
--     app's own legitimate burst" from "attacker burst": both look identical
--     at the row level. Adding one risks throttling a real event's
--     doors-open registration rush.
--   - Residual after this migration: someone can still script many *inert*
--     'pending' rows (fake name/email, never payable/confirmable) against a
--     real published event — junk rows / DB storage, not fake attendees or
--     stolen tickets. If Supabase storage or registrations row-count becomes
--     a real concern post-launch, revisit with a CAPTCHA on the public
--     registration form, or a conservative per-event/per-time-bucket trigger
--     cap (accepting the flash-sale-burst risk that comes with it).
--   - Other tables with the same `with check (true)` shape were spotted in
--     passing (ticket_transfers, abstracts, sponsor_leads, waitlist_entries,
--     meeting_requests) but are OUT OF SCOPE here — not touched.
--
-- IDEMPOTENT — safe to run more than once. Paste into the Supabase SQL
-- editor and Run.
-- ============================================================================

create or replace function public.enforce_registration_insert_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_status    text;
  v_event_approval  boolean;
  v_page_public     boolean;
  v_page_deadline   timestamptz;
  v_page_capacity   int;
  v_active_count    int;
  v_ticket_price    numeric;
  v_ticket_qty      int;
  v_ticket_qty_sold int;
  v_ticket_event_id uuid;
begin
  -- The app's own service-role inserts (Next.js API routes) are already fully
  -- validated in application code — never touch them.
  if auth.role() = 'service_role' then
    return new;
  end if;

  -- 1) Event must exist and be published or have a public event page.
  select status, checkout_require_approval
    into v_event_status, v_event_approval
    from events where id = new.event_id;

  if v_event_status is null then
    raise exception 'EVENT_NOT_FOUND' using errcode = 'P0001';
  end if;

  select is_public, registration_deadline, max_capacity
    into v_page_public, v_page_deadline, v_page_capacity
    from event_pages where event_id = new.event_id;

  if v_event_status <> 'published' and coalesce(v_page_public, false) = false then
    raise exception 'EVENT_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  -- 2) Registration deadline.
  if v_page_deadline is not null and v_page_deadline < now() then
    raise exception 'REGISTRATION_CLOSED' using errcode = 'P0001';
  end if;

  -- 3) Ticket type, if supplied, must actually belong to this event.
  if new.ticket_type_id is not null then
    select event_id, price, quantity, quantity_sold
      into v_ticket_event_id, v_ticket_price, v_ticket_qty, v_ticket_qty_sold
      from ticket_types where id = new.ticket_type_id;

    if v_ticket_event_id is null or v_ticket_event_id <> new.event_id then
      raise exception 'INVALID_TICKET_TYPE' using errcode = 'P0001';
    end if;
  end if;

  -- 4) Capacity / sold-out checks only matter for rows landing "active".
  if new.status in ('confirmed', 'checked_in') then
    if v_page_capacity is not null then
      select count(*) into v_active_count
        from registrations
        where event_id = new.event_id
          and status in ('confirmed', 'checked_in');
      if v_active_count >= v_page_capacity then
        raise exception 'EVENT_FULL' using errcode = 'P0001';
      end if;
    end if;

    if v_ticket_qty is not null and v_ticket_qty_sold >= v_ticket_qty then
      raise exception 'TICKET_SOLD_OUT' using errcode = 'P0001';
    end if;

    -- 5) No free ride: a paid ticket or an approval-gated event can never be
    --    self-confirmed by a direct insert — downgrade instead of trusting
    --    the caller's own status.
    if coalesce(v_event_approval, false) = true
       or (v_ticket_price is not null and v_ticket_price > 0 and new.payment_status <> 'paid') then
      new.status := 'pending';
    end if;
  end if;

  -- 6) Never trust a self-reported paid amount without a matching status.
  if new.payment_status <> 'paid' and new.amount_paid > 0 then
    new.amount_paid := 0;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_registration_insert_integrity on public.registrations;
create trigger trg_enforce_registration_insert_integrity
  before insert on public.registrations
  for each row execute function public.enforce_registration_insert_integrity();
