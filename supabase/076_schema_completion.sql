-- 076_schema_completion.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Wire up every feature whose DB table was missing or broken in production
-- (found by probing all 77 code-referenced tables live on 2026-07-07).
--
-- ALSO PASTE, separately, the two pre-written migrations that were never applied:
--   supabase/migrations/036_event_staff.sql   (Team/Staff page)
--   supabase/migrations/037_photo_wall.sql     (Photo wall)
-- Both are `create table if not exists` + RLS — safe to run as-is.
--
-- THIS file fixes:
--   1. teams / team_members / team_invites — RLS infinite recursion (HTTP 500)
--   2. application_questions — approval-gated event application form (apply page)
--   3. event_posts — event newsfeed
--   4. event_resources — speaker/session downloadable resources
--   5. marketplace_collections — admin-curated event collections
--   6. promoted_listings — paid event promotion
--   7. booth_leads — lead scoring
--
-- Safe + idempotent. Paste the WHOLE file into the Supabase SQL editor, run once.
-- ─────────────────────────────────────────────────────────────────────────────


-- ══ 1. TEAMS — break the RLS recursion ═══════════════════════════════════════
-- The old team_members policies subqueried team_members from inside a
-- team_members policy → Postgres 42P17 infinite recursion → every read 500'd.
-- Fix: a SECURITY DEFINER helper that reads membership WITHOUT triggering RLS,
-- then rewrite all three tables' policies to call it.

