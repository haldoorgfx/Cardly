-- ============================================================================
-- 099_session_registrations_count_trigger.sql
--
-- WHAT THIS FIXES
--   `sessions.registrations_count` (020_speakers_and_agenda.sql) was declared
--   `not null default 0` but NOTHING ever maintained it — no trigger, no RPC,
--   and neither the session book route (app/api/events/[id]/sessions/[sessionId]/book)
--   nor the remove route (app/api/sessions/[sessionId]/agenda) touched it.
--   As a result the book route's capacity check —
--       isFull = capacity != null && registrations_count >= capacity
--   was ALWAYS false, so a capacity-limited session could be over-booked without
--   limit and the "you're on the waitlist" response could never fire.
--
--   This adds a trigger that keeps `registrations_count` in lockstep with the
--   actual rows in `attendee_agendas`, then backfills existing sessions once.
--   The book route needs no change — it already reads the column; it just now
--   reads a truthful value.
--
-- WHY A TRIGGER (not route logic)
--   `attendee_agendas` is written from several places (book route upsert, the
--   legacy agenda route, cascade deletes when a registration is removed). A DB
--   trigger is the only spot that catches every path atomically, including
--   ON DELETE CASCADE from registrations/sessions. A read-modify-write in one
--   route would race and miss the others.
--
-- DEPENDS ON
--   • 020_speakers_and_agenda → sessions.registrations_count, attendee_agendas
--
-- IDEMPOTENT: create or replace function, drop trigger if exists + recreate,
--   and a backfill that SETs (not increments) the count. Safe to re-run.
--   HOW TO APPLY: paste into the Supabase SQL editor and Run.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Trigger function — bump the owning session's counter by ±1.
--    Guarded with greatest(...,0) so a stray double-delete can't drive it
--    negative.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.sync_session_registrations_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.sessions
       set registrations_count = registrations_count + 1
     where id = new.session_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.sessions
       set registrations_count = greatest(registrations_count - 1, 0)
     where id = old.session_id;
    return old;
  end if;
  return null;
end;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Attach AFTER INSERT / AFTER DELETE triggers.
--    The book route upserts with ON CONFLICT DO NOTHING, so re-booking the same
--    session does NOT fire a second INSERT — no double counting.
-- ─────────────────────────────────────────────────────────────────────────────
drop trigger if exists trg_attendee_agendas_count_ins on public.attendee_agendas;
create trigger trg_attendee_agendas_count_ins
  after insert on public.attendee_agendas
  for each row execute function public.sync_session_registrations_count();

drop trigger if exists trg_attendee_agendas_count_del on public.attendee_agendas;
create trigger trg_attendee_agendas_count_del
  after delete on public.attendee_agendas
  for each row execute function public.sync_session_registrations_count();


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. One-time backfill — set every session's counter to its true row count so
--    the triggers start from an accurate baseline (fixes any drift to date).
-- ─────────────────────────────────────────────────────────────────────────────
update public.sessions s
   set registrations_count = coalesce(a.cnt, 0)
  from (
    select session_id, count(*)::int as cnt
      from public.attendee_agendas
     group by session_id
  ) a
 where a.session_id = s.id;

-- Sessions with zero agenda rows won't match the join above — zero them out
-- explicitly so a stale non-zero value can't survive the backfill.
update public.sessions s
   set registrations_count = 0
 where not exists (
   select 1 from public.attendee_agendas a where a.session_id = s.id
 )
   and s.registrations_count <> 0;
