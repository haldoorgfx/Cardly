-- 046: add checkout configuration columns to events table
-- These columns gate behaviour in the registration flow (approval, VAT, etc.)
-- Missing columns cause PostgREST to return an error → register API returns "Event not found"

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS checkout_collect_details  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checkout_require_approval boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checkout_show_remaining   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checkout_apply_vat        boolean NOT NULL DEFAULT false;
