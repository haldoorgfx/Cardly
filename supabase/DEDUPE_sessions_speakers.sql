-- ============================================================================
-- Eventera — De-duplicate Agenda (sessions + speakers)   [R2 fix]
--
-- WHY: a double-insert on the Add-session / speaker paths created duplicate
-- rows, which makes the Agenda render as overlapping "ghost" columns (each
-- session drawn 2–3×) and shows the same speaker several times. This keeps the
-- EARLIEST row in each duplicate group and removes the extras.
--
-- HOW TO RUN (Supabase → SQL editor):
--   STEP 1 — run SECTION 1 (PREVIEW). It only SELECTs; nothing changes.
--            Look at the "to_delete" counts and the safety check.
--            >>> If the safety check (1c) returns any non-zero number, STOP and
--                send me the numbers — it means real attendee data is attached
--                to duplicate rows and we should handle those first.
--   STEP 2 — if the preview looks right, run SECTION 2 (DEDUPE). It runs inside
--            a single BEGIN…COMMIT. Each DELETE prints how many rows it removed.
--            If anything looks wrong, run `ROLLBACK;` instead of letting it
--            COMMIT and nothing is changed.
--
-- Dedupe keys:  sessions  = (event_id, title, starts_at, ends_at, track_id)
--               speakers  = (event_id, lower(name))
-- Kept row    = earliest created_at (ties broken by lowest id).
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────
-- SECTION 1 — PREVIEW  (read-only, safe to run anytime)
-- ────────────────────────────────────────────────────────────────────────

-- 1a. Duplicate SESSION groups and how many copies would be removed:
with s_ranked as (
  select id, event_id, title, starts_at, ends_at,
         row_number() over (partition by event_id, title, starts_at, ends_at, coalesce(track_id::text,'')
                            order by created_at asc, id asc) as rn,
         count(*)     over (partition by event_id, title, starts_at, ends_at, coalesce(track_id::text,'')) as copies
  from public.sessions
)
select event_id, title, starts_at, copies, count(*) filter (where rn > 1) as to_delete
from s_ranked
where copies > 1
group by event_id, title, starts_at, copies
order by to_delete desc, title;

-- 1b. Duplicate SPEAKER groups:
with sp_ranked as (
  select id, event_id, name,
         row_number() over (partition by event_id, lower(name) order by created_at asc, id asc) as rn,
         count(*)     over (partition by event_id, lower(name)) as copies
  from public.speakers
)
select event_id, name, copies, count(*) filter (where rn > 1) as to_delete
from sp_ranked
where copies > 1
group by event_id, name, copies
order by to_delete desc, name;

-- 1c. SAFETY CHECK — is any attendee data attached to the DUPLICATE (to-be-removed)
--     sessions? For fresh accidental dupes these should all be 0.
with s_dupes as (
  select id from (
    select id, row_number() over (partition by event_id, title, starts_at, ends_at, coalesce(track_id::text,'')
                                  order by created_at asc, id asc) as rn
    from public.sessions
  ) t where rn > 1
)
select
  (select count(*) from public.session_ratings where session_id in (select id from s_dupes)) as ratings_on_dupes,
  (select count(*) from public.attendee_agendas where session_id in (select id from s_dupes)) as agendas_on_dupes;


-- ────────────────────────────────────────────────────────────────────────
-- SECTION 2 — DEDUPE  (writes; runs as one transaction — review, then COMMIT)
-- ────────────────────────────────────────────────────────────────────────
begin;

-- ---- SPEAKERS ----------------------------------------------------------
-- Re-point session_speakers from each duplicate speaker to the kept speaker
-- (skip links that would collide with one the kept speaker already has)…
with sp_map as (
  select id as dup_id, keep_id
  from (
    select id, event_id,
           first_value(id) over (partition by event_id, lower(name) order by created_at asc, id asc) as keep_id
    from public.speakers
  ) r
  where id <> keep_id
)
update public.session_speakers ss
set    speaker_id = m.keep_id
from   sp_map m
where  ss.speaker_id = m.dup_id
  and  not exists (
         select 1 from public.session_speakers ex
         where ex.session_id = ss.session_id and ex.speaker_id = m.keep_id
       );

-- …then drop any leftover duplicate-speaker links that DID collide (the kept
-- speaker is already linked to that session), and finally the dup speakers.
with sp_map as (
  select id as dup_id
  from (
    select id, event_id,
           first_value(id) over (partition by event_id, lower(name) order by created_at asc, id asc) as keep_id
    from public.speakers
  ) r
  where id <> keep_id
)
delete from public.session_speakers ss using sp_map m where ss.speaker_id = m.dup_id;

with sp_ranked as (
  select id, first_value(id) over (partition by event_id, lower(name) order by created_at asc, id asc) as keep_id
  from public.speakers
)
delete from public.speakers where id in (select id from sp_ranked where id <> keep_id);

-- ---- SESSIONS ----------------------------------------------------------
-- Map each duplicate session to the kept (earliest) session in its group.
create temp table _sess_map on commit drop as
select id as dup_id, keep_id
from (
  select id,
         first_value(id) over (partition by event_id, title, starts_at, ends_at, coalesce(track_id::text,'')
                               order by created_at asc, id asc) as keep_id
  from public.sessions
) r
where id <> keep_id;

-- PRESERVE attendee data: move ratings / agenda-adds / check-ins / speaker links
-- / questions from the duplicate session onto the kept one. For each, re-point
-- rows that WON'T collide, then drop the few leftovers that would duplicate a
-- row the kept session already has (unique on registration/speaker).
update public.session_ratings t set session_id = m.keep_id
  from _sess_map m where t.session_id = m.dup_id
  and not exists (select 1 from public.session_ratings x where x.session_id = m.keep_id and x.registration_id = t.registration_id);
delete from public.session_ratings t using _sess_map m where t.session_id = m.dup_id;

update public.attendee_agendas t set session_id = m.keep_id
  from _sess_map m where t.session_id = m.dup_id
  and not exists (select 1 from public.attendee_agendas x where x.session_id = m.keep_id and x.registration_id = t.registration_id);
delete from public.attendee_agendas t using _sess_map m where t.session_id = m.dup_id;

update public.session_checkins t set session_id = m.keep_id
  from _sess_map m where t.session_id = m.dup_id
  and not exists (select 1 from public.session_checkins x where x.session_id = m.keep_id and x.registration_id = t.registration_id);
delete from public.session_checkins t using _sess_map m where t.session_id = m.dup_id;

update public.session_speakers t set session_id = m.keep_id
  from _sess_map m where t.session_id = m.dup_id
  and not exists (select 1 from public.session_speakers x where x.session_id = m.keep_id and x.speaker_id = t.speaker_id);
delete from public.session_speakers t using _sess_map m where t.session_id = m.dup_id;

-- Questions carry no per-attendee uniqueness — just re-point them to the kept session.
update public.qa_questions t set session_id = m.keep_id from _sess_map m where t.session_id = m.dup_id;

-- Finally remove the now-childless duplicate sessions.
delete from public.sessions where id in (select dup_id from _sess_map);

-- Review the row counts printed above. If they match the preview:
commit;
-- If anything looks wrong instead, run:  rollback;
