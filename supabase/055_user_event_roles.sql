-- ============================================================================
-- 055_user_event_roles.sql
--
-- FOUNDATION for the unified account + role-based dashboard.
--
-- Introduces `user_event_roles`: a single account can hold MANY event-scoped
-- roles (attendee / speaker / sponsor / organizer / staff). This is the data
-- backbone that lets the four separate portals (organizer /dashboard,
-- attendee /account, speaker /s, exhibitor /x + /exhibitor) collapse into ONE
-- adaptive dashboard whose nav lights up per role.
--
-- Also adds a GLOBAL `platform_role` column to `profiles` (user/admin/super_admin)
-- so the "Admin" surface can be gated independently of event-scoped roles.
--
-- IDEMPOTENT + SELECT-safe RLS. Uses the SECURITY DEFINER helper pattern so no
-- policy recurses. Does NOT touch applied migrations 001–054.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 0. platform_role on profiles
--
-- `profiles.role` already exists (from 003/005) with values
-- ('user','studio','admin','super_admin') and mixes plan-ish tier ('studio')
-- with platform authority. We add a DEDICATED `platform_role` limited to the
-- three authority levels the unified "Admin" nav cares about, backfilled from
-- the existing `role`. 'studio' (a tier, not an authority) maps to 'user'.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists platform_role text not null default 'user';

-- Add the check constraint separately + idempotently (can't IF NOT EXISTS inline)
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_platform_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_platform_role_check
      check (platform_role in ('user','admin','super_admin'));
  end if;
end $$;

-- Backfill platform_role from the pre-existing `role` column when present.
-- SOURCE: profiles.role (added in migration 003, extended in 005).
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
  ) then
    update public.profiles
      set platform_role = case
        when role in ('admin','super_admin') then role
        else 'user'   -- 'user' and 'studio' both map to platform 'user'
      end
      where platform_role = 'user'      -- only touch un-backfilled rows
        and role in ('admin','super_admin');
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. user_event_roles table
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.user_event_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  event_id    uuid not null references public.events(id) on delete cascade,
  role        text not null check (role in ('attendee','speaker','sponsor','organizer','staff')),
  status      text not null default 'active' check (status in ('active','pending','revoked')),
  created_at  timestamptz not null default now(),
  unique (user_id, event_id, role)
);

create index if not exists user_event_roles_user_idx   on public.user_event_roles(user_id);
create index if not exists user_event_roles_event_idx  on public.user_event_roles(event_id);
create index if not exists user_event_roles_role_idx   on public.user_event_roles(event_id, role, status);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SECURITY DEFINER helpers (avoid RLS recursion)
--
-- Policies on user_event_roles must ask "does the current user own this event?"
-- and "is this event public?". Doing that inline can recurse through events'
-- own RLS. These SECURITY DEFINER functions run with owner privileges and a
-- pinned search_path, so the policy predicates never recurse.
-- ─────────────────────────────────────────────────────────────────────────────

-- Is `auth.uid()` the organizer (events.user_id) of this event?
create or replace function public.is_event_organizer(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id
      and e.user_id = auth.uid()
  );
$$;

-- Is this event published (i.e. its roles may back a public directory)?
create or replace function public.is_event_published(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id
      and e.status = 'published'
  );
$$;

revoke all on function public.is_event_organizer(uuid) from public;
revoke all on function public.is_event_published(uuid) from public;
grant execute on function public.is_event_organizer(uuid) to authenticated, anon;
grant execute on function public.is_event_published(uuid) to authenticated, anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RLS on user_event_roles
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.user_event_roles enable row level security;

-- (a) Users can read their OWN role rows.
drop policy if exists "uer: own read" on public.user_event_roles;
create policy "uer: own read" on public.user_event_roles
  for select using (user_id = auth.uid());

-- (b) Organizers can read ALL role rows for events they own.
drop policy if exists "uer: organizer read" on public.user_event_roles;
create policy "uer: organizer read" on public.user_event_roles
  for select using (public.is_event_organizer(event_id));

