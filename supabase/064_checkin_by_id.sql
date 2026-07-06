-- 064_checkin_by_id.sql
-- Manual check-in from the mobile attendee list (Organize mock O08).
-- The QR scanner (058) checks in by token; the staff attendee list only knows a
-- registration's id (list_event_attendees / 062 never exposes the QR token), so
-- manual "check in" needs an id-keyed entry point. Same ownership rules as 058:
-- the caller must own the event OR be active staff. SECURITY DEFINER enforces it
-- server-side so it can't be abused by a non-organizer.
--
-- Apply in the Supabase SQL editor. Safe to re-run.
--
-- Result shape (jsonb): { result, attendee_name, ticket, checked_in_at, message }
--   result ∈ 'success' | 'already_checked_in' | 'invalid' | 'error'

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

  -- Find the registration by id within this event.
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

  update registrations
    set status = 'checked_in', checked_in_at = now(), checked_in_by = v_uid
    where id = v_reg.id;

  return jsonb_build_object('result','success',
    'attendee_name', v_reg.attendee_name, 'ticket', v_ticket,
    'message','Checked in');
end;
$$;

grant execute on function public.checkin_registration_by_id(uuid, uuid) to authenticated;
