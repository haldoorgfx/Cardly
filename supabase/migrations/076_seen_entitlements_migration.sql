-- ============================================================================
-- 076_seen_entitlements_migration.sql   (Group G8 — G01 migration notice)
--
-- WHAT THIS DOES
--   Adds a single per-user boolean flag used to show the one-time "your existing
--   events now support entitlements" reassurance card (G01) exactly once. Once the
--   organizer dismisses the card we set this to true and never show it again.
--
--   Follows the EXACT pattern of 024_onboarding_completed.sql — a boolean column
--   on profiles, not-null, default false. No data is backfilled; every existing
--   organizer starts at false (unseen) and is shown the card on their next
--   dashboard visit, then flips to true on dismiss.
--
-- IDEMPOTENT: add column if not exists. Safe to re-run.
-- HOW TO APPLY: paste this whole file into the Supabase SQL editor and Run.
--   It does NOT modify any already-applied migration.
-- ============================================================================

alter table public.profiles
  add column if not exists seen_entitlements_migration boolean not null default false;

comment on column public.profiles.seen_entitlements_migration is
  'True once the organizer has dismissed the one-time entitlements migration notice (G01).';
