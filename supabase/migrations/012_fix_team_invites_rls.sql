-- Fix team_invites RLS: the old policy used `using (true)` which let any
-- authenticated user SELECT all invite rows including the secret token.
-- Replace it with a policy that restricts reads to:
--   1. The invitee (matched by email)
--   2. Team owners / members (who can see their own team's pending invites)

do $$ begin
  -- Drop the overly-permissive policy
  drop policy if exists team_invites_select_by_token on team_invites;

  -- Invitee can read their own invite
  if not exists (
    select 1 from pg_policies
    where tablename = 'team_invites' and policyname = 'team_invites_select_invitee'
  ) then
    create policy team_invites_select_invitee on team_invites
      for select
      using (auth.email() = email);
  end if;

  -- Team members can read invites for their team
  if not exists (
    select 1 from pg_policies
    where tablename = 'team_invites' and policyname = 'team_invites_select_team_member'
  ) then
    create policy team_invites_select_team_member on team_invites
      for select
      using (
        auth.uid() in (
          select user_id from team_members where team_id = team_invites.team_id
        )
      );
  end if;
end $$;