create or replace function public.team_role_of(p_team_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select tm.role
  from team_members tm
  where tm.team_id = p_team_id and tm.user_id = auth.uid()
  limit 1;
$$;
grant execute on function public.team_role_of(uuid) to authenticated;

do $$ begin
  if to_regclass('public.teams') is not null then
    alter table public.teams enable row level security;
    drop policy if exists teams_owner_all on public.teams;
    drop policy if exists teams_member_select on public.teams;
    create policy teams_owner_all on public.teams
      for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
    create policy teams_member_select on public.teams
      for select using (owner_id = auth.uid() or team_role_of(id) is not null);
  end if;

  if to_regclass('public.team_members') is not null then
    alter table public.team_members enable row level security;
    drop policy if exists team_members_select_own on public.team_members;
    drop policy if exists team_members_owner_admin_insert on public.team_members;
    drop policy if exists team_members_owner_admin_delete on public.team_members;
    -- Read: any member of the team can see the roster (helper, no recursion).
    create policy team_members_read on public.team_members
      for select using (
        user_id = auth.uid()
        or exists (select 1 from teams t where t.id = team_id and t.owner_id = auth.uid())
        or team_role_of(team_id) is not null
      );
    -- Write: team owner or admin.
    create policy team_members_admin_write on public.team_members
      for all using (
        exists (select 1 from teams t where t.id = team_id and t.owner_id = auth.uid())
        or team_role_of(team_id) in ('owner','admin')
      ) with check (
        exists (select 1 from teams t where t.id = team_id and t.owner_id = auth.uid())
        or team_role_of(team_id) in ('owner','admin')
      );
  end if;

  if to_regclass('public.team_invites') is not null then
    alter table public.team_invites enable row level security;
    drop policy if exists team_invites_select_by_token on public.team_invites;
    drop policy if exists team_invites_select_invitee on public.team_invites;
    drop policy if exists team_invites_select_team_member on public.team_invites;
    drop policy if exists team_invites_owner_admin_insert on public.team_invites;
    drop policy if exists team_invites_owner_admin_delete on public.team_invites;
    create policy team_invites_read on public.team_invites
      for select using (
        lower(email) = lower((select email from profiles where id = auth.uid()))
        or exists (select 1 from teams t where t.id = team_id and t.owner_id = auth.uid())
        or team_role_of(team_id) in ('owner','admin')
      );
    create policy team_invites_admin_write on public.team_invites
      for all using (
        exists (select 1 from teams t where t.id = team_id and t.owner_id = auth.uid())
        or team_role_of(team_id) in ('owner','admin')
      ) with check (
        exists (select 1 from teams t where t.id = team_id and t.owner_id = auth.uid())
        or team_role_of(team_id) in ('owner','admin')
      );
  end if;
end $$;


-- ══ helper: is the caller the organizer (owner) of this event? ════════════════
-- (Plain subquery is fine here — events has no policy that references these
--  new tables, so no recursion.)

-- ══ 2. application_questions ══════════════════════════════════════════════════
create table if not exists public.application_questions (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  label      text not null,
  type       text not null default 'text',
  required   boolean not null default false,
  options    jsonb,
  position   int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists application_questions_event_idx on public.application_questions(event_id);
alter table public.application_questions enable row level security;
drop policy if exists application_questions_owner on public.application_questions;
create policy application_questions_owner on public.application_questions
  for all using (event_id in (select id from events where user_id = auth.uid()))
  with check (event_id in (select id from events where user_id = auth.uid()));
drop policy if exists application_questions_public_read on public.application_questions;
create policy application_questions_public_read on public.application_questions
  for select using (event_id in (select event_id from event_pages where is_public = true));


-- ══ 3. event_posts (newsfeed) ═════════════════════════════════════════════════
create table if not exists public.event_posts (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references events(id) on delete cascade,
  body         text not null,
  image_url    text,
  scheduled_at timestamptz,
  published_at timestamptz,
  is_pinned    boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists event_posts_event_idx on public.event_posts(event_id, created_at desc);
alter table public.event_posts enable row level security;
drop policy if exists event_posts_owner on public.event_posts;
create policy event_posts_owner on public.event_posts
  for all using (event_id in (select id from events where user_id = auth.uid()))
  with check (event_id in (select id from events where user_id = auth.uid()));
drop policy if exists event_posts_public_read on public.event_posts;
create policy event_posts_public_read on public.event_posts
  for select using (
    published_at is not null
    and event_id in (select event_id from event_pages where is_public = true)
  );


-- ══ 4. event_resources ════════════════════════════════════════════════════════
create table if not exists public.event_resources (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  session_id  uuid references sessions(id) on delete cascade,
  speaker_id  uuid references speakers(id) on delete set null,
  title       text,
  description text,
  url         text,
  type        text,
  position    int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists event_resources_event_idx on public.event_resources(event_id);
alter table public.event_resources enable row level security;
drop policy if exists event_resources_owner on public.event_resources;
create policy event_resources_owner on public.event_resources
  for all using (event_id in (select id from events where user_id = auth.uid()))
  with check (event_id in (select id from events where user_id = auth.uid()));
drop policy if exists event_resources_public_read on public.event_resources;
create policy event_resources_public_read on public.event_resources
  for select using (event_id in (select event_id from event_pages where is_public = true));


-- ══ 5. marketplace_collections (admin-curated) ════════════════════════════════
create table if not exists public.marketplace_collections (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text unique,
  description  text,
  cover_url    text,
  event_ids    uuid[] not null default '{}',
  is_published boolean not null default false,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.marketplace_collections enable row level security;
-- Platform admins manage; anyone reads published collections.
drop policy if exists marketplace_collections_admin on public.marketplace_collections;
create policy marketplace_collections_admin on public.marketplace_collections
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid()
            and coalesce(p.platform_role, 'user') in ('admin','super_admin'))
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid()
            and coalesce(p.platform_role, 'user') in ('admin','super_admin'))
  );
drop policy if exists marketplace_collections_public_read on public.marketplace_collections;
create policy marketplace_collections_public_read on public.marketplace_collections
  for select using (is_published = true);


-- ══ 6. promoted_listings (paid promotion) ═════════════════════════════════════
create table if not exists public.promoted_listings (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null unique references events(id) on delete cascade,
  owner_id      uuid not null references profiles(id) on delete cascade,
  daily_budget  numeric,
  duration_days int,
  placements    jsonb,
  status        text not null default 'pending_review'
                  check (status in ('pending_review','active','paused','rejected','ended')),
  submitted_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create index if not exists promoted_listings_status_idx on public.promoted_listings(status);
alter table public.promoted_listings enable row level security;
drop policy if exists promoted_listings_owner on public.promoted_listings;
create policy promoted_listings_owner on public.promoted_listings
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists promoted_listings_admin on public.promoted_listings;
create policy promoted_listings_admin on public.promoted_listings
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid()
            and coalesce(p.platform_role, 'user') in ('admin','super_admin'))
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid()
            and coalesce(p.platform_role, 'user') in ('admin','super_admin'))
  );
drop policy if exists promoted_listings_public_read on public.promoted_listings;
create policy promoted_listings_public_read on public.promoted_listings
  for select using (status = 'active');


-- ══ 7. booth_leads (lead scoring) ═════════════════════════════════════════════
create table if not exists public.booth_leads (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references events(id) on delete cascade,
  sponsor_id     uuid references sponsors(id) on delete cascade,
  registration_id uuid references registrations(id) on delete set null,
  attendee_name  text,
  attendee_email text,
  score          numeric not null default 0,
  note           text,
  created_at     timestamptz not null default now()
);
create index if not exists booth_leads_event_idx on public.booth_leads(event_id);
alter table public.booth_leads enable row level security;
-- Lead PII: only the event organizer sees it.
drop policy if exists booth_leads_owner on public.booth_leads;
create policy booth_leads_owner on public.booth_leads
  for all using (event_id in (select id from events where user_id = auth.uid()))
  with check (event_id in (select id from events where user_id = auth.uid()));


-- ══ Done. After running (plus 036 + 037), re-probe: none of these should 404. ══
