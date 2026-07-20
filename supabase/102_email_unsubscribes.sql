-- 102 — Email unsubscribe suppression list
--
-- WHY: organizer broadcasts (/api/events/[id]/communicate) had no opt-out of
-- any kind — no unsubscribe link, no List-Unsubscribe header, no suppression
-- list. That is a CAN-SPAM/GDPR problem, and since Feb 2024 Gmail and Yahoo
-- require List-Unsubscribe on bulk mail, so it is a deliverability problem too:
-- without it, broadcasts get junked.
--
-- Recipients are attendee EMAIL ADDRESSES, many of whom have no Eventera
-- account, so the existing profiles.notification_prefs gate cannot cover them.
-- This table is keyed by email address instead.
--
-- Scope: opting out stops organizer BROADCAST email. It deliberately does NOT
-- stop transactional mail (ticket confirmations, password resets) — those are
-- not commercial messages and the recipient asked for them by registering.
--
-- NOTE: the application code activates this feature only when this table
-- exists. Until this migration is applied, broadcasts send exactly as they do
-- today (no unsubscribe link, no header) rather than advertising an opt-out
-- that cannot be recorded. Applying this switches the feature on by itself.

create table if not exists public.email_unsubscribes (
  email       text primary key,
  reason      text,
  -- Which event's broadcast prompted the opt-out. Informational only — the
  -- opt-out itself is global, so a single click genuinely stops the mail
  -- rather than leaving the recipient to unsubscribe once per event.
  event_id    uuid references public.events(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists email_unsubscribes_created_at_idx
  on public.email_unsubscribes (created_at desc);

-- RLS: no public access at all. Unsubscribing happens through the server
-- route, which verifies an HMAC token and uses the service-role client. There
-- is no reason for a browser to read or write this table directly — and
-- leaving it readable would expose a list of email addresses.
alter table public.email_unsubscribes enable row level security;

-- Deliberately no policies: with RLS on and no policy, anon/authenticated get
-- nothing, while the service-role key (which bypasses RLS) still works.
