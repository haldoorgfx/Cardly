-- 047_integrations.sql
-- Per-user third-party integrations (paste-credential model) + Stripe Connect.
-- Providers: slack, zapier, google_sheets, mailchimp, hubspot.
-- Stripe event payments are handled via Stripe Connect columns on profiles.

create table if not exists user_integrations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  provider    text not null check (provider in ('slack','zapier','google_sheets','mailchimp','hubspot')),
  -- provider-specific credentials/config: webhook_url, api_key, audience_id, token, server_prefix, etc.
  config      jsonb not null default '{}'::jsonb,
  enabled     boolean not null default true,
  last_used_at timestamptz,
  last_error  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, provider)
);

alter table user_integrations enable row level security;

-- Owner-only access. Server routes use the service-role client (bypasses RLS)
-- but these policies protect any direct client access.
drop policy if exists "user_integrations_select_own" on user_integrations;
drop policy if exists "user_integrations_insert_own" on user_integrations;
drop policy if exists "user_integrations_update_own" on user_integrations;
drop policy if exists "user_integrations_delete_own" on user_integrations;

create policy "user_integrations_select_own" on user_integrations
  for select using (auth.uid() = user_id);
create policy "user_integrations_insert_own" on user_integrations
  for insert with check (auth.uid() = user_id);
create policy "user_integrations_update_own" on user_integrations
  for update using (auth.uid() = user_id);
create policy "user_integrations_delete_own" on user_integrations
  for delete using (auth.uid() = user_id);

-- ── Stripe Connect (organizer event payments) ────────────────────────────────
alter table profiles
  add column if not exists stripe_connect_account_id       text,
  add column if not exists stripe_connect_charges_enabled   boolean not null default false,
  add column if not exists stripe_connect_onboarded_at      timestamptz;
