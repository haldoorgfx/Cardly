-- 106_checkin_rpc_race_guard.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- WHY: checkin_registration() and checkin_registration_by_id() (last defined in
-- 070_fix_checkin_rpcs.sql and 064_checkin_by_id.sql) both read the row, decide
-- the answer, and THEN write — with nothing in the UPDATE's WHERE clause tying
-- the write to the state they read:
--
--     select * into v_reg from registrations where ...;   -- sees 'confirmed'
--     if v_reg.status = 'checked_in' then ... end if;     -- not taken
--     update registrations set status = 'checked_in' where id = v_reg.id;
--
-- At the door that means: two staff phones scan the same QR at the same
-- instant, both SELECT 'confirmed' before either commits, and BOTH return
-- result='success' with a green tick and a success beep. One ticket, two
-- unmistakable "come in" signals — the second person walks in on a ticket that
-- was already used, and neither staff member has any way to know. The web route
-- (app/api/events/[id]/checkin/route.ts) already got this right by putting the
-- expected state in the UPDATE and treating "0 rows" as the lost race; these
-- RPCs — the path the MOBILE scanner uses — never did.
--
-- FIX: move the state transition into the UPDATE's WHERE clause
-- (`and status <> 'checked_in'`) and branch on whether a row came back.
-- Postgres serializes the two concurrent UPDATEs on the row lock; the loser
-- re-evaluates the WHERE against the winner's committed row, matches nothing,
-- and now correctly reports 'already_checked_in' — with the WINNER's real
-- check-in time, so the two phones agree about what happened.
--
-- Nothing else changes: same signatures, same result shapes, same auth ladder,
-- same event-scoped lookup. Safe to re-run.
-- Paste the whole file into the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. checkin_registration (QR scanner — check in by token) ────────────────
create or replace function public.checkin_registration(p_event_id uuid, p_qr_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_owner  uuid;
  v_reg    registrations%rowtype;
  v_ticket text;
  v_now    timestamptz;
  v_rows   int;
  v_at     timestamptz;
begin
  if v_uid is null then
    return jsonb_build_object('result','error','message','Not signed in');
  end if;

  -- Ownership: caller must own the event OR be active staff/organizer.
  select user_id into v_owner from events where id = p_event_id;
  if v_owner is null then
    return jsonb_build_object('result','error','message','Event not found');
  end if;
  if v_owner <> v_uid and not exists (
    select 1 from user_event_roles
    where event_id = p_event_id and user_id = v_uid
      and role in ('staff','organizer') and status = 'active'
  ) then
    return jsonb_build_object('result','error','message','Not authorised for this event');
  end if;

  -- Find the registration for this token WITHIN THIS EVENT. Scoping the lookup
  -- by event_id is what stops event A's ticket opening event B's door.
  select * into v_reg from registrations
    where qr_code_token = p_qr_token and event_id = p_event_id;
  if not found then
    return jsonb_build_object('result','invalid',
      'message','QR not recognised — no registration for this event');
  end if;

  select name into v_ticket from ticket_types where id = v_reg.ticket_type_id;

  if v_reg.status = 'checked_in' then
    return jsonb_build_object('result','already_checked_in',
      'attendee_name', v_reg.attendee_name, 'ticket', v_ticket,
      'checked_in_at', v_reg.checked_in_at, 'message','Already checked in');
  end if;

  if v_reg.status in ('cancelled','refunded') then
    return jsonb_build_object('result','invalid',
      'attendee_name', v_reg.attendee_name,
      'message','Registration is '|| v_reg.status ||' — entry not allowed');
  end if;

  if v_reg.payment_status in ('pending','failed') and coalesce(v_reg.amount_paid,0) > 0 then
    return jsonb_build_object('result','invalid',
      'attendee_name', v_reg.attendee_name,
      'message','Payment not completed — entry not allowed');
  end if;

  v_now := now();

  -- The transition is guarded IN the UPDATE, not by the read above: only the
  -- first of two concurrent scans matches `status <> 'checked_in'`.
  update registrations
    set status = 'checked_in', checked_in_at = v_now, checked_in_by = v_uid
    where id = v_reg.id
      and status <> 'checked_in';
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    -- Lost the race: another scanner checked this person in between our read
    -- and our write. Report the WINNER's timestamp, never a success.
    select checked_in_at into v_at from registrations where id = v_reg.id;
    return jsonb_build_object('result','already_checked_in',
      'attendee_name', v_reg.attendee_name, 'ticket', v_ticket,
      'checked_in_at', v_at, 'message','Already checked in');
  end if;

  return jsonb_build_object('result','success',
    'attendee_name', v_reg.attendee_name, 'ticket', v_ticket,
    'checked_in_at', v_now, 'message','Checked in');
end;
$$;

grant execute on function public.checkin_registration(uuid, text) to authenticated;


-- ── 2. checkin_registration_by_id (manual check-in from the attendee list) ──
create or replace function public.checkin_registration_by_id(p_event_id uuid, p_registration_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_owner  uuid;
  v_reg    registrations%rowtype;
  v_ticket text;
  v_now    timestamptz;
  v_rows   int;
  v_at     timestamptz;
begin
  if v_uid is null then
    return jsonb_build_object('result','error','message','Not signed in');
  end if;

  -- Ownership: caller must own the event OR be assigned active event staff.
  select user_id into v_owner from events where id = p_event_id;
  if v_owner is null then
    return jsonb_build_object('result','error','message','Event not found');
  end if;
  if v_owner <> v_uid and not exists (
    select 1 from user_event_roles
    where event_id = p_event_id and user_id = v_uid
      and role in ('staff','organizer') and status = 'active'
  ) then
    return jsonb_build_object('result','error','message','Not authorised for this event');
  end if;

  -- Event-scoped lookup: a registration id from another event is 'invalid'.
  select * into v_reg from registrations
    where id = p_registration_id and event_id = p_event_id;
  if not found then
    return jsonb_build_object('result','invalid',
      'message','Registration not found for this event');
  end if;

  select name into v_ticket from ticket_types where id = v_reg.ticket_type_id;

  if v_reg.status = 'checked_in' then
    return jsonb_build_object('result','already_checked_in',
      'attendee_name', v_reg.attendee_name, 'ticket', v_ticket,
      'checked_in_at', v_reg.checked_in_at, 'message','Already checked in');
  end if;

  if v_reg.status in ('cancelled','refunded') then
    return jsonb_build_object('result','invalid',
      'attendee_name', v_reg.attendee_name,
      'message','Registration is '|| v_reg.status ||' — entry not allowed');
  end if;

  if v_reg.payment_status in ('pending','failed') and coalesce(v_reg.amount_paid,0) > 0 then
    return jsonb_build_object('result','invalid',
      'attendee_name', v_reg.attendee_name,
      'message','Payment not completed — entry not allowed');
  end if;

  v_now := now();

  -- Same guarded transition as checkin_registration above: two staff tapping
  -- "check in" on the same row at once must not both see success.
  update registrations
    set status = 'checked_in', checked_in_at = v_now, checked_in_by = v_uid
    where id = v_reg.id
      and status <> 'checked_in';
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    select checked_in_at into v_at from registrations where id = v_reg.id;
    return jsonb_build_object('result','already_checked_in',
      'attendee_name', v_reg.attendee_name, 'ticket', v_ticket,
      'checked_in_at', v_at, 'message','Already checked in');
  end if;

  return jsonb_build_object('result','success',
    'attendee_name', v_reg.attendee_name, 'ticket', v_ticket,
    'checked_in_at', v_now, 'message','Checked in');
end;
$$;

grant execute on function public.checkin_registration_by_id(uuid, uuid) to authenticated;
