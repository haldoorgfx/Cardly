-- 048_api_key_scopes.sql
-- Persist and enforce per-key scopes for the public API.
-- Valid scopes: events:read, registrations:read, analytics:read, checkin:write, full_access.

alter table api_keys
  add column if not exists scopes text[] not null default '{}';
