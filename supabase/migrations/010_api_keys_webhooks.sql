-- 010_api_keys_webhooks.sql

-- API keys (studio users call /api/v1/render with a Bearer token)
create table if not exists api_keys (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  name          text not null,
  key_hash      text not null unique,   -- sha256 of the raw key, never stored plain
  key_prefix    text not null,          -- first 12 chars for display (e.g. "sk_live_a1b2")
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz,
  revoked_at    timestamptz            -- null = active
);

create index if not exists api_keys_user_id_idx  on api_keys(user_id);
create index if not exists api_keys_key_hash_idx on api_keys(key_hash);

alter table api_keys enable row level security;
-- Service role only — all access via API routes that verify ownership

-- Webhooks
create table if not exists webhooks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  url            text not null,
  secret         text not null default encode(gen_random_bytes(24), 'hex'),
  events         text[] not null default '{}',
  enabled        boolean not null default true,
  created_at     timestamptz not null default now(),
  last_fired_at  timestamptz,
  failure_count  int not null default 0
);

create index if not exists webhooks_user_id_idx on webhooks(user_id);

alter table webhooks enable row level security;
-- Service role only
