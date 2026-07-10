-- ============================================================================
-- 066_multi_day.sql   (Group G5 — multi-day events)
--
-- WHAT THIS DOES
--   Adds per-day structure to a SINGLE event: each day can have its own
--   check-in toggle, capacity, and set of entitlements (M01). The scanner's
--   day selector (M02) and the attendance-by-day grid (M03) read from here, and
--   entitlement_redemptions.day_index (added in 065) ties a redemption to a day.
--
--     event_days             — one row per day of an event
--     event_day_entitlements — which entitlements apply on which day
--
-- 030_waitlist_series CHECK  (per the brief: extend a series concept if it
--   already models days)
--   030 defines `event_series` + links `event_pages.series_id`. That is a
--   grouping of SEPARATE events (a recurring/related-events SERIES sharing a
--   slug + organizer), NOT multiple days WITHIN one event. There is no existing
--   per-day concept anywhere in the schema, so `event_days` is a genuinely new
--   structure and does NOT duplicate `event_series`. (An event that belongs to a
--   series can still have its own multiple days — the two are orthogonal.)
--
-- DEPENDS ON
--   • 017_event_registration  → events
--   • 055_user_event_roles    → is_event_organizer() / can_manage_event()
--   • 065_entitlements        → entitlements, can_manage_event(), is_event_attendee(),
--                               is_public_event() (from 054)
--
-- IDEMPOTENT: create table if not exists / drop policy if exists + create policy.
--   Safe to re-run. HOW TO APPLY: paste this whole file into the Supabase SQL
--   editor and Run (after 065). Does NOT modify any already-applied migration.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. event_days — per-day settings for a single event.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.event_days (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events(id) on delete cascade,
  day_index       int  not null,
  date            date,
  checkin_enabled boolean not null default true,
  capacity        int,
  created_at      timestamptz not null default now(),
  unique (event_id, day_index)
);
create index if not exists event_days_event_idx on public.event_days(event_id, day_index);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. event_day_entitlements — which entitlements are valid on which day (M01).
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.event_day_entitlements (
  event_day_id   uuid not null references public.event_days(id) on delete cascade,
  entitlement_id uuid not null references public.entitlements(id) on delete cascade,
  primary key (event_day_id, entitlement_id)
);
create index if not exists ede_entitlement_idx on public.event_day_entitlements(entitlement_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Row-Level Security — same pattern as 065:
--    owner/active-staff manage; attendees + public event pages may read.
-- ─────────────────────────────────────────────────────────────────────────────

-- event_days
alter table public.event_days enable row level security;

drop policy if exists "event_days: manage" on public.event_days;
create policy "event_days: manage" on public.event_days
  for all
  using (public.can_manage_event(event_id))
  with check (public.can_manage_event(event_id));

drop policy if exists "event_days: read" on public.event_days;
create policy "event_days: read" on public.event_days
  for select
  using (
    public.can_manage_event(event_id)
    or public.is_event_attendee(event_id)
    or public.is_public_event(event_id)
  );

-- event_day_entitlements (event derived via the joined day)
alter table public.event_day_entitlements enable row level security;

drop policy if exists "ede: manage" on public.event_day_entitlements;
create policy "ede: manage" on public.event_day_entitlements
  for all
  using (
    exists (
      select 1 from public.event_days d
      where d.id = event_day_id and public.can_manage_event(d.event_id)
    )
  )
  with check (
    exists (
      select 1 from public.event_days d
      where d.id = event_day_id and public.can_manage_event(d.event_id)
    )
  );

drop policy if exists "ede: read" on public.event_day_entitlements;
create policy "ede: read" on public.event_day_entitlements
  for select
  using (
    exists (
      select 1 from public.event_days d
      where d.id = event_day_id
        and (
          public.can_manage_event(d.event_id)
          or public.is_event_attendee(d.event_id)
          or public.is_public_event(d.event_id)
        )
    )
  );
