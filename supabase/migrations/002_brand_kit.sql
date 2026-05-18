-- Add brand_kit JSONB column to profiles
-- Stores uploaded brand assets: logos, colors, fonts
alter table profiles
  add column if not exists brand_kit jsonb not null default '{}'::jsonb;
