-- ============================================================================
-- 131_attendees_approve_rpc_team_access.sql
--
-- WHAT WAS WRONG
--   list_event_attendees() (074) and approve_registration() (075) — the RPCs
--   the MOBILE app's attendee list, stats tab, and card-count strip all call
--   (eventera_mobile lib/organize/attendees_tab.dart, stats_tab.dart,
--   event_counts.dart) — authorise the caller with the same hand-rolled
--   two-clause check checkin_registration()/checkin_registration_by_id() had
--   before 126:
--
--     e.user_id = auth.uid()
--     or exists (select 1 from user_event_roles where ... role in
--                ('staff','organizer') and status = 'active')
--
--   That is can_manage_event()'s pre-116 body. Both RPCs duplicate it inline
--   instead of calling it, so — exactly like checkin_registration before 126
--   — they never picked up the is_event_team_member() clause 116 added.
--
--   Net effect: even after 127 (my_manageable_events, applied 2026-08-14)
--   lets a Studio team member see the owner's events in the mobile organizer
--   list, tapping into ANY of them returns zero attendees, zero stats, and a
--   silent "Not authorised for this event" on approve/reject — the event
--   card is visible but everything behind it still isn't.
--
--   Confirmed via live pg_get_functiondef before writing this file (same
--   caution as 116/126 — 051-104 aren't in this repo): both bodies below are
--   byte-identical to production as of 2026-08-14, reproduced in full so
--   this create-or-replace can't silently drop a clause it never knew about.
--
-- FIX
--   Add the same `public.is_event_team_member(p_event_id)` clause 116/126
--   already use, to both RPCs. Nothing else moves: same signatures, same
--   result shapes, same capacity/pending-approval logic in
--   approve_registration.
--
-- IDEMPOTENT: create or replace only. Safe to re-run.
-- HOW TO APPLY: paste into the Supabase SQL editor and Run. Requires 116
-- (is_event_team_member) to already be applied — it is, applied 2026-08-14.
-- ============================================================================


-- ── 1. list_event_attendees (organizer attendee list, stats, card counts) ───
create or replace function public.list_event_attendees(p_event_id uuid)
returns table(id uuid, attendee_name text, ticket text, status text, checked_in boolean, checked_in_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select r.id,
    r.attendee_name,
    (select t.name from ticket_types t where t.id = r.ticket_type_id),
    r.status,
    (r.status = 'checked_in'),
    r.checked_in_at
  from registrations r
  where r.event_id = p_event_id
    and r.status in ('confirmed', 'checked_in', 'pending', 'pending_approval')
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
        or public.is_event_team_member(p_event_id)
      )
    )
  order by r.attendee_name;
$$;

grant execute on function public.list_event_attendees(uuid) to authenticated;


-- ── 2. approve_registration (approve/reject a pending_approval attendee) ────
create or replace function public.approve_registration(p_event_id uuid, p_registration_id uuid, p_action text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_owner     uuid;
  v_reg       registrations%rowtype;
  v_capacity  integer;
  v_confirmed integer;
begin
  if v_uid is null then
    return jsonb_build_object('result','error','message','Not signed in');
  end if;
  if p_action not in ('approve','reject') then
    return jsonb_build_object('result','error','message','Invalid action');
  end if;

  -- Ownership: event owner, an active organizer/staff member, OR a team
  -- member of the owner (matches can_manage_event() since 116).
  select user_id into v_owner from events where id = p_event_id;
  if v_owner is null then
    return jsonb_build_object('result','error','message','Event not found');
  end if;
  if v_owner <> v_uid and not exists (
    select 1 from user_event_roles
    where event_id = p_event_id and user_id = v_uid
      and role in ('staff','organizer') and status = 'active'
  ) and not public.is_event_team_member(p_event_id) then
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

-- ─────────────────────────────────────────────────────────────────────────────
-- Sanity check — run after applying, as a Studio team member with no owned
-- events and no user_event_roles row, against an event owned by the team's
-- owner:
--
--   select * from public.list_event_attendees('<event-uuid>');
--   -> should now return rows instead of an empty set.
-- ─────────────────────────────────────────────────────────────────────────────
