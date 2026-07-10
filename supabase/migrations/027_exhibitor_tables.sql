-- Migration 027: Exhibitor Portal — sponsor_resources, sponsor_members, sponsor_leads fixes
-- Idempotent — all CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS

-- ─── sponsor_resources ───────────────────────────────────────────────────────
create table if not exists sponsor_resources (
  id               uuid primary key default gen_random_uuid(),
  sponsor_id       uuid not null references sponsors(id) on delete cascade,
  name             text not null,
  url              text not null,
  kind             text,
  file_size_bytes  bigint,
  opens            int not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists resources_sponsor_idx on sponsor_resources(sponsor_id);

-- ─── sponsor_members ─────────────────────────────────────────────────────────
create table if not exists sponsor_members (
  id              uuid primary key default gen_random_uuid(),
  sponsor_id      uuid not null references sponsors(id) on delete cascade,
  invited_email   text not null,
  role            text,
  status          text not null default 'invited'
                    check (status in ('invited','active')),
  user_id         uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists members_sponsor_idx on sponsor_members(sponsor_id);

-- ─── sponsor_leads extra columns ─────────────────────────────────────────────
alter table sponsor_leads
  add column if not exists company     text,
  add column if not exists role        text,
  add column if not exists captured_at timestamptz not null default now();

-- Backfill captured_at for any existing rows
update sponsor_leads set captured_at = created_at where captured_at = now() and created_at < now();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table sponsor_resources enable row level security;
alter table sponsor_members   enable row level security;

-- sponsor_resources: public insert (exhibitors via token-gated API), owner reads all
do $$ begin
  if not exists (select 1 from pg_policies where tablename='sponsor_resources' and policyname='public_all') then
    create policy public_all on sponsor_resources for all using (true) with check (true);
  end if;
end $$;

-- sponsor_members: public all (API is token-gated)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='sponsor_members' and policyname='public_all') then
    create policy public_all on sponsor_members for all using (true) with check (true);
  end if;
end $$;
