-- Migration: 008_teams
-- Team / studio accounts support
-- Idempotent: safe to re-run

-- ─── Tables ──────────────────────────────────────────────────────────────────

create table if not exists teams (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references profiles(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

create table if not exists team_members (
  team_id   uuid not null references teams(id) on delete cascade,
  user_id   uuid not null references profiles(id) on delete cascade,
  role      text not null default 'member'
              check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table if not exists team_invites (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams(id) on delete cascade,
  email       text not null,
  role        text not null default 'member'
                check (role in ('admin', 'member')),
  token       text unique not null default encode(gen_random_bytes(32), 'hex'),
  invited_by  uuid references profiles(id),
  created_at  timestamptz not null default now(),
  accepted_at timestamptz,
  expires_at  timestamptz not null default (now() + interval '7 days')
);

-- ─── profiles.team_id column ─────────────────────────────────────────────────

alter table profiles
  add column if not exists team_id uuid references teams(id);

-- ─── Enable RLS ──────────────────────────────────────────────────────────────

alter table teams        enable row level security;
alter table team_members enable row level security;
alter table team_invites enable row level security;

-- ─── teams policies ──────────────────────────────────────────────────────────

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'teams' and policyname = 'teams_owner_all'
  ) then
    create policy teams_owner_all on teams
      for all
      using  (owner_id = auth.uid())
      with check (owner_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'teams' and policyname = 'teams_member_select'
  ) then
    create policy teams_member_select on teams
      for select
      using (
        exists (
          select 1 from team_members tm
          where tm.team_id = teams.id
            and tm.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- ─── team_members policies ────────────────────────────────────────────────────

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'team_members' and policyname = 'team_members_select_own'
  ) then
    create policy team_members_select_own on team_members
      for select
      using (user_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'team_members' and policyname = 'team_members_owner_admin_insert'
  ) then
    create policy team_members_owner_admin_insert on team_members
      for insert
      with check (
        exists (
          select 1 from team_members tm
          where tm.team_id = team_members.team_id
            and tm.user_id = auth.uid()
            and tm.role in ('owner', 'admin')
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'team_members' and policyname = 'team_members_owner_admin_delete'
  ) then
    create policy team_members_owner_admin_delete on team_members
      for delete
      using (
        exists (
          select 1 from team_members tm
          where tm.team_id = team_members.team_id
            and tm.user_id = auth.uid()
            and tm.role in ('owner', 'admin')
        )
      );
  end if;
end $$;

-- ─── team_invites policies ────────────────────────────────────────────────────

-- Anyone with the token can read the invite (for the accept-invite flow)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'team_invites' and policyname = 'team_invites_select_by_token'
  ) then
    create policy team_invites_select_by_token on team_invites
      for select
      using (true);   -- filtered in app by token; admin client used for writes
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'team_invites' and policyname = 'team_invites_owner_admin_insert'
  ) then
    create policy team_invites_owner_admin_insert on team_invites
      for insert
      with check (
        exists (
          select 1 from team_members tm
          where tm.team_id = team_invites.team_id
            and tm.user_id = auth.uid()
            and tm.role in ('owner', 'admin')
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'team_invites' and policyname = 'team_invites_owner_admin_delete'
  ) then
    create policy team_invites_owner_admin_delete on team_invites
      for delete
      using (
        exists (
          select 1 from team_members tm
          where tm.team_id = team_invites.team_id
            and tm.user_id = auth.uid()
            and tm.role in ('owner', 'admin')
        )
      );
  end if;
end $$;
