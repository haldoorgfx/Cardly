-- ============================================================================
-- APPLY_105-120_combined.sql — everything EXCEPT migration 116
--
-- Paste this WHOLE file into the Supabase SQL editor and Run, once. Every
-- statement in every migration below is idempotent (create or replace,
-- drop ... if exists, if not exists), so re-running this file is safe even
-- if some of these were already applied by hand.
--
-- 116 is DELIBERATELY NOT in this file. It reproduces migration 080's body of
-- can_manage_event() and adds one clause — but 051-104 are not in this repo,
-- so this file cannot prove it knows the CURRENT body. If something in that
-- missing range added another clause, a blind create-or-replace would
-- silently drop it and revoke someone's access. 116 needs you to run one
-- read-only query and eyeball the result first — see
-- APPLY_116_teams_READ_THIS_FIRST.sql for that single extra step.
--
-- Order below matches docs/MIGRATIONS-PENDING.md. Full explanation of what
-- each one fixes and why lives in that file and in each source migration's
-- own header, preserved below.
-- ============================================================================


-- ============================================================================
-- 105 — from supabase/migrations/105_promo_redemption_tracking.sql
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 105 · Promo redemption tracking
--
-- WHY: promo_codes.uses_count was incremented at registration-CREATE time, but
-- nothing recorded WHICH code a registration used. Two consequences:
--
--   1. A paid attendee who abandons Stripe/Flutterwave and retries has their
--      stale 'pending' registration deleted and a fresh one inserted — which
--      incremented the code a SECOND time. A max_uses = 10 code could be burnt
--      to zero by one person retrying checkout ten times, locking every real
--      buyer out ("This promo code has reached its usage limit") while zero
--      tickets were actually sold.
--   2. There was no audit trail at all — an organizer could not see which
--      registrations a discount was applied to, and finance could not reconcile
--      a discounted amount_paid back to the code that produced it.
--
-- This adds the missing link column plus a floored decrement RPC so the delete
-- side of a retry gives the use back.
--
-- Safe to apply at any time; the app writes promo_code_id defensively and keeps
-- working (minus the retry refund) until this is applied.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS promo_code_id uuid REFERENCES promo_codes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS registrations_promo_code_idx
  ON registrations(promo_code_id)
  WHERE promo_code_id IS NOT NULL;

