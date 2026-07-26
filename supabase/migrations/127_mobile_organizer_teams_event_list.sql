-- ============================================================================
-- 127_mobile_organizer_teams_event_list.sql
--
-- WHAT WAS WRONG
--   eventera_mobile's organizer event list (EventeraApi.myEvents(), the one
--   query events_tab.dart / attendees_tab.dart / stats_tab.dart / the scanner's
--   event picker all funnel through) queries the `events` table directly with
--   the signed-in user's own session client:
--
--     supa.from('events').select(...).eq('user_id', uid)
--
--   That is the exact "is literally the row's owner" shape 118 web call sites
--   had before migration 116/canManageEvent.ts fixed it there. Web's fix runs
--   on the SERVICE-ROLE client (manageableOwnerIds(), bypasses RLS), which
--   mobile's session client cannot do — and the `events` table's own SELECT
--   RLS policy was never widened with a team clause (only the RPC layer was,
--   in 116/126). Net effect: a Studio team member's mobile app shows ZERO of
--   the owner's events -- no events to check in, no attendees, no stats --
--   while the same account sees them correctly on web. Teams is a paid
--   ($49/mo) feature; this is a full feature outage on mobile specifically.
--
-- WHY AN RPC, NOT AN RLS POLICY WIDENING
--   Migrations 051-104 are NOT in this repository (see
--   docs/MIGRATIONS-PENDING.md), so the CURRENT live `events` SELECT policy
--   cannot be proven from these files -- the same landmine 116's own header
--   warns about for can_manage_event(). Blindly `create policy ... using (...)`
--   on `events` risks silently dropping a clause this migration cannot see
--   (e.g. a public-read-published clause). A SECURITY DEFINER RPC sidesteps
--   that entirely: it doesn't touch or need to know the existing policy body,
--   matching the same safe pattern already used for checkin_registration()
--   (106/126) and award_qa_points() (121).
--
-- WHAT THIS DOES
--   my_manageable_events(): returns one flat row per event this account may
--   manage (owned, OR via is_event_team_member() from 116), left-joined to
--   event_pages for the venue/date/cover fields the mobile list already reads.
--   Ordered newest-first, matching the existing query. authenticated only --
--   this is an organizer-only surface, no anon use case.
--
-- IDEMPOTENT: create or replace only. No table or existing policy touched.
-- HOW TO APPLY: paste into the Supabase SQL editor and Run.
-- ============================================================================

create or replace function public.my_manageable_events()
returns table (
  id uuid,
  name text,
  slug text,
  status text,
  view_count int,
  download_count int,
  created_at timestamptz,
  starts_at timestamptz,
  venue_name text,
  city text,
  cover_image_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id, e.name, e.slug, e.status, e.view_count, e.download_count, e.created_at,
    ep.starts_at, ep.venue_name, ep.city, ep.cover_image_url
  from public.events e
  left join public.event_pages ep on ep.event_id = e.id
  where e.user_id = auth.uid()
     or public.is_event_team_member(e.id)
  order by e.created_at desc;
$$;

revoke all on function public.my_manageable_events() from public;
grant execute on function public.my_manageable_events() to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Sanity checks — run these after applying.
--
--   a) As a team member (not an owner), this should now return the owner's
--      events (substitute nothing — auth.uid() drives it via the session):
--        select * from public.my_manageable_events();
--
--   b) Confirm nobody gained access who shouldn't have. This must return 0:
--        select count(*) from public.my_manageable_events() r
--        where not exists (
--          select 1 from public.events e where e.id = r.id and e.user_id = auth.uid()
--        )
--        and not public.is_event_team_member(r.id);
-- ─────────────────────────────────────────────────────────────────────────────
