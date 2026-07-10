-- ============================================================================
-- 073_session_checkins.sql
--
-- Per-session (agenda-session) check-in for the mobile organizer app
-- (Organizer → Session check-in / scanner). Where 058_checkin_rpc.sql checks an
-- attendee into the EVENT, this records that a registration attended a specific
-- SESSION (talk/workshop). Same ownership + token-resolution pattern as 058:
-- SECURITY DEFINER enforces "event owner OR active staff" server-side.
--
--   checkin_session_by_token(p_event_id, p_session_id, p_qr_token) → jsonb
--       { status, attendee_name, ticket, checked_in_at, message }
--       status ∈ 'ok' | 'already' | 'invalid' | 'error'
--       Resolves the registration by qr_code_token (mirrors 058), records a
--       session check-in (idempotent → 'already' on duplicate), AND performs the
--       normal event check-in if the attendee isn't already checked in.
--   session_checkin_count(p_session_id) → int   (owner OR active staff; else 0)
--
-- "Active staff" = the event owner (events.user_id) OR a user_event_roles row
-- (from 055) with role in ('staff','organizer') and status = 'active'.
--
-- Idempotent. Apply in the Supabase SQL editor. Does NOT touch applied migrations.
-- ============================================================================

-- 1. Table.
create table if not exists public.session_checkins (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references public.sessions(id)       on delete cascade,
  event_id         uuid not null references public.events(id)         on delete cascade,
  registration_id  uuid not null references public.registrations(id)  on delete cascade,
  checked_in_at    timestamptz default now(),
  checked_in_by    uuid,
  unique (session_id, registration_id)
);

create index if not exists session_checkins_session_idx on public.session_checkins(session_id);
create index if not exists session_checkins_event_idx   on public.session_checkins(event_id);


-- 2. RLS: owner OR active staff read; owner writes (RPCs run SECURITY DEFINER).
alter table public.session_checkins enable row level security;

drop policy if exists "session_checkins: owner or staff read" on public.session_checkins;
create policy "session_checkins: owner or staff read" on public.session_checkins
  for select using (
    exists (select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
    or exists (
      select 1 from public.user_event_roles
      where event_id = session_checkins.event_id and user_id = auth.uid()
        and role in ('staff','organizer') and status = 'active'
    )
  );

drop policy if exists "session_checkins: owner or staff write" on public.session_checkins;
create policy "session_checkins: owner or staff write" on public.session_checkins
  for insert with check (
    exists (select 1 from public.events e where e.id = event_id and e.user_id = auth.uid())
    or exists (
      select 1 from public.user_event_roles
      where event_id = session_checkins.event_id and user_id = auth.uid()
        and role in ('staff','organizer') and status = 'active'
    )
  );


-- 2b. Drop ANY pre-existing version of these functions, whatever the signature.
--     `create or replace` cannot rename an input parameter (42P13) or change a
--     return type (42P16), so an older revision must be removed outright.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('checkin_session_by_token', 'session_checkin_count')
  loop
    execute format('drop function if exists %s cascade', r.sig);
  end loop;
end $$;


-- 3. checkin_session_by_token — resolve by QR token, record session check-in,
--    and roll up into the normal event check-in. Mirrors 058_checkin_rpc.sql.
create or replace function public.checkin_session_by_token(
  p_event_id   uuid,
  p_session_id uuid,
  p_qr_token   text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_owner     uuid;
  v_sess_evt  uuid;
  v_reg       registrations%rowtype;
  v_ticket    text;
  v_existing  timestamptz;
  v_now       timestamptz := now();
begin
  if v_uid is null then
    return jsonb_build_object('status','error','message','Not signed in');
  end if;

  -- Ownership: caller must own the event OR be assigned active event staff.
  select user_id into v_owner from public.events where id = p_event_id;
  if v_owner is null then
    return jsonb_build_object('status','error','message','Event not found');
  end if;
  if v_owner <> v_uid and not exists (
    select 1 from public.user_event_roles
    where event_id = p_event_id and user_id = v_uid
      and role in ('staff','organizer') and status = 'active'
  ) then
    return jsonb_build_object('status','error','message','Not authorised for this event');
  end if;

  -- The session must belong to this event.
  select event_id into v_sess_evt from public.sessions where id = p_session_id;
  if v_sess_evt is null or v_sess_evt <> p_event_id then
    return jsonb_build_object('status','invalid','message','Session not found for this event');
  end if;

  -- Resolve the registration by token within this event (same as 058).
  select * into v_reg from public.registrations
    where qr_code_token = p_qr_token and event_id = p_event_id;
  if not found then
    return jsonb_build_object('status','invalid',
      'message','QR not recognised — no registration for this event');
  end if;

  select name into v_ticket from public.ticket_types where id = v_reg.ticket_type_id;

  -- Block entry for cancelled/refunded or unpaid registrations (same as 058).
  if v_reg.status in ('cancelled','refunded') then
    return jsonb_build_object('status','invalid',
      'attendee_name', v_reg.attendee_name, 'ticket', v_ticket,
      'message','Registration is '|| v_reg.status ||' — entry not allowed');
  end if;
  if v_reg.payment_status in ('pending','failed') and coalesce(v_reg.amount_paid,0) > 0 then
    return jsonb_build_object('status','invalid',
      'attendee_name', v_reg.attendee_name, 'ticket', v_ticket,
      'message','Payment not completed — entry not allowed');
  end if;

  -- Roll up into the normal EVENT check-in if not already checked in.
  if v_reg.status <> 'checked_in' then
    update public.registrations
      set status = 'checked_in', checked_in_at = v_now, checked_in_by = v_uid
      where id = v_reg.id;
  end if;

  -- Has this registration already been checked into THIS session?
  select checked_in_at into v_existing
    from public.session_checkins
    where session_id = p_session_id and registration_id = v_reg.id;

  if v_existing is not null then
    return jsonb_build_object('status','already',
      'attendee_name', v_reg.attendee_name, 'ticket', v_ticket,
      'checked_in_at', v_existing, 'message','Already checked into this session');
  end if;

  -- Record the session check-in (idempotent guard on the unique constraint).
  insert into public.session_checkins (session_id, event_id, registration_id, checked_in_at, checked_in_by)
  values (p_session_id, p_event_id, v_reg.id, v_now, v_uid)
  on conflict (session_id, registration_id) do nothing;

  return jsonb_build_object('status','ok',
    'attendee_name', v_reg.attendee_name, 'ticket', v_ticket,
    'checked_in_at', v_now, 'message','Checked into session');
end;
$$;


-- 4. session_checkin_count — how many attendees checked into a session.
create or replace function public.session_checkin_count(p_session_id uuid)
returns int
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_event   uuid;
  v_owner   uuid;
  v_count   int;
begin
  if v_uid is null then return 0; end if;

  select event_id into v_event from public.sessions where id = p_session_id;
  if v_event is null then return 0; end if;

  select user_id into v_owner from public.events where id = v_event;
  if v_owner is null then return 0; end if;

  -- Owner, OR an active staff member for this event.
  if v_owner <> v_uid and not exists (
    select 1 from public.user_event_roles
    where event_id = v_event and user_id = v_uid
      and role in ('staff','organizer') and status = 'active'
  ) then
    return 0;  -- not authorised → 0
  end if;

  select count(*)::int into v_count
    from public.session_checkins
    where session_id = p_session_id;

  return coalesce(v_count, 0);
end;
$$;


grant execute on function public.checkin_session_by_token(uuid, uuid, text) to authenticated;
grant execute on function public.session_checkin_count(uuid)                to authenticated;