-- Mirror of increment_promo_code_uses (migration 017). Atomic, floored at 0 so a
-- double-release can never drive the counter negative, and silent when the row
-- is gone or already at 0 — releasing a use is best-effort cleanup, never fatal
-- to the request that triggered it.
CREATE OR REPLACE FUNCTION decrement_promo_code_uses(code_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE promo_codes
  SET    uses_count = uses_count - 1
  WHERE  id = code_id
  AND    uses_count > 0;
END;
$$;


-- ============================================================================
-- 106 — from supabase/migrations/106_checkin_rpc_race_guard.sql
-- ============================================================================

-- 106_checkin_rpc_race_guard.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- WHY: checkin_registration() and checkin_registration_by_id() (last defined in
-- 070_fix_checkin_rpcs.sql and 064_checkin_by_id.sql) both read the row, decide
-- the answer, and THEN write — with nothing in the UPDATE's WHERE clause tying
-- the write to the state they read:
--
--     select * into v_reg from registrations where ...;   -- sees 'confirmed'
--     if v_reg.status = 'checked_in' then ... end if;     -- not taken
--     update registrations set status = 'checked_in' where id = v_reg.id;
--
-- At the door that means: two staff phones scan the same QR at the same
-- instant, both SELECT 'confirmed' before either commits, and BOTH return
-- result='success' with a green tick and a success beep. One ticket, two
-- unmistakable "come in" signals — the second person walks in on a ticket that
-- was already used, and neither staff member has any way to know. The web route
-- (app/api/events/[id]/checkin/route.ts) already got this right by putting the
-- expected state in the UPDATE and treating "0 rows" as the lost race; these
-- RPCs — the path the MOBILE scanner uses — never did.
--
-- FIX: move the state transition into the UPDATE's WHERE clause
-- (`and status <> 'checked_in'`) and branch on whether a row came back.
-- Postgres serializes the two concurrent UPDATEs on the row lock; the loser
-- re-evaluates the WHERE against the winner's committed row, matches nothing,
-- and now correctly reports 'already_checked_in' — with the WINNER's real
-- check-in time, so the two phones agree about what happened.
--
-- Nothing else changes: same signatures, same result shapes, same auth ladder,
-- same event-scoped lookup. Safe to re-run.
-- Paste the whole file into the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. checkin_registration (QR scanner — check in by token) ────────────────
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
  v_now    timestamptz;
  v_rows   int;
  v_at     timestamptz;
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

  -- Find the registration for this token WITHIN THIS EVENT. Scoping the lookup
  -- by event_id is what stops event A's ticket opening event B's door.
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

  v_now := now();

  -- The transition is guarded IN the UPDATE, not by the read above: only the
  -- first of two concurrent scans matches `status <> 'checked_in'`.
  update registrations
    set status = 'checked_in', checked_in_at = v_now, checked_in_by = v_uid
    where id = v_reg.id
      and status <> 'checked_in';
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    -- Lost the race: another scanner checked this person in between our read
    -- and our write. Report the WINNER's timestamp, never a success.
    select checked_in_at into v_at from registrations where id = v_reg.id;
    return jsonb_build_object('result','already_checked_in',
      'attendee_name', v_reg.attendee_name, 'ticket', v_ticket,
      'checked_in_at', v_at, 'message','Already checked in');
  end if;

  return jsonb_build_object('result','success',
    'attendee_name', v_reg.attendee_name, 'ticket', v_ticket,
    'checked_in_at', v_now, 'message','Checked in');
end;
$$;

grant execute on function public.checkin_registration(uuid, text) to authenticated;


-- ── 2. checkin_registration_by_id (manual check-in from the attendee list) ──
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
  v_now    timestamptz;
  v_rows   int;
  v_at     timestamptz;
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

  -- Event-scoped lookup: a registration id from another event is 'invalid'.
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

  v_now := now();

  -- Same guarded transition as checkin_registration above: two staff tapping
  -- "check in" on the same row at once must not both see success.
  update registrations
    set status = 'checked_in', checked_in_at = v_now, checked_in_by = v_uid
    where id = v_reg.id
      and status <> 'checked_in';
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    select checked_in_at into v_at from registrations where id = v_reg.id;
    return jsonb_build_object('result','already_checked_in',
      'attendee_name', v_reg.attendee_name, 'ticket', v_ticket,
      'checked_in_at', v_at, 'message','Already checked in');
  end if;

  return jsonb_build_object('result','success',
    'attendee_name', v_reg.attendee_name, 'ticket', v_ticket,
    'checked_in_at', v_now, 'message','Checked in');
end;
$$;

grant execute on function public.checkin_registration_by_id(uuid, uuid) to authenticated;


-- ============================================================================
-- 107 — from supabase/107_session_capacity_atomic_booking.sql
-- ============================================================================

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


-- ============================================================================
-- 108 — from supabase/migrations/108_poll_vote_counter_integrity.sql
-- ============================================================================

-- 108 — Poll vote counter integrity
--
-- `cast_poll_vote` (migration 021) inserted the vote with
-- `on conflict (poll_id, registration_id) do nothing` — correct — but then ran
-- `update poll_options set votes_count = votes_count + 1` UNCONDITIONALLY.
-- So the one-vote-per-attendee guard only protected the poll_votes table: a
-- single attendee replaying the vote request N times added N to the displayed
-- tally, letting one person decide the result projected on the live display.
--
-- Fix: only bump the counter when a row was actually inserted. Also refuse
-- votes on a poll that is closed, or where the option belongs to a different
-- poll (which used to increment that unrelated poll's option instead).
--
-- Safe to re-run — create or replace only, no data change.

create or replace function cast_poll_vote(p_poll_id uuid, p_option_id uuid, p_registration_id uuid)
returns void language plpgsql security definer as $$
declare v_inserted int;
begin
  -- The option must belong to the poll being voted on.
  if not exists (
    select 1 from poll_options where id = p_option_id and poll_id = p_poll_id
  ) then
    raise exception 'Option does not belong to this poll';
  end if;

  -- The poll must be open.
  if exists (select 1 from polls where id = p_poll_id and is_closed) then
    raise exception 'This poll is closed';
  end if;

  insert into poll_votes(poll_id, option_id, registration_id)
  values (p_poll_id, p_option_id, p_registration_id)
  on conflict (poll_id, registration_id) do nothing;

  get diagnostics v_inserted = row_count;

  -- Only a vote that was genuinely recorded moves the counter. Repeat calls
  -- from the same registration are now no-ops rather than free votes.
  if v_inserted > 0 then
    update poll_options set votes_count = votes_count + 1 where id = p_option_id;
  end if;
end;
$$;

-- Re-derive every option's counter from the poll_votes table, healing any
-- inflation already banked before this fix landed.
update poll_options o
set votes_count = (select count(*)::int from poll_votes v where v.option_id = o.id)
where o.votes_count is distinct from (select count(*)::int from poll_votes v where v.option_id = o.id);


-- ============================================================================
-- 110 — from supabase/migrations/110_storage_policy_hardening.sql
-- ============================================================================

-- Migration 110: lock down the `uploads` and `event-assets` Storage policies.
--
-- Migration 050 created these buckets with policies named "owner update" /
-- "owner delete" that never actually checked an owner:
--
--   create policy "uploads: owner delete" on storage.objects
--     for delete to authenticated using (bucket_id = 'uploads');
--
-- The only predicate is the bucket id. Any signed-in user (a free account is
-- enough) holding the public anon key could therefore, without ever touching
-- our API routes:
--   * overwrite another user's avatar — the web and mobile clients write to the
--     deterministic path `avatars/<user-id>.jpg`, so the victim's path is
--     guessable from their profile id;
--   * delete EVERY object in `event-assets` — that is every sponsor logo,
--     session slide deck and application-form file on the platform, for every
--     event, in one scripted loop;
--   * insert arbitrary objects at arbitrary paths in either bucket, which is
--     also an unbounded storage-cost surface (no bucket size or MIME limits).
--
-- Fixes:
--   1. `uploads` INSERT is scoped to the caller's own `avatars/<uid>...` path.
--      That covers all four legitimate call sites — ProfileSettings.tsx,
--      OnboardingWizard.tsx, and the three Flutter screens — which all write
--      `avatars/<uid>` or `avatars/<uid>-<ts>`.
--   2. `uploads` UPDATE/DELETE require the caller to be the object's owner.
--      `owner_id` (text) is the current column; `owner` (uuid) is the legacy
--      one — coalesce so this works on either Storage version.
--   3. `event-assets` gets NO authenticated write policies at all. Every write
--      to that bucket goes through a server route using the service-role key,
--      which bypasses RLS entirely, so client-side write access was pure
--      attack surface with no legitimate user.
--   4. Bucket-level size and MIME caps, so a direct anon-key upload can't
--      bypass the per-route size checks in our API handlers.
--
-- Public read is preserved on both buckets — the public URLs are used on
-- attendee-facing pages.
--
-- NOTE: migrations 051-104 are not present in this repo, so a later migration
-- may have already added differently-named policies on storage.objects. This
-- file only replaces the exact policy names created by 050. After applying,
-- verify nothing permissive survives:
--
--   select policyname, cmd, qual, with_check
--     from pg_policies
--    where schemaname = 'storage' and tablename = 'objects'
--    order by policyname;
--
-- Idempotent.

-- ── uploads: avatars only, owner-scoped ──────────────────────────────────────

drop policy if exists "uploads: authenticated insert" on storage.objects;
create policy "uploads: own avatar insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'uploads'
    and name like 'avatars/' || auth.uid()::text || '%'
  );

drop policy if exists "uploads: owner update" on storage.objects;
create policy "uploads: owner update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'uploads'
    and coalesce(owner_id, owner::text) = auth.uid()::text
  );

