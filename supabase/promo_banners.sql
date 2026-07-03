-- ============================================================================
-- Eventera — Discover promo banners (admin-controlled sliding banner)
-- ----------------------------------------------------------------------------
-- Run this once in the Supabase SQL Editor (Dashboard → SQL → New query →
-- paste → Run). It creates the table the mobile app's Discover carousel reads,
-- turns on row-level security so the public can only see ACTIVE banners, and
-- seeds one default Eventera promo so the carousel is never empty.
--
-- After running, manage banners visually in Dashboard → Table Editor →
-- promo_banners. Add a row, set active = true, and it appears in the app.
-- ============================================================================

create table if not exists public.promo_banners (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  subtitle    text,
  -- Optional background image. If null, the gradient below is used instead.
  image_url   text,
  -- Call-to-action pill
  cta_label   text default 'Explore events',
  cta_type    text default 'none',   -- 'none' | 'event' | 'url'
  cta_target  text,                  -- event slug (cta_type='event') or https url (cta_type='url')
  -- Gradient (used when image_url is null)
  bg_start    text default '#163828',
  bg_end      text default '#2A6A50',
  text_color  text default '#FFFFFF',
  -- Control
  active      boolean default true,
  sort_order  int default 0,
  starts_at   timestamptz,           -- optional schedule window (null = always)
  ends_at     timestamptz,           -- optional schedule window (null = always)
  created_at  timestamptz default now()
);

-- Public can READ active banners only. Writes happen through the Supabase
-- dashboard (service role) — no public insert/update/delete policy exists,
-- so anon/authenticated users can never change banners.
alter table public.promo_banners enable row level security;

drop policy if exists "promo_banners public read active" on public.promo_banners;
create policy "promo_banners public read active"
  on public.promo_banners
  for select
  using (active = true);

-- Seed a default Eventera promo (only if the table is empty).
insert into public.promo_banners (title, subtitle, cta_label, cta_type, sort_order)
select
  'The new era of events',
  'Discover, register, and get your card in seconds.',
  'Explore events',
  'none',
  0
where not exists (select 1 from public.promo_banners);
