-- Migration 024: add onboarding_completed flag to profiles
-- Idempotent

alter table profiles
  add column if not exists onboarding_completed boolean not null default false;

comment on column profiles.onboarding_completed is
  'True once the user has finished the post-signup onboarding wizard.';
