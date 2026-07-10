-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text unique,
  full_name   text,
  plan        text not null default 'free' check (plan in ('free', 'pro', 'studio')),
  created_at  timestamptz not null default now()
);

-- Auto-create profile row when a new user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────
-- EVENTS
-- ─────────────────────────────────────────
create table if not exists events (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  name              text not null,
  slug              text unique not null,
  background_url    text,
  background_width  int,
  background_height int,
  zones             jsonb not null default '[]'::jsonb,
  status            text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  view_count        int not null default 0,
  download_count    int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_updated_at on events;
create trigger events_updated_at
  before update on events
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────
-- GENERATED CARDS
-- ─────────────────────────────────────────
create table if not exists generated_cards (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references events(id) on delete cascade,
  attendee_name  text,
  attendee_data  jsonb,
  output_url     text,
  created_at     timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- RLS POLICIES
-- ─────────────────────────────────────────
alter table profiles enable row level security;
alter table events enable row level security;
alter table generated_cards enable row level security;

-- Profiles: users can only read/write their own row
drop policy if exists "profiles: own row" on profiles;
create policy "profiles: own row" on profiles
  for all using (auth.uid() = id);

-- Events: owners have full access
drop policy if exists "events: owner access" on events;
create policy "events: owner access" on events
  for all using (auth.uid() = user_id);

-- Events: public can read published events by slug (for attendee page)
drop policy if exists "events: public read published" on events;
create policy "events: public read published" on events
  for select using (status = 'published');

-- Generated cards: anyone can insert (attendees)
drop policy if exists "generated_cards: public insert" on generated_cards;
create policy "generated_cards: public insert" on generated_cards
  for insert with check (true);

-- Generated cards: event owners can read their cards
drop policy if exists "generated_cards: owner read" on generated_cards;
create policy "generated_cards: owner read" on generated_cards
  for select using (
    exists (
      select 1 from events
      where events.id = generated_cards.event_id
        and events.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────
-- STORAGE BUCKETS (run via Supabase dashboard or CLI)
-- ─────────────────────────────────────────
-- bucket: event-backgrounds  (private, authenticated upload, public read)
-- bucket: generated-cards    (private, public insert, owner read)
