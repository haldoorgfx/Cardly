-- ============================================================================
-- 121_qa_points_cap_race_guard.sql
--
-- WHAT THIS FIXES
--   app/api/events/[id]/q-and-a/route.ts caps leaderboard points at
--   SCORED_QUESTIONS_PER_EVENT (5) questions per attendee per event — read
--   the count of this attendee's existing 'question_asked' rows, then insert
--   a new one if under the cap. That's a classic read-then-write race:
--   several concurrent question submissions from the same attendee (a script
--   firing them in parallel, not just an accidental double-click) can each
--   read the SAME "3 scored so far" count before any of their inserts land,
--   and each one then passes `scored < cap` and inserts — so the cap is not
--   "at most 5", it's "at most 5 PLUS however many requests you fire at
--   once". The route's own comment notes this leaderboard "gets projected on
--   a screen at the venue", so this is a real reputational-manipulation
--   vector at a live event, not just an internal stat.
--
--   Unlike the poll/connection/message point-awards (deduplicated by the
--   `leaderboard_points_action_ref_uniq` index on a single ref_id, migration
--   113), a per-attendee COUNT cap across many different ref_ids can't be
--   expressed as a uniqueness constraint — it needs the count-check and the
--   insert to happen inside one locked transaction, the same idiom already
--   used for redeem_entitlement (097) and book_session_seat (107).
--
-- IDEMPOTENT: create or replace. Safe to re-run.
-- HOW TO APPLY: paste into the Supabase SQL editor and Run.
--
-- DEPENDS ON
--   • 113_leaderboard_points_dedup.sql → leaderboard_points table + index
-- ============================================================================


-- Returns true if the points were awarded, false if this attendee had
-- already reached the cap for this action type on this event.
create or replace function public.award_qa_points(
  p_event_id        uuid,
  p_registration_id uuid,
  p_question_id     uuid,
  p_points          int,
  p_cap             int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scored int;
begin
  -- Serialize concurrent calls for the SAME attendee+event so the
  -- count-then-insert below can never race. Different attendees, and
  -- different events, are completely unaffected — this never blocks
  -- unrelated traffic, only a burst from one registration on one event.
  perform pg_advisory_xact_lock(
    hashtextextended(p_event_id::text || ':' || p_registration_id::text || ':qa_points', 0)
  );

  select count(*) into v_scored
    from public.leaderboard_points
   where event_id = p_event_id
     and registration_id = p_registration_id
     and action_type = 'question_asked';

  if v_scored >= p_cap then
    return false;
  end if;

  insert into public.leaderboard_points (event_id, registration_id, action_type, points, ref_id)
  values (p_event_id, p_registration_id, 'question_asked', p_points, p_question_id);

  return true;
end;
$$;

-- Service-role only: called from the API route after the question insert has
-- already succeeded and ownership has already been verified there.
revoke all on function public.award_qa_points(uuid, uuid, uuid, int, int) from public, anon, authenticated;
grant execute on function public.award_qa_points(uuid, uuid, uuid, int, int) to service_role;
