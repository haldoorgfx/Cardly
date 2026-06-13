-- ============================================================
-- 040: Platform fees on paid tickets (the take-rate engine)
--
-- Records what Karta earns and what the organizer is owed on every
-- PAID registration. Karta is already the merchant of record (money
-- lands in Karta's processor accounts), so payout v1 is manual:
--   organizer is owed SUM(organizer_net); Karta keeps SUM(platform_fee).
--
-- Invariant: organizer_net = amount_paid - platform_fee.
--   absorb → attendee pays face;        net = face - fee
--   pass   → attendee pays face + fee;   net = face
--
-- fee_bearer defaults to 'absorb' so enabling fees never silently
-- raises attendee-facing prices on existing events. Idempotent.
-- ============================================================

alter table registrations
  add column if not exists platform_fee  numeric(10,2) not null default 0,
  add column if not exists organizer_net numeric(10,2),
  add column if not exists fee_bearer    text not null default 'absorb'
    check (fee_bearer in ('absorb', 'pass'));

alter table events
  add column if not exists fee_bearer text not null default 'absorb'
    check (fee_bearer in ('absorb', 'pass'));
