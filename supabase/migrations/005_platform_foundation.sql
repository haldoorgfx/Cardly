-- 005_platform_foundation.sql
-- Platform Foundation Phase 1: RBAC, site_settings, changelog, audit_log
-- IDEMPOTENT: safe to run multiple times

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES — extend role constraint to include 'studio'
-- ─────────────────────────────────────────────────────────────────────────────
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('user', 'studio', 'admin', 'super_admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SITE_SETTINGS — single-row brand/theme config (enforced by id = 1)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists site_settings (
  id          int primary key default 1 check (id = 1),
  brand_name  text not null default 'Karta',
  logo_url    text,
  favicon_url text,
  colors      jsonb not null default '{}'::jsonb,
  fonts       jsonb not null default '{}'::jsonb,
  gradients   jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references profiles(id)
);

-- Seed with Karta's current locked values; do nothing if already seeded
insert into site_settings (id, brand_name, colors, fonts, gradients)
values (
  1,
  'Karta',
  '{
    "primary":     "#1F4D3A",
    "primaryDark": "#163828",
    "primarySoft": "#E8EFEB",
    "primaryMid":  "#2A6A50",
    "accent":      "#E8C57E",
    "accentDark":  "#C9A45E",
    "ink":         "#0F1F18",
    "inkSoft":     "#3A4A42",
    "muted":       "#6B7A72",
    "cream":       "#FAF6EE"
  }'::jsonb,
  '{
    "display": "DM Sans",
    "body":    "Inter",
    "mono":    "JetBrains Mono"
  }'::jsonb,
  '{
    "hero": "linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)"
  }'::jsonb
)
on conflict (id) do nothing;

-- RLS: public can read (ThemeProvider + public pages); no direct client write
alter table site_settings enable row level security;

drop policy if exists "site_settings: public read" on site_settings;
create policy "site_settings: public read" on site_settings
  for select using (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CHANGELOG_ENTRIES
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists changelog_entries (
  id           uuid primary key default gen_random_uuid(),
  version      text,
  title        text not null,
  description  text not null,
  type         text not null check (type in ('added', 'fixed', 'improved', 'removed', 'security')),
  published    boolean not null default false,
  published_at timestamptz,
  created_by   uuid references profiles(id),
  created_at   timestamptz not null default now()
);

alter table changelog_entries enable row level security;

drop policy if exists "changelog: public read published" on changelog_entries;
create policy "changelog: public read published" on changelog_entries
  for select using (published = true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. AUDIT_LOG
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references profiles(id),
  actor_email text,                           -- denormalized: readable even if actor deleted
  action      text not null,                  -- e.g. "theme.update", "changelog.create"
  entity_type text,                           -- "site_settings", "changelog_entry", "profile"
  entity_id   text,
  changes     jsonb,                          -- { before: {...}, after: {...} }
  created_at  timestamptz not null default now()
);

alter table audit_log enable row level security;

-- Completely locked to clients — only the server (service role) reads/writes
drop policy if exists "audit_log: no direct client access" on audit_log;
create policy "audit_log: no direct client access" on audit_log
  for all using (false);

create index if not exists audit_log_actor_idx   on audit_log(actor_id);
create index if not exists audit_log_created_idx on audit_log(created_at desc);
create index if not exists audit_log_action_idx  on audit_log(action);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. brand-assets storage bucket (manual step)
-- ─────────────────────────────────────────────────────────────────────────────
-- Run in Supabase Dashboard → Storage → New bucket:
--   Name:            brand-assets
--   Public bucket:   true   (logos/favicons need public URLs)
--   File size limit: 5242880  (5 MB)
--   Allowed MIME:    image/*