-- (c) Public read of speaker/sponsor roles for PUBLISHED events (directories).
--     Only exposes the fact that a user speaks/sponsors at a public event.
drop policy if exists "uer: public directory read" on public.user_event_roles;
create policy "uer: public directory read" on public.user_event_roles
  for select using (
    status = 'active'
    and role in ('speaker','sponsor')
    and public.is_event_published(event_id)
  );

-- (d) Organizers can MANAGE (insert/update/delete) roles for their events.
drop policy if exists "uer: organizer manage insert" on public.user_event_roles;
create policy "uer: organizer manage insert" on public.user_event_roles
  for insert with check (public.is_event_organizer(event_id));

drop policy if exists "uer: organizer manage update" on public.user_event_roles;
create policy "uer: organizer manage update" on public.user_event_roles
  for update using (public.is_event_organizer(event_id))
  with check (public.is_event_organizer(event_id));

drop policy if exists "uer: organizer manage delete" on public.user_event_roles;
create policy "uer: organizer manage delete" on public.user_event_roles
  for delete using (public.is_event_organizer(event_id));

-- NOTE: the service-role admin client (lib/supabase/server.ts → createAdminClient)
-- bypasses RLS entirely; the role-resolver in lib/rbac/roles.ts uses it, so these
-- policies are the guard rail for the anon/authed (mobile + client) paths only.


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. BACKFILL from existing data
--
-- Every INSERT below is idempotent via `on conflict (user_id, event_id, role)
-- do nothing` and only maps rows we can CONFIDENTLY tie to a real account.
-- ─────────────────────────────────────────────────────────────────────────────

-- 4a. ORGANIZERS — every event's owner.
--     SOURCE: events.user_id  (references profiles.id ⊆ auth.users.id).
insert into public.user_event_roles (user_id, event_id, role, status)
select e.user_id, e.id, 'organizer', 'active'
from public.events e
where e.user_id is not null
on conflict (user_id, event_id, role) do nothing;

-- 4b. ATTENDEES — confirmed/checked_in registrations matched to an account by email.
--     SOURCE: registrations.attendee_email + registrations.status, joined to
--     profiles.email (case-insensitive). registrations has no user_id column, so
--     email is the only confident link.
insert into public.user_event_roles (user_id, event_id, role, status)
select distinct p.id, r.event_id, 'attendee', 'active'
from public.registrations r
join public.profiles p
  on lower(p.email) = lower(r.attendee_email)
where r.status in ('confirmed','checked_in')
on conflict (user_id, event_id, role) do nothing;

-- 4c. SPEAKERS — speakers linked to an account by email (added in migration 039).
--     SOURCE: speakers.email (nullable) → profiles.email (case-insensitive).
--     Speakers without an email cannot be confidently mapped and are skipped.
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='speakers' and column_name='email'
  ) then
    insert into public.user_event_roles (user_id, event_id, role, status)
    select distinct p.id, s.event_id, 'speaker', 'active'
    from public.speakers s
    join public.profiles p
      on lower(p.email) = lower(s.email)
    where s.email is not null and s.email <> ''
    on conflict (user_id, event_id, role) do nothing;
  end if;
end $$;

-- 4d. SPONSORS / EXHIBITORS — sponsors linked to an account by contact_email.
--     SOURCE: sponsors.contact_email (from migration 023) → profiles.email.
--     The exhibitor portal is otherwise token-gated (sponsors.invite_token) with
--     no account link, so contact_email is the only confident account mapping.
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='sponsors' and column_name='contact_email'
  ) then
    insert into public.user_event_roles (user_id, event_id, role, status)
    select distinct p.id, s.event_id, 'sponsor', 'active'
    from public.sponsors s
    join public.profiles p
      on lower(p.email) = lower(s.contact_email)
    where s.contact_email is not null and s.contact_email <> ''
    on conflict (user_id, event_id, role) do nothing;
  end if;
end $$;

-- (staff) — no existing table confidently maps staff to accounts by user_id yet
-- (event staff currently live in a per-event settings/staff surface). Left for a
-- follow-up backfill once app/(app)/events/[id]/staff writes account-linked rows.
