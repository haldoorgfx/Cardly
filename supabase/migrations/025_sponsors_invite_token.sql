-- Migration 025: Add invite_token to sponsors for exhibitor portal access
-- Idempotent

alter table sponsors add column if not exists invite_token uuid default gen_random_uuid() unique;

-- Backfill any existing rows that have null invite_token
update sponsors set invite_token = gen_random_uuid() where invite_token is null;

-- Make it not null after backfill
alter table sponsors alter column invite_token set not null;
