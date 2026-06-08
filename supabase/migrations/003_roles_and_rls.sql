-- Phase 2 Foundation: roles, avatar, notification prefs, and RLS hardening

-- ─────────────────────────────────────────
-- PROFILES — add role, avatar, notifications
-- ─────────────────────────────────────────
alter table profiles
  add column if not exists role text not null default 'user'
    check (role in ('user', 'admin', 'super_admin')),
  add column if not exists avatar_url text,
  add column if not exists notify_downloads boolean not null default true,
  add column if not exists notify_views boolean not null default false;

-- ─────────────────────────────────────────
-- event_variants — enable RLS (was missing entirely)
-- ─────────────────────────────────────────
alter table event_variants enable row level security;

-- Event owner has full access to their variants
drop policy if exists "variants: owner access" on event_variants;
create policy "variants: owner access" on event_variants
  for all using (
    exists (
      select 1 from events
      where events.id = event_variants.event_id
        and events.user_id = auth.uid()
    )
  );

-- Public can read variants of published events (for attendee flow)
drop policy if exists "variants: public read published" on event_variants;
create policy "variants: public read published" on event_variants
  for select using (
    exists (
      select 1 from events
      where events.id = event_variants.event_id
        and events.status = 'published'
    )
  );

-- ─────────────────────────────────────────
-- events — split 'for all' into explicit per-op policies with WITH CHECK on insert
-- ─────────────────────────────────────────
drop policy if exists "events: owner access" on events;

drop policy if exists "events: owner select" on events;
create policy "events: owner select" on events
  for select using (auth.uid() = user_id);

drop policy if exists "events: owner insert" on events;
create policy "events: owner insert" on events
  for insert with check (auth.uid() = user_id);

drop policy if exists "events: owner update" on events;
create policy "events: owner update" on events
  for update using (auth.uid() = user_id);

drop policy if exists "events: owner delete" on events;
create policy "events: owner delete" on events
  for delete using (auth.uid() = user_id);

drop policy if exists "events: public read published" on events;

create policy "events: public read published" on events
  for select using (status = 'published');

-- ─────────────────────────────────────────
-- generated_cards — restrict public insert to published events only
-- ─────────────────────────────────────────
drop policy if exists "generated_cards: public insert" on generated_cards;

drop policy if exists "generated_cards: public insert published only" on generated_cards;
create policy "generated_cards: public insert published only" on generated_cards
  for insert with check (
    exists (
      select 1 from events
      where events.id = generated_cards.event_id
        and events.status = 'published'
    )
  );

-- ─────────────────────────────────────────
-- Storage bucket note (run in Supabase dashboard):
--   bucket: avatars  (public read, authenticated write, 2 MB max, image/* only)
-- ─────────────────────────────────────────
