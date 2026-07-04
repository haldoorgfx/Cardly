-- ============================================================================
-- 053_rls_consistency_fixes.sql
--
-- WEB vs MOBILE data-consistency fixes (RLS SELECT policies).
--
-- BACKGROUND ────────────────────────────────────────────────────────────────
-- The web app reads most public data with the SERVICE-ROLE client, which
-- BYPASSES RLS. The mobile app reads the same tables with the ANON client,
-- which ENFORCES RLS. So any table whose public-read policy is missing or
-- wrong shows data on web but NOTHING on mobile.
--
-- 052 already fixed ticket_types + registration_form_fields (the exemplar of
-- this bug class: a subquery joined on the wrong column). This migration adds
-- the two REMAINING divergences that a direct audit of every mobile
-- `.from('<table>')` read turned up:
--
--   1. registrations  — the public "attendee wall" (names + avatars of
--      confirmed attendees, shown on the event hub). The only SELECT policy
--      (`attendee_read`, migrations 017/047) lets a signed-in user read ONLY
--      their OWN registrations. Web builds the wall via the admin client, so it
--      shows attendees; mobile's anon read returns just the viewer's own row →
--      the attendee wall is effectively empty on mobile.
--
--   2. profiles       — public organizer profiles + attendee-wall avatars.
--      The only policy (`profiles: own row`, migration 001) is
--      `auth.uid() = id`, so anon/other users read NOTHING. Mobile reads other
--      users' `full_name / avatar_url / bio / organization / city` on the
--      organizer profile screen, the follow-suggestions list, and the attendee
--      wall. Web reads these via the admin client → they render on web but are
--      blank on mobile.
--
-- SCOPING (least exposure) ───────────────────────────────────────────────────
-- These are additive SELECT-only policies. RLS OR's multiple permissive SELECT
-- policies, so existing owner/attendee policies still apply — we only WIDEN
-- reads for genuinely-public rows:
--   * registrations: only confirmed / checked_in rows of a PUBLIC event.
--   * profiles: only rows that are (a) an organizer of a published event, or
--     (b) a confirmed/checked_in attendee of a public event. Random users'
--     profiles remain private. (RLS is row-level; the app already selects only
--     display columns, and these rows are inherently public identities.)
--
-- IDEMPOTENT: every statement is `drop policy if exists` + `create policy`,
-- guarded by a table-exists check. Safe to run more than once.
-- Paste into the Supabase SQL editor and Run.
-- ============================================================================

-- ── 1. registrations: public attendee wall (confirmed attendees, public event)
do $$ begin
  if to_regclass('public.registrations') is not null then
    alter table public.registrations enable row level security;
    drop policy if exists public_attendee_wall on public.registrations;
    create policy public_attendee_wall on public.registrations
      for select
      using (
        status in ('confirmed', 'checked_in')
        and event_id in (select event_id from event_pages where is_public = true)
      );
  end if;
end $$;

-- ── 2. profiles: public organizer profiles + public attendee identities
do $$ begin
  if to_regclass('public.profiles') is not null then
    alter table public.profiles enable row level security;
    drop policy if exists public_profile_read on public.profiles;
    create policy public_profile_read on public.profiles
      for select
      using (
        -- (a) organizer of at least one published event
        id in (select user_id from events where status = 'published')
        -- (b) confirmed/checked-in attendee of a public event (for the wall)
        or id in (
          select r.user_id
          from registrations r
          where r.user_id is not null
            and r.status in ('confirmed', 'checked_in')
            and r.event_id in (select event_id from event_pages where is_public = true)
        )
      );
  end if;
end $$;
