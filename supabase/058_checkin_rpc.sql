-- 058_checkin_rpc.sql
-- Shared server-side check-in, callable from BOTH web and the mobile app.
-- The mobile app talks to Supabase directly (not the Next.js /api routes), so a
-- SECURITY DEFINER RPC lets it check attendees in safely: the function enforces
-- event ownership itself, so it can't be abused by a non-organizer.
--
-- Apply in the Supabase SQL editor. Mirrors the logic in
-- app/api/events/[id]/checkin/route.ts (minus the time-window copy, which the
-- web keeps for its richer messaging).
--
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

  -- Ownership: caller must own the event OR be assigned event staff.
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
    'message','Checked in');
end;
$$;

grant execute on function public.checkin_registration(uuid, text) to authenticated;
