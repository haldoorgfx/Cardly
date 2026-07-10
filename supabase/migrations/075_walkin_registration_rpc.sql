-- ============================================================================
-- 075_walkin_registration_rpc.sql   (Group G4 — hardening)
--
-- WHY THIS EXISTS
--   The mobile door-sales screen (C01) needs to create a PAID, CHECKED-IN
--   registration. Doing that with a direct client insert is unsafe: the
--   `registrations` insert policy is `with check (true)` (it must be, so the
--   public can register), which means any holder of the anon key could insert a
--   row with payment_status='paid' and amount_paid of their choosing.
--
--   This RPC moves the whole door sale server-side:
--     • authorises the caller with can_manage_event() (owner or active staff)
--     • reads the price from ticket_types — the client NEVER supplies it
--     • opens (or reuses) the caller's cash shift for cash sales
--     • inserts the registration as paid, links the shift, records the method
--     • checks the attendee in
--     • is IDEMPOTENT on p_client_uuid, so a double-tapped Confirm or a retried
--       request after a lost response can never take money twice
--
-- DEPENDS ON
--   • 017_event_registration  → registrations, ticket_types
--   • 055_user_event_roles    → user_event_roles (staff auth)
--   • 070_cash_reconciliation → cash_shifts, registrations.cash_shift_id,
--                               registrations.payment_method, open_cash_shift
--
-- IDEMPOTENT: add column/index if not exists, create or replace function.
--   Safe to re-run. Apply in the Supabase SQL editor AFTER 070.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Idempotency key for door sales. One row per client_uuid, ever.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.registrations
  add column if not exists walkin_client_uuid text;

create unique index if not exists registrations_walkin_client_uuid_uidx
  on public.registrations (walkin_client_uuid)
  where walkin_client_uuid is not null;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. create_walkin_registration — the whole door sale, server-authoritative.
--
--    Returns jsonb:
--      { status: 'ok' | 'already',
--        registration_id, qr_code_token, attendee_name, ticket_name,
--        amount_paid, payment_method, cash_shift_id, checked_in }
--    or { status: 'error', message }
--
--    status='already' means this client_uuid was already processed — the caller
--    should treat it as success and show the SAME receipt, not charge again.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.create_walkin_registration(
  p_event_id       uuid,
  p_ticket_type_id uuid,
  p_name           text,
  p_email          text,
  p_phone          text    default null,
  p_payment_method text    default 'cash',
  p_client_uuid    text    default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_tt       public.ticket_types%rowtype;
  v_existing public.registrations%rowtype;
  v_reg      public.registrations%rowtype;
  v_shift_id uuid;
  v_email    text;
  v_now      timestamptz := now();
begin
  if v_uid is null then
    return jsonb_build_object('status','error','message','Not signed in');
  end if;

  if p_payment_method is null or p_payment_method not in ('cash','mobile_money','card') then
    return jsonb_build_object('status','error','message','Invalid payment method');
  end if;

  if coalesce(btrim(p_name), '') = '' then
    return jsonb_build_object('status','error','message','Attendee name is required');
  end if;

  if not public.can_manage_event(p_event_id) then
    return jsonb_build_object('status','error','message','Not authorised for this event');
  end if;

  -- Idempotency: a replayed sale returns the ORIGINAL receipt, never a new row.
  if p_client_uuid is not null then
    select * into v_existing from public.registrations
      where walkin_client_uuid = p_client_uuid limit 1;
    if found then
      return jsonb_build_object(
        'status',          'already',
        'registration_id', v_existing.id,
        'qr_code_token',   v_existing.qr_code_token,
        'attendee_name',   v_existing.attendee_name,
        'amount_paid',     v_existing.amount_paid,
        'payment_method',  v_existing.payment_method,
        'cash_shift_id',   v_existing.cash_shift_id,
        'checked_in',      v_existing.status = 'checked_in'
      );
    end if;
  end if;

  -- The price is the SERVER's. The client never supplies an amount.
  select * into v_tt from public.ticket_types
    where id = p_ticket_type_id and event_id = p_event_id;
  if not found then
    return jsonb_build_object('status','error','message','Ticket type not found for this event');
  end if;

  -- Cash sales belong to the selling staff member's open drawer.
  if p_payment_method = 'cash' then
    select id into v_shift_id from public.cash_shifts
      where event_id = p_event_id and staff_user_id = v_uid and status = 'open'
      order by started_at desc limit 1;
    if v_shift_id is null then
      insert into public.cash_shifts (event_id, staff_user_id)
        values (p_event_id, v_uid)
        returning id into v_shift_id;
    end if;
  end if;

  -- attendee_email is NOT NULL + unique per event. A walk-in without an email
  -- gets a non-deliverable placeholder derived from the idempotency key, so a
  -- retry collides on walkin_client_uuid rather than creating a second sale.
  v_email := nullif(btrim(lower(coalesce(p_email, ''))), '');
  if v_email is null then
    v_email := 'walkin-' || coalesce(p_client_uuid, gen_random_uuid()::text)
               || '@no-reply.eventera';
  end if;

  insert into public.registrations (
    event_id, ticket_type_id, attendee_name, attendee_email, attendee_phone,
    status, payment_status, amount_paid, payment_method, cash_shift_id,
    walkin_client_uuid, checked_in_at, checked_in_by, created_at
  ) values (
    p_event_id, v_tt.id, btrim(p_name), v_email, nullif(btrim(coalesce(p_phone,'')), ''),
    'checked_in', 'paid', v_tt.price, p_payment_method, v_shift_id,
    p_client_uuid, v_now, v_uid, v_now
  )
  returning * into v_reg;

  return jsonb_build_object(
    'status',          'ok',
    'registration_id', v_reg.id,
    'qr_code_token',   v_reg.qr_code_token,
    'attendee_name',   v_reg.attendee_name,
    'ticket_name',     v_tt.name,
    'amount_paid',     v_reg.amount_paid,
    'payment_method',  v_reg.payment_method,
    'cash_shift_id',   v_reg.cash_shift_id,
    'checked_in',      true
  );

exception
  when unique_violation then
    -- Concurrent replay of the same client_uuid — return the winner's receipt.
    if p_client_uuid is not null then
      select * into v_existing from public.registrations
        where walkin_client_uuid = p_client_uuid limit 1;
      if found then
        return jsonb_build_object(
          'status',          'already',
          'registration_id', v_existing.id,
          'qr_code_token',   v_existing.qr_code_token,
          'attendee_name',   v_existing.attendee_name,
          'amount_paid',     v_existing.amount_paid,
          'payment_method',  v_existing.payment_method,
          'cash_shift_id',   v_existing.cash_shift_id,
          'checked_in',      v_existing.status = 'checked_in'
        );
      end if;
    end if;
    return jsonb_build_object('status','error','message','That attendee is already registered for this event');
end;
$$;

revoke all on function public.create_walkin_registration(uuid, uuid, text, text, text, text, text) from public;
grant execute on function public.create_walkin_registration(uuid, uuid, text, text, text, text, text) to authenticated;
