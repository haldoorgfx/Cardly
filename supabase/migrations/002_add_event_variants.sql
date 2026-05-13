-- ─────────────────────────────────────────
-- Migration 002: event_variants table
-- Add brand_kit to profiles, variant_id to generated_cards
-- ─────────────────────────────────────────

-- brand_kit column on profiles
alter table profiles add column if not exists brand_kit jsonb;

-- ─────────────────────────────────────────
-- EVENT VARIANTS
-- ─────────────────────────────────────────
create table if not exists event_variants (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references events(id) on delete cascade,
  variant_name      text not null,
  variant_slug      text not null,
  background_url    text,
  background_width  int,
  background_height int,
  zones             jsonb not null default '[]'::jsonb,
  position          int not null default 0,
  created_at        timestamptz not null default now()
);

-- variant_id on generated_cards
alter table generated_cards
  add column if not exists variant_id uuid references event_variants(id) on delete set null;

-- ─────────────────────────────────────────
-- RLS for event_variants
-- ─────────────────────────────────────────
alter table event_variants enable row level security;

-- Event owners have full access to their variants
create policy "event_variants: owner access"
  on event_variants for all
  using (
    exists (
      select 1 from events
      where events.id = event_variants.event_id
        and events.user_id = auth.uid()
    )
  );

-- Anyone can read variants of published events (needed for attendee page)
create policy "event_variants: public read published"
  on event_variants for select
  using (
    exists (
      select 1 from events
      where events.id = event_variants.event_id
        and events.status = 'published'
    )
  );

-- ─────────────────────────────────────────
-- Storage buckets (apply in Supabase dashboard if not done)
-- ─────────────────────────────────────────
-- insert into storage.buckets (id, name, public) values ('event-backgrounds', 'event-backgrounds', true) on conflict do nothing;
-- insert into storage.buckets (id, name, public) values ('generated-cards', 'generated-cards', true) on conflict do nothing;
