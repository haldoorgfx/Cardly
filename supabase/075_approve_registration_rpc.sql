-- 075_approve_registration_rpc.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Let organizers approve / reject approval-gated registrations FROM MOBILE.
--
-- WHY: approval only existed as a web API route (app/api/events/[id]/approvals),
-- which the Flutter app can't call (it authenticates to Supabase directly, not
-- via the Next.js session cookie). An approval-gated event was therefore
-- impossible to run from the phone. This SECURITY DEFINER RPC mirrors the web
-- route's rules (owner/staff only, capacity check on approve) so mobile can do
-- it safely. Web can adopt it too, but isn't required to.
--
-- Result (jsonb): { result, status, message }
--   result ∈ 'approved' | 'rejected' | 'invalid' | 'full' | 'error'
-- Safe + idempotent. Paste into the Supabase SQL editor and run once.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.approve_registration(
  p_event_id uuid,
  p_registration_id uuid,
  p_action text            -- 'approve' | 'reject'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_owner    uuid;
  v_reg      registrations%rowtype;
  v_capacity integer;
  v_confirmed integer;
begin
  if v_uid is null then
    return jsonb_build_object('result','error','message','Not signed in');
  end if;
  if p_action not in ('approve','reject') then
    return jsonb_build_object('result','error','message','Invalid action');
  end if;

  -- Ownership: event owner OR an active organizer/staff member.
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

  select * into v_reg from registrations
    where id = p_registration_id and event_id = p_event_id;
  if not found then
    return jsonb_build_object('result','invalid','message','Registration not found for this event');
  end if;

  -- Only pending applications can be decided.
  if v_reg.status <> 'pending_approval' then
    return jsonb_build_object('result','invalid',
      'status', v_reg.status,
      'message','This registration is not awaiting approval');
  end if;

  if p_action = 'reject' then
    update registrations set status = 'rejected' where id = p_registration_id;
    return jsonb_build_object('result','rejected','status','rejected','message','Registration declined');
  end if;

  -- approve → confirm, but respect capacity if the event page sets one.
  select max_capacity into v_capacity
    from event_pages where event_id = p_event_id limit 1;
  if v_capacity is not null then
    select count(*) into v_confirmed
      from registrations
      where event_id = p_event_id and status in ('confirmed','checked_in');
    if v_confirmed >= v_capacity then
      return jsonb_build_object('result','full',
        'message','Cannot approve — the event is at full capacity');
    end if;
  end if;

  update registrations set status = 'confirmed' where id = p_registration_id;
  return jsonb_build_object('result','approved','status','confirmed','message','Registration approved');
end;
$$;

grant execute on function public.approve_registration(uuid, uuid, text) to authenticated;