drop policy if exists "uploads: owner delete" on storage.objects;
create policy "uploads: owner delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'uploads'
    and coalesce(owner_id, owner::text) = auth.uid()::text
  );

-- public read stays as-is (recreated for idempotency)
drop policy if exists "uploads: public read" on storage.objects;
create policy "uploads: public read" on storage.objects
  for select to public using (bucket_id = 'uploads');

-- ── event-assets: server-side writes only ────────────────────────────────────
-- Service-role writes bypass RLS, so removing these leaves every legitimate
-- upload route working while closing client-side write access completely.

drop policy if exists "event-assets: authenticated insert" on storage.objects;
drop policy if exists "event-assets: owner update" on storage.objects;
drop policy if exists "event-assets: owner delete" on storage.objects;

drop policy if exists "event-assets: public read" on storage.objects;
create policy "event-assets: public read" on storage.objects
  for select to public using (bucket_id = 'event-assets');

-- ── Bucket-level caps ────────────────────────────────────────────────────────
-- Backstop for the per-route size checks: a direct anon-key upload can't
-- exceed these even though it never runs our handler code.

update storage.buckets
   set file_size_limit = 10485760,  -- 10 MB
       allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
 where id = 'uploads';

-- event-assets also holds slide decks and application-form files, which are
-- legitimately non-image and larger; the routes cap those at 20-25 MB.
update storage.buckets
   set file_size_limit = 26214400  -- 25 MB
 where id = 'event-assets';


-- ============================================================================
-- 113 — from supabase/migrations/113_leaderboard_points_dedup.sql
-- ============================================================================

