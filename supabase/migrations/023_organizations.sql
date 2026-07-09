-- 023_organizations.sql
-- Multi-tenancy foundation: organizations + members + org_id on events.
-- SAFE: all additive. Existing user_id RLS policies stay intact.
-- Auto-creates one "personal workspace" org per existing user and back-fills events.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ORGANIZATIONS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists organizations (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null,
  slug         text        not null,
  plan         text        not null default 'free',
  owner_id     uuid        not null references profiles(id) on delete cascade,
  brand        jsonb       not null default '{}'::jsonb,
  onboarded_at timestamptz,                         -- null = wizard not completed
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index if not exists organizations_slug_idx on organizations(slug);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ORGANIZATION_MEMBERS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id)  on delete cascade,
  user_id         uuid not null references profiles(id)        on delete cascade,
  role            text not null default 'member'
    check (role in ('owner', 'admin', 'editor', 'checkin_staff', 'viewer')),
  joined_at       timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ADD organization_id TO events (nullable — backward-compatible)
-- ─────────────────────────────────────────────────────────────────────────────
alter table events add column if not exists
  organization_id uuid references organizations(id) on delete set null;

create index if not exists events_org_idx on events(organization_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. AUTO-CREATE one org per existing user and back-fill their events
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare
  r           record;
  new_org_id  uuid;
  base_name   text;
  base_slug   text;
  final_slug  text;
  suffix      int := 0;
begin
  for r in
    select p.id, p.full_name, p.email, p.plan
    from profiles p
    where not exists (
      select 1 from organizations o where o.owner_id = p.id
    )
  loop
    base_name  := coalesce(nullif(trim(r.full_name), ''), split_part(r.email, '@', 1), 'My workspace');
    base_slug  := regexp_replace(lower(base_name), '[^a-z0-9]+', '-', 'g');
    base_slug  := trim(both '-' from base_slug);
    -- Ensure slug uniqueness with a numeric suffix if needed
    final_slug := base_slug;
    suffix     := 0;
    while exists (select 1 from organizations where slug = final_slug) loop
      suffix     := suffix + 1;
      final_slug := base_slug || '-' || suffix;
    end loop;

    insert into organizations (name, slug, plan, owner_id, onboarded_at)
    values (base_name, final_slug, coalesce(r.plan, 'free'), r.id, now())
    returning id into new_org_id;

    insert into organization_members (organization_id, user_id, role)
    values (new_org_id, r.id, 'owner');

    update events
    set organization_id = new_org_id
    where user_id = r.id
      and organization_id is null;
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. TRIGGER — auto-create org when a new user signs up (post-onboarding)
--    The onboarding wizard sets the proper name; this is just a safety net.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function fn_create_default_org()
returns trigger language plpgsql security definer as $$
declare
  base_slug  text;
  final_slug text;
  suffix     int := 0;
begin
  base_slug  := regexp_replace(lower(coalesce(nullif(trim(new.full_name),''), split_part(new.email,'@',1), 'workspace')), '[^a-z0-9]+', '-', 'g');
  base_slug  := trim(both '-' from base_slug);
  final_slug := base_slug;
  while exists (select 1 from organizations where slug = final_slug) loop
    suffix     := suffix + 1;
    final_slug := base_slug || '-' || suffix;
  end loop;

  insert into organizations (name, slug, plan, owner_id)
  values (
    coalesce(nullif(trim(new.full_name), ''), split_part(new.email, '@', 1), 'My workspace'),
    final_slug,
    coalesce(new.plan, 'free'),
    new.id
  )
  on conflict do nothing;

  insert into organization_members (organization_id, user_id, role)
  select id, new.id, 'owner'
  from   organizations
  where  owner_id = new.id
    and  not exists (select 1 from organization_members where user_id = new.id)
  limit  1;

  return new;
end $$;

drop trigger if exists trg_create_default_org on profiles;
create trigger trg_create_default_org
  after insert on profiles
  for each row execute procedure fn_create_default_org();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. RLS
-- ─────────────────────────────────────────────────────────────────────────────
alter table organizations       enable row level security;
alter table organization_members enable row level security;

-- Organizations: any member can read
drop policy if exists "orgs: member read"   on organizations;
create policy "orgs: member read" on organizations
  for select using (
    id in (
      select organization_id from organization_members
      where user_id = auth.uid()
    )
  );

-- Organizations: owner can update their org
drop policy if exists "orgs: owner update" on organizations;
create policy "orgs: owner update" on organizations
  for update using (owner_id = auth.uid());

-- Organizations: authenticated users can create orgs they own
drop policy if exists "orgs: owner insert" on organizations;
create policy "orgs: owner insert" on organizations
  for insert with check (owner_id = auth.uid());

-- Org members: any member of the org can see other members
drop policy if exists "org_members: member read" on organization_members;
create policy "org_members: member read" on organization_members
  for select using (
    organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid()
    )
  );

-- Org members: owner can manage membership
drop policy if exists "org_members: owner manage" on organization_members;
create policy "org_members: owner manage" on organization_members
  for all using (
    organization_id in (
      select id from organizations where owner_id = auth.uid()
    )
  );
