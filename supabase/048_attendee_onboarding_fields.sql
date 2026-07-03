-- ============================================================================
-- 048_attendee_onboarding_fields.sql
-- Columns the attendee onboarding wizard collects, added to `profiles`.
-- All ADD COLUMN IF NOT EXISTS → idempotent and safe (no data checks, no risk
-- of the constraint issues from the ticketing migration). Paste into Supabase
-- SQL Editor and Run.
--
-- Reuses existing columns where they already fit:
--   name→full_name · photo→avatar_url · city→city · phone→phone ·
--   company→organization · interests→interests[] · language→language.
--
-- dietary + accessibility are PRIVATE (organizer-only aggregate); they live on
-- the attendee's own row (own-row RLS) and are never shown on the card/profile.
-- ============================================================================

alter table profiles
  add column if not exists job_title         text        default '',
  add column if not exists industry          text        default '',
  add column if not exists role_types        text[]      default '{}',
  add column if not exists goals             text[]      default '{}',
  add column if not exists directory_visible boolean     default true,
  add column if not exists open_to_connect   boolean     default true,
  add column if not exists linkedin_url      text        default '',
  add column if not exists x_url             text        default '',
  add column if not exists dietary           text[]      default '{}',
  add column if not exists accessibility     text[]      default '{}',
  add column if not exists onboarding_notes  text        default '';

comment on column profiles.dietary is
  'Private — organizer-only aggregate (catering). Never shown on card/profile.';
comment on column profiles.accessibility is
  'Private — organizer-only aggregate (access needs). Never shown on card/profile.';
