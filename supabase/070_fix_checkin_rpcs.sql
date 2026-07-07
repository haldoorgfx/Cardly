-- 070_fix_checkin_rpcs.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- WHY: production has OLD versions of the mobile check-in RPCs. Verified live
-- on 2026-07-07 against the REST API:
--   • list_event_attendees  → 400 «column reference "id" is ambiguous»
--     (an older draft; this is why the app shows "Numbers unavailable" and
--      "Couldn't load the attendee list" on every event)
--   • checkin_registration  → 404 «relation "event_staff" does not exist»
--     (an older draft referencing a table that was renamed to user_event_roles;
--      this is why the QR scanner check-in could never succeed)
--   • checkin_registration_by_id → already correct (200), untouched here.
--
-- This file re-deploys both functions in their correct form. Safe to re-run.
-- Paste the WHOLE file into the Supabase SQL editor and run once.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. list_event_attendees ─────────────────────────────────────────────────
-- Rewritten as a plain SQL function (no PL/pgSQL variables → the "ambiguous id"
-- class of bug cannot happen again). Same signature and result shape the app
-- already expects: id / attendee_name / ticket / checked_in / checked_in_at.
-- Access: event owner OR active staff/organizer via user_event_roles.
-- Deliberately excludes email + revenue (staff limited view, enforced here).

create or replace function public.list_event_attendees(p_event_id uuid)
returns table (
  id            uuid,
  attendee_name text,
  ticket        text,
  checked_in    boolean,
  checked_in_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select r.id,
         r.attendee_name,
         (select t.name from ticket_types t where t.id = r.ticket_type_id),
         (r.status = 'checked_in'),
         r.checked_in_at
  from registrations r
  where r.event_id = p_event_id
    and r.status in ('confirmed', 'checked_in')
    and exists (
      select 1 from events e
      where e.id = p_event_id
        and (
          e.user_id = auth.uid()
          or exists (
            select 1 from user_event_roles uer
            where uer.event_id = p_event_id
              and uer.user_id = auth.uid()
              and uer.role in ('staff', 'organizer')
              and uer.status = 'active'
          )
        )
    )
  order by r.attendee_name;
$$;

grant execute on function public.list_event_attendees(uuid) to authenticated;


-- ── 2. checkin_registration (QR scanner) ────────────────────────────────────
-- Current version from supabase/058_checkin_rpc.sql — uses user_event_roles,
-- NOT the long-gone event_staff table.
-- Result shape (jsonb): { result, attendee_name, ticket, checked_in_at, message }
--   result ∈ 'success' | 'already_checked_in' | 'invalid' | 'error'

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

  -- Find the registration for this token within this event.
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

  update registrations
    set status = 'checked_in', checked_in_at = now(), checked_in_by = v_uid
    where id = v_reg.id;

  return jsonb_build_object('result','success',
    'attendee_name', v_reg.attendee_name, 'ticket', v_ticket,
    'checked_in_at', now(), 'message','Checked in');
end;
$$;

grant execute on function public.checkin_registration(uuid, text) to authenticated;
