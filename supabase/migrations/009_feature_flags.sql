-- 009_feature_flags.sql
-- Feature flags table
create table if not exists feature_flags (
  flag           text primary key,
  label          text not null,
  description    text,
  enabled        boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Per-user overrides
create table if not exists feature_flag_overrides (
  flag     text not null references feature_flags(flag) on delete cascade,
  user_id  uuid not null references profiles(id) on delete cascade,
  enabled  boolean not null,
  primary key (flag, user_id)
);

-- RLS — service role bypasses; no additional policies needed for now
alter table feature_flags          enable row level security;
alter table feature_flag_overrides enable row level security;

-- Seed defaults (all off)
insert into feature_flags (flag, label, description, enabled) values
  ('ai_captions',       'AI social captions',  'AI-generated caption suggestions on the success screen', false),
  ('bulk_export',       'Bulk card export',    'Download all attendee cards as a ZIP file',              false),
  ('analytics_v2',      'Analytics v2',        'Enhanced analytics with cohort and funnel views',        false),
  ('qr_customization',  'QR customisation',    'Custom QR code colors and logo embedding',               false),
  ('new_canvas_editor', 'Canvas editor v2',    'Redesigned drag-and-drop canvas editor (beta)',          false)
on conflict (flag) do nothing;
