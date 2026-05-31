-- Idempotency key on generated_cards — prevents double-rendering from double-taps.
-- Nullable so existing rows are unaffected; unique so a duplicate key is rejected.
alter table generated_cards
  add column if not exists idempotency_key uuid unique;
