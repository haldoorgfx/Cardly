-- 078_engagement_rls_lockdown.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- CRITICAL PRODUCTION SECURITY FIX. Paste the WHOLE file into the Supabase SQL
-- editor and run once. Safe + idempotent.
--
-- WHAT WAS WRONG (found in a privilege-boundary audit of the mobile app,
-- 2026-07-09): migration 050 fixed the WRITE side of the Phase-3 engagement
-- tables (dropped `public_all using(true) with check(true)`) but left every
-- one of them with `public_select using(true)` for reads — i.e. row-level
-- security enabled, but every row of every table readable by anyone holding
-- the public anon key, no login required. Two of these are severe:
--   • messages / message_threads — every private 1:1 attendee DM, across every
--     event on the platform, was readable with zero authentication.
--   • speakers.email — `public_read using(true)` on the base `speakers` table
--     (never updated by 050 — it's a Phase-2 table) leaks every speaker's
--     email; RLS is row-level, so a column added for one purpose (linking a
--     speaker to their login, migration 039) leaks on every public read.
-- The rest (qa_questions, qa_upvotes, poll_votes, attendee_connections,
-- leaderboard_points, attendee_agendas, session_ratings, event_feedback,
-- community_channels/messages, match_suggestions) share the same
-- `using(true)` pattern at lower severity — mostly linking ids, but
-- qa_questions.registration_id defeats the "anonymous question" feature for
-- anyone cross-referencing it against an organizer's own registrations read.
--
-- THE FIX: scope every read to (a) the event's organizer, (b) the actual
-- participant(s) via their own registration_id / email, and for the two
-- tables the mobile app needs broad-but-safe public reads on (speakers,
-- qa_questions), add a SAFE-COLUMN VIEW — same pattern as 072_rls_lockdown's
-- public_profiles / public_sponsors — and repoint the mobile app's public-
-- facing reads at it. Self-service reads (a speaker looking up their own
-- profile by email, etc.) stay on the base table, now protected by a
-- self-row policy instead of a blanket one.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── Helpers ──────────────────────────────────────────────────────────────────

-- The signed-in user's own registration ids, across every event — by user_id
-- when set, else by case-insensitive email match to their profile. Mirrors
-- the `attendee_read` policy on `registrations` itself (047).
create or replace function public.my_registration_ids()
returns setof uuid
language sql
stable
as $$
  select id from public.registrations
  where (user_id is not null and user_id = auth.uid())
     or lower(attendee_email) = lower(coalesce(
          (select email from public.profiles where id = auth.uid()), ''))
$$;

-- Is the signed-in user a registered attendee of p_event_id, OR its organizer?
create or replace function public.is_event_participant(p_event_id uuid)
returns boolean
language sql
stable
as $$
  select
    exists (
      select 1 from public.events e
      where e.id = p_event_id and e.user_id = auth.uid()
    )
    or exists (
      select 1 from public.registrations r
      where r.event_id = p_event_id
        and ((r.user_id is not null and r.user_id = auth.uid())
          or lower(r.attendee_email) = lower(coalesce(
               (select email from public.profiles where id = auth.uid()), '')))
    )
$$;


-- ── 1. messages / message_threads — the severe one: scope to participants ────
do $$ begin
  if to_regclass('public.message_threads') is not null then
    alter table public.message_threads enable row level security;
    drop policy if exists public_select on public.message_threads;
    drop policy if exists "message_threads: participant read" on public.message_threads;
    create policy "message_threads: participant read" on public.message_threads
      for select using (
        participant_a in (select public.my_registration_ids())
        or participant_b in (select public.my_registration_ids())
        or event_id in (select id from public.events where user_id = auth.uid())
      );
  end if;
end $$;

do $$ begin
  if to_regclass('public.messages') is not null then
    alter table public.messages enable row level security;
    drop policy if exists public_select on public.messages;
    drop policy if exists "messages: participant read" on public.messages;
    create policy "messages: participant read" on public.messages
      for select using (
        thread_id in (
          select id from public.message_threads
          where participant_a in (select public.my_registration_ids())
             or participant_b in (select public.my_registration_ids())
        )
      );
    -- Read receipts (thread_screen.dart stamps read_at on inbound messages) had
    -- no UPDATE policy at all since 050 — silently a no-op. Scope it the same
    -- way as the read policy.
    drop policy if exists "messages: participant mark read" on public.messages;
    create policy "messages: participant mark read" on public.messages
      for update using (
        thread_id in (
          select id from public.message_threads
          where participant_a in (select public.my_registration_ids())
             or participant_b in (select public.my_registration_ids())
        )
      ) with check (
        thread_id in (
          select id from public.message_threads
          where participant_a in (select public.my_registration_ids())
             or participant_b in (select public.my_registration_ids())
        )
      );
  end if;
end $$;


-- ── 2. speakers — self row (incl. email) + safe public view, no more public_read ─
do $$ begin
  if to_regclass('public.speakers') is not null then
    drop policy if exists public_read on public.speakers;
    drop policy if exists "speakers: self read" on public.speakers;
    create policy "speakers: self read" on public.speakers
      for select using (
        email is not null
        and lower(email) = lower(coalesce(
              (select email from public.profiles where id = auth.uid()), ''))
      );
    -- owner_all (organizer, migration 020) is untouched and still applies.
  end if;
end $$;

create or replace view public.public_speakers as
  select id, event_id, name, headline, bio, photo_url, company, role,
         linkedin_url, twitter_url, website_url, speaker_type, is_featured,
         position, created_at
  from public.speakers;

grant select on public.public_speakers to anon, authenticated;


-- ── 3. qa_questions — scoped base read + safe public view (no registration_id) ─
do $$ begin
  if to_regclass('public.qa_questions') is not null then
    drop policy if exists public_select on public.qa_questions;
    drop policy if exists "qa_questions: scoped read" on public.qa_questions;
    create policy "qa_questions: scoped read" on public.qa_questions
      for select using (
        event_id in (select id from public.events where user_id = auth.uid())
        or registration_id in (select public.my_registration_ids())
        or exists (
          select 1 from public.session_speakers ss
          join public.speakers s on s.id = ss.speaker_id
          where ss.session_id = qa_questions.session_id
            and s.email is not null
            and lower(s.email) = lower(coalesce(
                  (select email from public.profiles where id = auth.uid()), ''))
        )
      );
  end if;
end $$;

-- Public projection: no registration_id (that's exactly what let an organizer
-- de-anonymize a question by cross-referencing the leaked id against their own
-- registrations). Name resolution now happens here, server-side, once.
create or replace view public.qa_questions_public as
  select
    q.id, q.event_id, q.session_id, q.question, q.is_anonymous,
    q.upvotes_count, q.status, q.is_featured, q.created_at,
    case when q.is_anonymous then 'Anonymous'
         else coalesce(r.attendee_name, 'Anonymous') end as attendee_name
  from public.qa_questions q
  left join public.registrations r on r.id = q.registration_id
  where q.status <> 'hidden';

grant select on public.qa_questions_public to anon, authenticated;

do $$ begin
  if to_regclass('public.qa_upvotes') is not null then
    drop policy if exists public_select on public.qa_upvotes;
    drop policy if exists "qa_upvotes: scoped read" on public.qa_upvotes;
    create policy "qa_upvotes: scoped read" on public.qa_upvotes
      for select using (
        registration_id in (select public.my_registration_ids())
        or exists (
          select 1 from public.qa_questions q
          join public.events e on e.id = q.event_id
          where q.id = qa_upvotes.question_id and e.user_id = auth.uid()
        )
      );
  end if;
end $$;


-- ── 4. poll_votes — own vote + organizer ──────────────────────────────────────
do $$ begin
  if to_regclass('public.poll_votes') is not null then
    drop policy if exists public_select on public.poll_votes;
    drop policy if exists "poll_votes: scoped read" on public.poll_votes;
    create policy "poll_votes: scoped read" on public.poll_votes
      for select using (
        registration_id in (select public.my_registration_ids())
        or exists (
          select 1 from public.polls p
          join public.events e on e.id = p.event_id
          where p.id = poll_votes.poll_id and e.user_id = auth.uid()
        )
      );
  end if;
end $$;


-- ── 5. attendee_connections — either participant + organizer ─────────────────
do $$ begin
  if to_regclass('public.attendee_connections') is not null then
    drop policy if exists public_select on public.attendee_connections;
    drop policy if exists "attendee_connections: scoped read" on public.attendee_connections;
    create policy "attendee_connections: scoped read" on public.attendee_connections
      for select using (
        requester_id in (select public.my_registration_ids())
        or recipient_id in (select public.my_registration_ids())
        or event_id in (select id from public.events where user_id = auth.uid())
      );
  end if;
end $$;


-- ── 6. leaderboard_points — organizer + own points only (mobile reads the ────
--       leaderboard through /api/events/[id]/leaderboard — service role — so
--       no direct client needs broad access here).
do $$ begin
  if to_regclass('public.leaderboard_points') is not null then
    drop policy if exists public_select on public.leaderboard_points;
    drop policy if exists "leaderboard_points: scoped read" on public.leaderboard_points;
    create policy "leaderboard_points: scoped read" on public.leaderboard_points
      for select using (
        registration_id in (select public.my_registration_ids())
        or event_id in (select id from public.events where user_id = auth.uid())
      );
  end if;
end $$;


-- ── 7. attendee_agendas — own rows; also restores DELETE (missing since 050, ──
--       agenda_screen.dart / session_detail_screen.dart both remove an agenda
--       item with a direct client `.delete()`, which has been a silent no-op).
do $$ begin
  if to_regclass('public.attendee_agendas') is not null then
    drop policy if exists public_select on public.attendee_agendas;
    drop policy if exists "attendee_agendas: own read" on public.attendee_agendas;
    create policy "attendee_agendas: own read" on public.attendee_agendas
      for select using (
        registration_id in (select public.my_registration_ids())
        or exists (
          select 1 from public.sessions s
          join public.events e on e.id = s.event_id
          where s.id = attendee_agendas.session_id and e.user_id = auth.uid()
        )
      );
    drop policy if exists "attendee_agendas: own delete" on public.attendee_agendas;
    create policy "attendee_agendas: own delete" on public.attendee_agendas
      for delete using (registration_id in (select public.my_registration_ids()));
  end if;
end $$;


-- ── 8. session_ratings / event_feedback — own rows + organizer ───────────────
do $$ begin
  if to_regclass('public.session_ratings') is not null then
    drop policy if exists public_select on public.session_ratings;
    drop policy if exists "session_ratings: scoped read" on public.session_ratings;
    create policy "session_ratings: scoped read" on public.session_ratings
      for select using (
        registration_id in (select public.my_registration_ids())
        or exists (
          select 1 from public.sessions s
          join public.events e on e.id = s.event_id
          where s.id = session_ratings.session_id and e.user_id = auth.uid()
        )
      );
  end if;
end $$;

do $$ begin
  if to_regclass('public.event_feedback') is not null then
    drop policy if exists public_select on public.event_feedback;
    drop policy if exists "event_feedback: scoped read" on public.event_feedback;
    create policy "event_feedback: scoped read" on public.event_feedback
      for select using (
        registration_id in (select public.my_registration_ids())
        or event_id in (select id from public.events where user_id = auth.uid())
      );
  end if;
end $$;


-- ── 9. community_channels / community_messages — event participants only ─────
do $$ begin
  if to_regclass('public.community_channels') is not null then
    drop policy if exists public_read on public.community_channels;
    drop policy if exists "community_channels: participant read" on public.community_channels;
    create policy "community_channels: participant read" on public.community_channels
      for select using (public.is_event_participant(event_id));
    -- owner_write (organizer, migration 051) is untouched and still applies.
  end if;
end $$;

do $$ begin
  if to_regclass('public.community_messages') is not null then
    drop policy if exists public_read on public.community_messages;
    drop policy if exists "community_messages: participant read" on public.community_messages;
    create policy "community_messages: participant read" on public.community_messages
      for select using (
        exists (
          select 1 from public.community_channels c
          where c.id = community_messages.channel_id
            and public.is_event_participant(c.event_id)
        )
      );
    -- attendee_insert (migration 051) is untouched and still applies.
  end if;
end $$;


-- ── 10. match_suggestions — still fully open (read AND write) since 022; ─────
--        never got the 050 pass at all. No mobile client touches it today —
--        lock reads to the two matched attendees + organizer, writes to
--        service-role only (drop public_all, add no insert/update policy).
do $$ begin
  if to_regclass('public.match_suggestions') is not null then
    drop policy if exists public_all on public.match_suggestions;
    drop policy if exists "match_suggestions: scoped read" on public.match_suggestions;
    create policy "match_suggestions: scoped read" on public.match_suggestions
      for select using (
        registration_id in (select public.my_registration_ids())
        or matched_registration_id in (select public.my_registration_ids())
        or event_id in (select id from public.events where user_id = auth.uid())
      );
  end if;
end $$;


-- ── 11. event_staff — dead/unapplied table (superseded by user_event_roles, ──
--        055), but migrations/036_event_staff.sql creates it with NO RLS at
--        all. Defensive lock in case it's ever pasted into prod by mistake.
do $$ begin
  if to_regclass('public.event_staff') is not null then
    alter table public.event_staff enable row level security;
    drop policy if exists "event_staff: owner all" on public.event_staff;
    create policy "event_staff: owner all" on public.event_staff
      for all using (owner_id = auth.uid())
      with check (owner_id = auth.uid());
  end if;
end $$;


-- ── 12. meeting_requests — insert allowed identity spoofing (060) ────────────
do $$ begin
  if to_regclass('public.meeting_requests') is not null then
    drop policy if exists meeting_requests_insert on public.meeting_requests;
    create policy meeting_requests_insert on public.meeting_requests for insert to authenticated
      with check (
        lower(coalesce(requester_email, '')) = lower(coalesce(
          (select email from public.profiles where id = auth.uid()), ''))
      );
  end if;
end $$;


-- ── 13. Sanity: after running, re-run these as an ANONYMOUS caller (no
--        Authorization header). All must return [] :
--   /rest/v1/messages?select=content                    → []
--   /rest/v1/message_threads?select=id                   → []
--   /rest/v1/speakers?select=email                       → []
--   /rest/v1/public_speakers?select=name                 → still works
--   /rest/v1/qa_questions?select=registration_id         → []
--   /rest/v1/qa_questions_public?select=attendee_name    → still works
--   /rest/v1/poll_votes?select=registration_id           → []
--   /rest/v1/match_suggestions?select=*                  → []
