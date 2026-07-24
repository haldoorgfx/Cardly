-- ============================================================================
-- 126_checkin_rpc_team_access.sql
--
-- WHAT WAS WRONG
--   checkin_registration() and checkin_registration_by_id() (106) — the RPCs
--   the MOBILE scanner calls — authorise the caller with a hand-rolled check:
--
--     v_owner <> v_uid and not exists (
--       select 1 from user_event_roles
--       where event_id = p_event_id and user_id = v_uid
--         and role in ('staff','organizer') and status = 'active')
--
--   That is the exact two-clause body can_manage_event() had BEFORE migration
--   116 added a third clause for Teams (`is_event_team_member`). 116 only
--   patched can_manage_event() itself — these two RPCs duplicate its logic
--   inline instead of calling it, so they never picked up the team clause.
--
--   Net effect: a Studio team member can open the web scanner (hasCheckInAccess
--   → manageableOwnerIds, team-aware) and can manage the event everywhere else
--   (can_manage_event, team-aware since 116), but the MOBILE app's QR scanner —
--   the device most likely to be handed to on-the-ground staff at the door —
--   silently rejects every scan for them with "Not authorised for this event".
--   That reads as the app being broken, not as a permissions rule, and there is
--   no error the teammate can act on.
--
--   event_staff-invited check_in/manager roles are NOT affected by this gap:
--   app/api/events/[id]/staff/route.ts already mirrors those into
--   user_event_roles (role='staff') on invite/role-change/removal, which this
--   RPC's existing clause already reads. Only TEAM membership was missing.
--
-- FIX
--   Add the same `public.is_event_team_member(p_event_id)` clause 116 added to
--   can_manage_event() to both RPCs' authorisation check. Reuses the existing
--   helper — no new function, no table change. Nothing else moves: same
--   signatures, same result shapes, same race-guarded UPDATE from 106.
--
-- IDEMPOTENT: create or replace only. Safe to re-run.
-- HOW TO APPLY: paste into the Supabase SQL editor and Run. Requires 116
-- (is_event_team_member) to already be applied — it is, per
-- docs/MIGRATIONS-PENDING.md's "Applied 2026-07-22" note.
-- ============================================================================


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

  -- Ownership: caller must own the event, be active staff/organizer, OR be on
  -- a team that owns the event (matches can_manage_event() since 116).
  select user_id into v_owner from events where id = p_event_id;
  if v_owner is null then
    return jsonb_build_object('result','error','message','Event not found');
  end if;
  if v_owner <> v_uid
     and not exists (
       select 1 from user_event_roles
       where event_id = p_event_id and user_id = v_uid
         and role in ('staff','organizer') and status = 'active'
     )
     and not public.is_event_team_member(p_event_id)
  then
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

  -- Ownership: caller must own the event, be active staff/organizer, OR be on
  -- a team that owns the event (matches can_manage_event() since 116).
  select user_id into v_owner from events where id = p_event_id;
  if v_owner is null then
    return jsonb_build_object('result','error','message','Event not found');
  end if;
  if v_owner <> v_uid
     and not exists (
       select 1 from user_event_roles
       where event_id = p_event_id and user_id = v_uid
         and role in ('staff','organizer') and status = 'active'
     )
     and not public.is_event_team_member(p_event_id)
  then
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