-- 113 — Stop the same action being scored twice on the leaderboard
--
-- WHY: leaderboard_points had no uniqueness of any kind. Every award path was
-- a check-then-insert in application code, which is a race: two requests that
-- both pass the check both insert. On a leaderboard that gets projected on a
-- screen at the venue, that is a visible, public wrong answer.
--
-- The application fixes (connections award only on a genuinely new link, Q&A
-- caps scored questions per event) close the ordinary cases. This closes the
-- concurrent one, and makes a future award path that forgets to dedup fail
-- loudly instead of silently inflating someone's score.
--
-- Partial, because ref_id is nullable: rows with no reference (legacy
-- connection awards written before ref_id was populated, and any future action
-- that genuinely has no target) are left alone rather than being collapsed
-- into one another.
--
-- NOTE: existing duplicate rows are NOT removed — this only prevents new ones.
-- To see what is already double-counted before deciding whether to clean up:
--
--   select registration_id, action_type, ref_id, count(*)
--   from public.leaderboard_points
--   where ref_id is not null
--   group by 1,2,3 having count(*) > 1
--   order by count(*) desc;
--
-- If that returns rows, the index below will FAIL to create until they are
-- resolved. Deduplicate with:
--
--   delete from public.leaderboard_points p using public.leaderboard_points q
--   where p.ctid > q.ctid
--     and p.registration_id = q.registration_id
--     and p.action_type     = q.action_type
--     and p.ref_id          = q.ref_id
--     and p.ref_id is not null;

create unique index if not exists leaderboard_points_action_ref_uniq
  on public.leaderboard_points (registration_id, action_type, ref_id)
  where ref_id is not null;


-- ============================================================================
-- 115 — from supabase/migrations/115_waitlist_invite_and_unredeem_integrity.sql
-- ============================================================================

