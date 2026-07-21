-- ============================================================================
-- 116 — Team membership actually grants event access
--
-- WHAT WAS WRONG
--   Teams is a Studio ($49/mo) feature. It had a roster, seat billing, invite
--   emails and an "EVENT ACCESS: All events" label — and granted nothing. Every
--   authorization path in the product answers "may this account manage this
--   event?" from `events.user_id`, `user_event_roles`, or `event_staff`. None of
--   them read `team_members`. An invited teammate could see the roster and
--   nothing else.
--
--   This file fixes the DATABASE half (RLS policies and the RPCs, which route
--   through can_manage_event). lib/rbac/canManageEvent.ts fixes the application
--   half. THEY MUST SHIP TOGETHER: applying only one leaves teammates able to
--   act through the API but not through anything RLS-gated, or the reverse.
--
-- ACCESS RULE
--   You may manage an event if you own it, OR you already hold an active
--   staff/organizer event role, OR you are a member of a team whose owner owns
--   the event. Team role ('admin' | 'member') governs administering the TEAM
--   itself and is enforced in the /api/teams routes; it deliberately does not
--   subdivide event access, matching what the Teams UI promises.
--
-- ⚠ BEFORE YOU APPLY — READ THIS
--   Migrations 051-104 are NOT in this repository, so this file cannot prove it
--   knows the current body of can_manage_event(). The body reproduced below is
--   080's. If something between 051 and 104 added another clause, a plain
--   `create or replace` would SILENTLY DROP IT and revoke somebody's access.
--
--   Dump the live body first and compare:
--
--     select pg_get_functiondef(p.oid)
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--     where n.nspname = 'public' and p.proname = 'can_manage_event';
--
--   If it matches the "existing clauses" below, apply as written. If it has
--   extra clauses, keep them and just add the is_event_team_member() clause.
--
-- IDEMPOTENT: create or replace only. Safe to re-run. No table is modified.
-- HOW TO APPLY: paste into the Supabase SQL editor and Run.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. New helper, kept separate so can_manage_event stays readable and so this
--    clause can be reused (or removed) without touching the rest of the body.
--
--    SECURITY DEFINER + a pinned search_path, matching the existing helpers:
--    team_members and teams are themselves RLS-protected, and a plain function
--    would recurse through those policies when called from inside one.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.is_event_team_member(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    join public.teams t on t.owner_id = e.user_id
    join public.team_members m on m.team_id = t.id
    where e.id = p_event_id
      and m.user_id = auth.uid()
  );
$$;

revoke all on function public.is_event_team_member(uuid) from public;
-- anon is granted for the same reason the other helpers are: RLS policies are
-- evaluated as the querying role, and auth.uid() is null for anon, so this
-- returns false rather than erroring.
grant execute on function public.is_event_team_member(uuid) to anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. can_manage_event gains the team clause.
--    The first two exists() blocks are 080's body, unchanged — see the warning
--    at the top of this file before assuming that is still current.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.can_manage_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- existing clause 1: the literal owner
  select exists (
    select 1 from public.events e
    where e.id = p_event_id and e.user_id = auth.uid()
  )
  -- existing clause 2: an active staff/organizer event role
  or exists (
    select 1 from public.user_event_roles r
    where r.event_id = p_event_id
      and r.user_id = auth.uid()
      and r.role in ('staff','organizer')
      and r.status = 'active'
  )
  -- NEW clause 3: a member of the owner's team
  or public.is_event_team_member(p_event_id);
$$;

revoke all on function public.can_manage_event(uuid) from public;
grant execute on function public.can_manage_event(uuid) to anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Sanity checks — run these after applying.
--
--    a) A teammate should now be able to manage the owner's events. Substitute
--       a real team member's user id and one of the owner's event ids:
--
--         select public.is_event_team_member('<event-uuid>');
--
--       (Run it while authenticated AS that member; auth.uid() drives it.)
--
--    b) Confirm nobody gained access who should not have. This must return 0:
--
--         select count(*)
--         from public.events e
--         where public.is_event_team_member(e.id)
--           and e.user_id <> auth.uid()
--           and not exists (
--             select 1 from public.teams t
--             join public.team_members m on m.team_id = t.id
--             where t.owner_id = e.user_id and m.user_id = auth.uid()
--           );
-- ─────────────────────────────────────────────────────────────────────────────
