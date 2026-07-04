-- ============================================================================
-- 057_newsletter_subscribers.sql
--
-- Stores marketing-newsletter signups collected from the public blog and
-- what's-new pages. The POST /api/newsletter route inserts here (idempotently
-- on email) via the service-role client. If a Resend Audience is configured
-- the route ALSO subscribes the contact there — but this table is the durable
-- source of truth and the route never depends on Resend being present.
--
-- IDEMPOTENT. SELECT-safe. Does NOT touch applied migrations 001–055.
-- ============================================================================

create table if not exists public.newsletter_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  source      text,
  created_at  timestamptz not null default now()
);

-- Case-insensitive uniqueness so "A@x.com" and "a@x.com" collapse to one row.
create unique index if not exists newsletter_subscribers_email_lower_key
  on public.newsletter_subscribers (lower(email));

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: no one reads or writes through the anon/auth clients. The API route
-- uses the service-role key (bypasses RLS). Enabling RLS with no permissive
-- policy means the public/anon roles get zero access to email addresses.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.newsletter_subscribers enable row level security;
