-- ============================================================================
-- 107_session_capacity_atomic_booking.sql
--
-- WHAT THIS FIXES
--   `app/api/events/[id]/sessions/[sessionId]/book` computed capacity like this:
--
--       isFull = capacity != null && registrations_count >= capacity
--       ...
--       await admin.from('attendee_agendas').upsert({ ... })      -- ALWAYS runs
--       return { booked: !isFull, waitlisted: isFull }
--
--   Two separate defects:
--
--   1. CAPACITY WAS NEVER ENFORCED. The upsert ran unconditionally — `isFull`
--      only changed the JSON that came back. A 30-seat workshop accepted the
--      31st, 50th, 200th booking. The attendee saw the toast "Added to the
--      waitlist — we'll hold your spot if one opens" (ScheduleClient.tsx) while
--      the row written was byte-for-byte identical to a confirmed booking:
--      `attendee_agendas` has no waitlist column. So the "waitlisted" attendee
--      showed up on the organiser's list as booked, and turned up to a full
--      room. WorkshopsClient didn't even read `waitlisted` — it rendered plain
--      success either way.
--
--   2. IT WAS READ-THEN-WRITE. Even once (1) is fixed in route code, two people
--      taking the last seat concurrently both read registrations_count = 29
--      against a capacity of 30, and both insert.
--
--   This adds an RPC that does the capacity check and the insert in ONE
--   statement-level transaction, with the session row locked, so the last seat
--   can only be taken once.
--
-- WHY IT COUNTS ROWS INSTEAD OF TRUSTING registrations_count
--   `sessions.registrations_count` is only maintained by the trigger added in
--   099_session_registrations_count_trigger.sql. If 099 has not been applied —
--   or drifted before it was — the counter reads 0 forever and the cap never
--   engages. Counting `attendee_agendas` directly is the source of truth and is
--   self-correcting, and the row is cheap to count (attendee_agendas_session_idx).
--
-- IDEMPOTENT: create or replace. Safe to re-run.
--   HOW TO APPLY: paste into the Supabase SQL editor and Run.
--
-- DEPENDS ON
--   • 020_speakers_and_agenda → sessions, attendee_agendas
-- ============================================================================


-- Returns one of: 'booked' | 'already_booked' | 'full' | 'not_found'
create or replace function public.book_session_seat(
  p_event_id        uuid,
  p_session_id      uuid,
  p_registration_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity int;
  v_taken    int;
begin
  -- Lock the session row for the duration of the transaction. Concurrent
  -- callers for the SAME session serialise here, which is what makes the
  -- count-then-insert below safe. Different sessions never block each other.
  select capacity into v_capacity
    from public.sessions
   where id = p_session_id
     and event_id = p_event_id
   for update;

  if not found then
    return 'not_found';
  end if;

  -- Already on this attendee's agenda → idempotent success, never a second row
  -- and never a second seat consumed.
  if exists (
    select 1 from public.attendee_agendas
     where session_id = p_session_id
       and registration_id = p_registration_id
  ) then
    return 'already_booked';
  end if;

  -- null capacity = uncapped session, skip the check entirely.
  if v_capacity is not null then
    select count(*) into v_taken
      from public.attendee_agendas
     where session_id = p_session_id;

    if v_taken >= v_capacity then
      return 'full';
    end if;
  end if;

  insert into public.attendee_agendas (registration_id, session_id)
  values (p_registration_id, p_session_id)
  on conflict (registration_id, session_id) do nothing;

  return 'booked';
end;
$$;

revoke all on function public.book_session_seat(uuid, uuid, uuid) from public, anon;
grant execute on function public.book_session_seat(uuid, uuid, uuid) to service_role;
