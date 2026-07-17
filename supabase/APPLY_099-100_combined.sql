-- ============================================================================
-- APPLY_099-100_combined.sql
-- Paste this WHOLE file into the Supabase SQL editor and Run (one shot).
-- Both migrations are idempotent — safe to re-run. They unblock two mobile
-- (and web) features that currently error in production:
--   099 → session waitlist counter (sessions.registrations_count trigger)
--   100 → registrations.attendee_data column (group-register, approvals,
--         apply-to-event, CSV export — all 42703 today without it).
-- Generated 2026-07-17T21:24Z from supabase/099_* + supabase/100_*.
-- ============================================================================

-- ─── 099_session_registrations_count_trigger.sql ───────────────────────────
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


-- ─── 100_registrations_attendee_data.sql ───────────────────────────────────
-- ============================================================================
-- 100_registrations_attendee_data.sql
--
-- WHAT THIS FIXES  (root-caused live: prod returns
--   `42703 column registrations.attendee_data does not exist`)
--
--   A pile of app code reads/writes `registrations.attendee_data` — but no
--   migration ever added that column to `registrations` (017 created the table
--   with `custom_fields`; the only `attendee_data` in the whole schema is on
--   `generated_cards`, 001). It was almost certainly lost in the 044–050 /
--   080+ renumbering shuffle. Every one of these surfaces has therefore been
--   failing in production with a hard PostgREST 400:
--
--     • Group registration insert  — app/api/events/[id]/group-register
--                                     + eventera_mobile addGroup()  (THE reported bug)
--     • Apply-to-event insert       — app/api/events/[id]/apply     (attendee_data: { answers })
--     • Approvals list read         — app/(app)/events/[id]/approvals/page.tsx + /approvals route
--     • CSV export read             — app/api/events/[id]/export
--
--   The code is consistent and correct about WANTING this column; the schema
--   simply lost it. Adding it (rather than rewriting six call sites onto
--   `custom_fields`, which the main register route uses for a different
--   purpose — the registration form answers) restores the intended shape with
--   zero code churn and unbreaks all four surfaces at once. Nullable + default
--   '{}' so existing rows backfill cleanly and the null-coalescing readers
--   (`attendee_data as Record | null`) keep working.
--
-- IDEMPOTENT: add column if not exists. Safe to re-run.
--   HOW TO APPLY: paste into the Supabase SQL editor and Run.
-- ============================================================================

alter table public.registrations
  add column if not exists attendee_data jsonb default '{}'::jsonb;
