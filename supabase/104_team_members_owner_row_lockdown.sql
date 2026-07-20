-- ============================================================================
-- 104_team_members_owner_row_lockdown.sql
--
-- Hardens the `team_members` write policy created in 076_schema_completion.sql.
--
-- THE GAP
-- 076 gave team owners AND team admins one blanket `for all` policy:
--
--   create policy team_members_admin_write on public.team_members
--     for all using (  ...owner... or team_role_of(team_id) in ('owner','admin') )
--
-- Because `team_members` is reachable over the public REST endpoint with any
-- authenticated user's JWT, a merely-ADMIN member could, without touching the
-- app UI:
--   1. DELETE the team OWNER's own membership row. getMyTeam() resolves a team
--      through team_members, so the owner permanently lost access to their own
--      team — including the ability to delete it or manage seats.
--   2. UPDATE their own row to role 'owner' (the CHECK constraint allows it),
--      or demote the owner's row to 'member'.
--   3. INSERT arbitrary profiles.id rows, adding members with no invite and
--      bypassing the plan seat limit enforced in /api/teams/[id]/invites.
--
-- THE FIX
-- Split the blanket policy in two:
--   • the team owner keeps unrestricted write on their team's rows;
--   • admins may only write rows that are NEITHER the owner's row NOR carry
--     role 'owner' — so they can still add/remove/retitle ordinary members but
--     can never unseat the owner or crown themselves.
--
-- Seat-limit bypass via direct INSERT is still possible for admins (RLS has no
-- view of the plan) — that stays enforced in the API route; this migration just
-- removes the account-takeover half of the problem.
--
-- Idempotent. Does not touch applied migrations 001–101.
-- ============================================================================

do $$ begin
  if to_regclass('public.team_members') is null then
    return;
  end if;

  alter table public.team_members enable row level security;

  -- Replace the single blanket policy from 076.
  drop policy if exists team_members_admin_write on public.team_members;
  drop policy if exists team_members_owner_write on public.team_members;
  drop policy if exists team_members_admin_write_non_owner on public.team_members;

  -- (1) Team owner — full control over their team's roster.
  create policy team_members_owner_write on public.team_members
    for all
    using (
      exists (select 1 from teams t where t.id = team_id and t.owner_id = auth.uid())
    )
    with check (
      exists (select 1 from teams t where t.id = team_id and t.owner_id = auth.uid())
    );

  -- (2) Team admin — ordinary member rows only. Cannot touch the owner's row
  --     and cannot create/promote a row to role 'owner'.
  create policy team_members_admin_write_non_owner on public.team_members
    for all
    using (
      team_role_of(team_id) = 'admin'
      and role <> 'owner'
      and not exists (
        select 1 from teams t where t.id = team_id and t.owner_id = team_members.user_id
      )
    )
    with check (
      team_role_of(team_id) = 'admin'
      and role <> 'owner'
      and not exists (
        select 1 from teams t where t.id = team_id and t.owner_id = team_members.user_id
      )
    );
end $$;
