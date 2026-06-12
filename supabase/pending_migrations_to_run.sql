-- ============================================================
-- PENDING MIGRATIONS — run this in Supabase SQL Editor
-- Applies 010_attendee_accounts.sql + 011_discovery_columns.sql
-- All statements are idempotent (safe to run multiple times)
-- ============================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- FROM 010_attendee_accounts.sql
-- M1: Attendee accounts & wallet
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. PROFILES — add attendee fields
alter table profiles
  add column if not exists account_type text not null default 'organizer'
    check (account_type in ('organizer', 'attendee')),
  add column if not exists interests text[] default '{}',
  add column if not exists city text,
  add column if not exists phone text,
  add column if not exists whatsapp_verified boolean default false,
  add column if not exists notification_prefs jsonb default '{
    "tickets_email": true,
    "tickets_whatsapp": true,
    "reminders_email": true,
    "reminders_whatsapp": true,
    "agenda_changes_email": true,
    "agenda_changes_whatsapp": false,
    "organizer_follows_email": true,
    "organizer_follows_whatsapp": false,
    "waitlist_email": true,
    "waitlist_whatsapp": true,
    "recommendations_email": true,
    "recommendations_whatsapp": false
  }'::jsonb,
  add column if not exists onboarding_done boolean default false;

-- 2. SAVED_EVENTS — attendee bookmarks events
create table if not exists saved_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  event_page_id uuid not null references event_pages(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique(user_id, event_page_id)
);

alter table saved_events enable row level security;

drop policy if exists "saved_events: own rows" on saved_events;
create policy "saved_events: own rows" on saved_events
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists saved_events_user_id_idx on saved_events(user_id);

-- 3. ORGANIZER_FOLLOWS — attendee follows an organizer's profile
create table if not exists organizer_follows (
  id                uuid primary key default gen_random_uuid(),
  follower_id       uuid not null references profiles(id) on delete cascade,
  organizer_id      uuid not null references profiles(id) on delete cascade,
  notify_new_events boolean not null default true,
  created_at        timestamptz not null default now(),
  unique(follower_id, organizer_id)
);

alter table organizer_follows enable row level security;

drop policy if exists "organizer_follows: follower own" on organizer_follows;
create policy "organizer_follows: follower own" on organizer_follows
  for all using (auth.uid() = follower_id)
  with check (auth.uid() = follower_id);

drop policy if exists "organizer_follows: organizer read count" on organizer_follows;
create policy "organizer_follows: organizer read count" on organizer_follows
  for select using (auth.uid() = organizer_id);

create index if not exists organizer_follows_organizer_idx on organizer_follows(organizer_id);
create index if not exists organizer_follows_follower_idx  on organizer_follows(follower_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- FROM 011_discovery_columns.sql
-- Discovery columns for marketplace M2
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE event_pages
  ADD COLUMN IF NOT EXISTS city       text,
  ADD COLUMN IF NOT EXISTS country    text,
  ADD COLUMN IF NOT EXISTS category   text,
  ADD COLUMN IF NOT EXISTS price_from numeric(10,2);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio text;

CREATE INDEX IF NOT EXISTS event_pages_city_idx
  ON event_pages(city, starts_at) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS event_pages_category_idx
  ON event_pages(category, starts_at) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS event_pages_country_idx
  ON event_pages(country, starts_at) WHERE is_public = true;