-- ============================================================================
-- 115_waitlist_invite_and_unredeem_integrity.sql
--
-- Two independent integrity fixes found in the waitlist + entitlements audit.
-- IDEMPOTENT (create or replace / if not exists). Safe to re-run.
-- HOW TO APPLY: paste this whole file into the Supabase SQL editor and Run.
--
-- Shipped app code works BEFORE this is applied: the waitlist route falls back
-- to its previous read-then-write path when invite_waitlist_entry() is absent,
-- and unredeem_entitlement() keeps its 080 behaviour until replaced here.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Atomic waitlist invite (waiting → invited, capacity-checked in ONE stmt).
--
--    The API route checked capacity with a SELECT count, then UPDATEd the entry
--    in a second statement. Two organizers (or two tabs) inviting at the same
--    instant with one seat left both read "room for one" and both promoted an
--    entry — two people emailed "a spot opened for you" for a single seat, and
--    whoever registers second is turned away at the door.
--
--    Fix uses this repo's established idiom: the precondition lives inside the
--    UPDATE's WHERE clause, so only the first transition returns a row.
--    Seats consumed = confirmed/checked_in registrations PLUS outstanding
--    invites (an unclaimed invite is a promise against a seat; ignoring them
--    is what let the queue be over-promised in the first place).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.invite_waitlist_entry(p_entry_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_page_id   uuid;
  v_event_id  uuid;
  v_cap       int;
  v_updated   uuid;
begin
  select we.event_page_id, ep.event_id, ep.max_capacity
    into v_page_id, v_event_id, v_cap
    from public.waitlist_entries we
    join public.event_pages ep on ep.id = we.event_page_id
   where we.id = p_entry_id;

  if v_page_id is null then
    return jsonb_build_object('status','error','message','Entry not found');
  end if;

  update public.waitlist_entries w
     set status = 'invited',
         notified_at = now()
   where w.id = p_entry_id
     and w.status = 'waiting'
     -- Capacity precondition, evaluated inside the UPDATE so two concurrent
     -- invites cannot both satisfy it against the same free seat.
     and (
       v_cap is null or v_cap <= 0 or v_event_id is null
       or (
         (select count(*) from public.registrations r
           where r.event_id = v_event_id
             and r.status in ('confirmed','checked_in'))
         + (select count(*) from public.waitlist_entries o
             where o.event_page_id = v_page_id
               and o.status = 'invited')
       ) < v_cap
     )
  returning w.id into v_updated;

  if v_updated is null then
    -- Distinguish "already invited/gone" from "no seat" so the UI can say why.
    if exists (select 1 from public.waitlist_entries w
                where w.id = p_entry_id and w.status <> 'waiting') then
      return jsonb_build_object('status','already_invited');
    end if;
    return jsonb_build_object('status','full');
  end if;

  return jsonb_build_object('status','ok');
end;
$$;

-- Service-role only: the API route re-derives and verifies event ownership
-- before calling, and the service role has no auth.uid() for an in-RPC check.
revoke all on function public.invite_waitlist_entry(uuid) from public;
revoke all on function public.invite_waitlist_entry(uuid) from authenticated;
revoke all on function public.invite_waitlist_entry(uuid) from anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Un-redeem can only reverse a real, un-reversed redemption.
--
--    080's unredeem_entitlement() accepted ANY entitlement_redemptions row id
--    and unconditionally appended an 'un_redeemed' row. The redeem ladder
--    computes  active = count(redeemed) - count(un_redeemed), so:
--      • reversing the same redemption twice (two staff with the page open,
--        both clicking "un-redeem" on the same stale row) drives active to -1
--      • reversing a row that was never a successful redemption (a 'granted'
--        row, or a redeem attempt that came back 'already') does the same
--    A negative count means the next scan of a once-only meal voucher returns
--    'redeemed' again — one free meal per stray reversal, real money.
--
--    Fix: a partial unique index makes a second reversal of the same redemption
--    physically impossible even under a race, and the RPC now refuses rows that
--    are not a live successful redemption.
-- ─────────────────────────────────────────────────────────────────────────────
create unique index if not exists entitlement_redemptions_reverses_uidx
  on public.entitlement_redemptions (reverses_id)
  where reverses_id is not null;

create or replace function public.unredeem_entitlement(
  p_redemption_id uuid,
  p_reason        text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_orig public.entitlement_redemptions%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('status','error','message','Not signed in');
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    return jsonb_build_object('status','error','message','A reason is required to un-redeem');
  end if;

  select * into v_orig from public.entitlement_redemptions where id = p_redemption_id;
  if not found then
    return jsonb_build_object('status','error','message','Redemption not found');
  end if;
  if not public.can_manage_event(v_orig.event_id) then
    return jsonb_build_object('status','error','message','Not authorised for this event');
  end if;

  -- Only a live, successful redemption can be reversed. A 'granted' row, an
  -- 'already'/'not_entitled' attempt, or a row that lost an offline conflict
  -- was never a consumed perk, so reversing it would manufacture a credit.
  if v_orig.action <> 'redeemed' or v_orig.status <> 'redeemed' or v_orig.superseded_by is not null then
    return jsonb_build_object('status','error','message','That entry is not a redemption that can be un-redeemed');
  end if;

  begin
    insert into public.entitlement_redemptions(
      entitlement_id, registration_id, event_id, action, status,
      reason, performed_by, day_index, reverses_id
    ) values (
      v_orig.entitlement_id, v_orig.registration_id, v_orig.event_id, 'un_redeemed', 'ok',
      p_reason, v_uid, v_orig.day_index, v_orig.id
    );
  exception when unique_violation then
    -- Someone else reversed this exact redemption first — not an error, just
    -- already done. Return current state rather than double-crediting.
    return public._entitlement_scan_result(v_orig.registration_id, v_orig.entitlement_id, 'ok');
  end;

  return public._entitlement_scan_result(v_orig.registration_id, v_orig.entitlement_id, 'ok');
end;
$$;

revoke all on function public.unredeem_entitlement(uuid, text) from public;
grant execute on function public.unredeem_entitlement(uuid, text) to authenticated;


-- ============================================================================
-- 117 — from supabase/migrations/117_exhibitor_products_published_only.sql
-- ============================================================================

-- 117_exhibitor_products_published_only.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Paste the WHOLE file into the Supabase SQL editor and run once.
-- Safe + idempotent (re-runnable).
--
-- WHAT IS WRONG TODAY
-- Migration 060 created the exhibitor product showcase with a deliberately
-- public read policy, so the products could be listed on the public booth
-- directory:
--
--     create policy exhibitor_products_read on exhibitor_products
--       for select using (true);
--
-- The intent (a public directory) is right, but `using (true)` is wider than
-- the intent. It does not look at the event at all, so it also publishes the
-- products of events that are still `draft` or have been `archived`. Verified
-- against production on 2026-07-21 with nothing but the browser-exposed anon
-- key and no Authorization header:
--
--     GET /rest/v1/exhibitor_products?select=*   →  200, full rows
--
-- Every other public surface in this schema is gated on publication — see
-- 001_initial_schema.sql, where the events policy is
-- `for select using (status = 'published')`. This table simply never got the
-- same treatment.
--
-- THE CONSEQUENCE
-- An exhibitor filling in their booth before launch expects that work to be
-- private until the organizer publishes. Instead the product names, blurbs and
-- image URLs of an unannounced event are world-readable in advance — an
-- unreleased line-up, sponsor roster or product reveal leaks ahead of the
-- announcement, to anyone who reads the anon key out of the page source.
--
-- THE FIX
-- Keep the read public — the directory genuinely is public — but scope it to
-- events that are actually published, matching the events table's own rule.
-- Writes are untouched: they were already correctly restricted to the sponsor's
-- own team / the event organizer, and a write probe from the anon key returned
-- 42501 (RLS violation) as it should.
--
-- WHY THIS DOES NOT BREAK THE EXHIBITOR PORTAL
-- The token-gated portal (app/exhibitor/[token]/products) and its API route
-- (app/api/exhibitor/products) both go through createAdminClient() — the
-- SERVICE-ROLE client, which bypasses RLS entirely. So an exhibitor still sees
-- and edits their own products on a draft event exactly as before. Only the
-- anonymous public read narrows.
-- ─────────────────────────────────────────────────────────────────────────────

do $$ begin
  if to_regclass('public.exhibitor_products') is not null then
    alter table public.exhibitor_products enable row level security;

    -- Replace 060's unconditional public read.
    drop policy if exists exhibitor_products_read on public.exhibitor_products;
    drop policy if exists exhibitor_products_read_published on public.exhibitor_products;

    create policy exhibitor_products_read_published on public.exhibitor_products
      for select using (
        exists (
          select 1 from public.events e
          where e.id = exhibitor_products.event_id
            and e.status = 'published'
        )
      );
  end if;
end $$;


-- ── Sanity check ─────────────────────────────────────────────────────────────
-- Re-run as an ANONYMOUS caller (public anon apikey, no Authorization header):
--
--   /rest/v1/exhibitor_products?select=id,event_id
--
-- Every event_id returned must belong to a published event. Products attached
-- to a draft or archived event must no longer appear. The exhibitor token
-- portal must still list and edit those same products unchanged, because it
-- reads them with the service-role client.


-- ============================================================================
-- 118 — from supabase/migrations/118_sync_profile_email_on_change.sql
-- ============================================================================

-- 118: keep public.profiles.email in sync with auth.users.email
--
-- Migration 001 created `handle_new_user`, which copies the email into
-- public.profiles on INSERT only. Nothing ever updated it again, so from the
-- moment a user changed their sign-in email the two disagreed permanently.
--
-- That matters far more than a stale display string, because profiles.email is
-- used as an AUTHORIZATION key in several places:
--
--   lib/rbac/ownership.ts      speaker / sponsor record ownership
--   lib/rbac/sections.ts       which dashboard sections you can see
--   lib/workspace/eventRoles.ts, lib/rbac/context.ts
--   app/api/billing/*          the address Stripe bills and receipts
--   app/api/render/route.ts    where card-download notifications are sent
--
-- Two concrete consequences of the drift:
--   1. Change your email, and speaker/sponsor portal access keyed to your NEW
--      address is never granted — while access keyed to the OLD one persists.
--   2. THE OLD ADDRESS BECOMES PERMANENTLY UNUSABLE FOR SIGNUP. Once you vacate
--      it, someone else can create an auth.users row with it — but
--      `profiles.email` is UNIQUE (001), your stale row still holds that
--      address, and `handle_new_user` inserts with no `on conflict`. The trigger
--      raises, and because it is AFTER INSERT in the same transaction the
--      auth.users insert rolls back with it. Their signup fails outright, with
--      an opaque error, and will keep failing forever.
--
--      (An earlier draft of this file claimed the two accounts would instead
--      SHARE speaker/sponsor ownership through the duplicate email. They cannot
--      — the unique constraint makes that state unreachable. The failure is a
--      blocked signup, not a shared identity. Recorded because the wrong version
--      is the more intuitive one and will be re-derived otherwise.)
--
-- The trigger is the canonical fix: it covers every path that can change an
-- email (web, mobile, the Supabase dashboard, admin API) rather than only the
-- one the web app happens to call. app/auth/callback/route.ts additionally
-- reconciles opportunistically so confirmed changes self-heal even before this
-- migration is applied.
--
-- Note the guard on `new.email is distinct from old.email` — auth.users is
-- updated on every sign-in (last_sign_in_at), and without it this would fire a
-- pointless profiles UPDATE on each one.

create or replace function public.sync_profile_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
     set email = new.email
   where id = new.id
     and email is distinct from new.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (new.email is distinct from old.email)
  execute function public.sync_profile_email();

-- One-off backfill for accounts that already drifted before this shipped.
-- auth.users is the source of truth: it is what the user actually signs in with.
--
-- The `not exists` guard matters. profiles.email is UNIQUE, so if some OTHER
-- profile row already holds the address we are about to write, this UPDATE
-- would raise — and because it is one statement, it would abort the entire
-- migration, including the trigger above. Skipping the conflicting rows means
-- the trigger still lands and the rest of the backfill still runs; the
-- stragglers are then reported below rather than silently dropped.
update public.profiles p
   set email = u.email
  from auth.users u
 where u.id = p.id
   and p.email is distinct from u.email
   and not exists (
     select 1 from public.profiles other
      where other.email = u.email
        and other.id <> p.id
   );

-- Report anything the guard skipped. These are genuine conflicts — two profiles
-- laying claim to one address — and they need a human to decide which account
-- keeps it. Expected to be zero: the unique constraint has been in place since
-- 001, so a duplicate can only exist if it predates it or was written directly.
do $$
declare n int;
begin
  select count(*) into n
    from public.profiles p
    join auth.users u on u.id = p.id
   where p.email is distinct from u.email;

  if n > 0 then
    raise notice
      'sync_profile_email: % profile row(s) still disagree with auth.users and were skipped because another profile already holds the target address. Run the SELECT in the comment below to see them.', n;
  end if;
end $$;

-- To inspect the stragglers, if the notice above reported any:
--
--   select p.id, p.email as profile_email, u.email as auth_email
--     from public.profiles p
--     join auth.users u on u.id = p.id
--    where p.email is distinct from u.email;


-- ============================================================================
-- 119 — from supabase/migrations/119_networking_public_all_policy_removal.sql
-- ============================================================================

-- 119_networking_public_all_policy_removal.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Paste the WHOLE file into the Supabase SQL editor and run once.
-- Safe + idempotent (re-runnable).
--
-- WHAT IS WRONG TODAY
-- Migration 021_networking_qa_polls.sql created the private-messaging tables
-- and then handed them to everybody:
--
--     create policy public_all on attendee_connections for all using (true) with check (true);
--     create policy public_all on message_threads      for all using (true) with check (true);
--     create policy public_all on messages             for all using (true) with check (true);
--
-- `for all using (true) with check (true)` is not a read policy. It is SELECT,
-- INSERT, UPDATE and DELETE, unconditionally, for the `anon` role — i.e. for
-- anyone holding the anon key, which ships in the browser bundle of every page
-- on the site. On the `messages` table that is the full text of every private
-- conversation between every attendee on the platform, readable without an
-- account, plus the ability to forge a message from any sender and to delete
-- correspondence.
--
-- The stated reason in 021 was "attendees use qr_code_token, not auth". That is
-- true of the product, but it is an argument for routing attendee access
-- through the server (which is what /api/threads and /api/events/[id]/messages
-- now do, via the service-role key and assertOwnsRegistration) — not for
-- opening the table to the public role.
--
-- WHAT PRODUCTION ACTUALLY LOOKS LIKE
-- Probed 2026-07-21 with the browser-exposed anon key and no user session:
--
--     GET /rest/v1/messages?select=id             → 200, Content-Range */0
--     GET /rest/v1/message_threads?select=id      → 200, Content-Range */0
--     GET /rest/v1/attendee_connections?select=id → 200, Content-Range */0
--     GET /rest/v1/events?select=id               → 206, Content-Range 0-0/14
--
-- The `events` row proves the probe can see data when a permissive policy
-- exists, and the three networking tables returning zero rows matches the
-- signature of the known-locked `registrations` / `profiles` tables. So the
-- live database appears to have already had these policies replaced — most
-- likely by migration 078, which is NOT present on disk (051-104 are missing
-- from this repo) and therefore cannot be read or relied upon.
--
-- WHY THIS MIGRATION EXISTS ANYWAY
-- The on-disk migration set is the only thing a fresh environment runs. Today
-- that set ends with private DMs world-readable and world-writable. Anyone
-- provisioning a new Supabase project — a staging clone, a restore, a second
-- region — from these files reintroduces the hole silently, and the probe above
-- would show `*/0` there too simply because the new database is empty.
--
-- This migration makes the disk state match the intended state: no public
-- policy on private correspondence. It drops nothing else, and drops nothing
-- that is not named exactly `public_all` on exactly these three tables, so it
-- is a no-op against a production database where 078 already did the work.
--
-- AFTER THIS RUNS
-- The three tables have RLS enabled and NO policy for `anon` / `authenticated`.
-- That is deliberate: with no policy, PostgREST returns nothing to the anon key,
-- and all legitimate access continues to flow through the API routes, which use
-- the service-role key (service_role bypasses RLS) and enforce participation in
-- application code — see authorizeThread() in app/api/threads/[threadId]/route.ts
-- and assertOwnsRegistration() in lib/attendee-identity.ts.
--
-- THAT CLAIM WAS CHECKED, not assumed — it is the one way this migration could
-- break something. If any CLIENT component queried these tables through the
-- browser Supabase client, it would be using the anon key, and dropping the
-- policy would break it silently. Every file that touches the three tables is
-- an API route:
--
--     app/api/threads/route.ts
--     app/api/threads/[threadId]/route.ts
--     app/api/events/[id]/messages/route.ts
--     app/api/events/[id]/connections/route.ts
--     app/api/events/[id]/connections/requests/route.ts
--     app/api/events/[id]/people/route.ts
--
-- Zero matches in any .tsx client component. All six use the service-role
-- client, which bypasses RLS, so none of them is affected by this change.
-- ─────────────────────────────────────────────────────────────────────────────

-- Keep RLS on regardless of how these tables were created.
alter table if exists attendee_connections enable row level security;
alter table if exists message_threads      enable row level security;
alter table if exists messages             enable row level security;

-- Drop the blanket policy from 021 wherever it still exists.
drop policy if exists public_all on attendee_connections;
drop policy if exists public_all on message_threads;
drop policy if exists public_all on messages;

-- ── Verification ─────────────────────────────────────────────────────────────
-- Run this after the statements above. Expect ZERO rows back. Any row returned
-- is a remaining policy that grants access to these tables and must be reviewed
-- by hand — do not assume it is safe just because it is not called public_all.
--
--   select tablename, policyname, roles, cmd, qual, with_check
--     from pg_policies
--    where tablename in ('attendee_connections', 'message_threads', 'messages');


-- ============================================================================
-- 120 — from supabase/migrations/120_registrations_hot_indexes.sql
-- ============================================================================

-- 120_registrations_hot_indexes.sql
--
-- Hot-path indexes for public.registrations. Same shape as 103 (notifications).
--
-- `registrations` is the table that grows without bound on every axis: per
-- event (a 5,000-attendee conference), and platform-wide forever. Its existing
-- index set covers lookup but NOT ordering:
--
--   registrations_event_idx    (event_id)
--   registrations_status_idx   (event_id, status)
--   registrations_email_idx    (attendee_email)
--   registrations_user_id_idx  (user_id)
--   registrations_qr_idx       (qr_code_token)
--   registrations_promo_code_idx, registrations_cash_shift_idx
--
-- Every attendee-list surface sorts by created_at desc and reads one page.
-- With only (event_id) to work from, Postgres fetches EVERY row for the event
-- and sorts it to hand back 50. Pagination doesn't save you when the sort key
-- is unindexed — the page is capped, the work behind it is not.
--
-- Queries this serves:
--   app/(app)/events/[id]/registrations/page.tsx  .eq(event_id).order(created_at desc).range(0,49)
--   app/(app)/events/[id]/orders|reports|downloads|roster/print   .eq(event_id).order(created_at)
--   app/admin/registrations/page.tsx              .order(created_at desc).range(offset, +49)   [no event filter]
--   app/api/admin/registrations/export/route.ts   .order(created_at desc).limit(50000)
--   app/admin/billing/page.tsx                    .eq(payment_status,'paid')                   [no event filter]
--
-- NOTE ON LOCKING: plain CREATE INDEX takes ACCESS EXCLUSIVE and blocks writes
-- on registrations for the duration — i.e. blocks people registering. The table
-- is small today, so this is a sub-second no-op. If it is ever large, or if you
-- are applying this DURING a live event, run each statement separately as
-- `create index concurrently if not exists ...` instead (CONCURRENTLY cannot
-- run inside a transaction block or a do-block, which is why it isn't used
-- here).
--
-- All statements are IF NOT EXISTS — re-running is a no-op.

-- Newest-first attendee list for one event. This is the 5,000-attendee case:
-- turns "read 5,000 rows + sort" into "read 50 rows" for the paginated list.
create index if not exists registrations_event_created_idx
  on public.registrations (event_id, created_at desc);

-- Newest-first list across ALL events — the admin registrations table and the
-- CSV export. Unfiltered, these sort the entire table to return one page.
create index if not exists registrations_created_idx
  on public.registrations (created_at desc);

-- Admin billing take-rate scan (`payment_status = 'paid'`, no event filter, no
-- limit). Partial, because most Eventera events are free: the paid rows are a
-- minority of the table, so this index stays small while the table grows.
--
-- This is a mitigation, not a fix. The query itself still reads every paid
-- registration ever taken and sums it in JS — see the audit note. The index
-- makes that read an index scan instead of a sequential scan; it does not stop
-- the row count from growing forever.
create index if not exists registrations_paid_idx
  on public.registrations (payment_status)
  where payment_status = 'paid';


