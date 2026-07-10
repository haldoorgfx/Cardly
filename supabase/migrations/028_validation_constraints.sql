-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 028: Database-level validation constraints
--
-- These CHECK constraints are the final safety net. Even if API-level Zod
-- validation is bypassed (direct DB access, future bugs, SDK calls), these
-- constraints prevent logically invalid data from ever being stored.
--
-- NOT VALID: constraints apply to new inserts/updates only; existing rows
-- are not retroactively checked. This is the production-safe approach when
-- deploying onto a DB that already has data.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── ticket_types ─────────────────────────────────────────────────────────────

ALTER TABLE ticket_types DROP CONSTRAINT IF EXISTS chk_ticket_price_non_negative;
ALTER TABLE ticket_types
  ADD CONSTRAINT chk_ticket_price_non_negative
    CHECK (price >= 0) NOT VALID;

ALTER TABLE ticket_types DROP CONSTRAINT IF EXISTS chk_ticket_quantity_positive;
ALTER TABLE ticket_types
  ADD CONSTRAINT chk_ticket_quantity_positive
    CHECK (quantity IS NULL OR quantity > 0) NOT VALID;

ALTER TABLE ticket_types DROP CONSTRAINT IF EXISTS chk_ticket_sales_window;
ALTER TABLE ticket_types
  ADD CONSTRAINT chk_ticket_sales_window
    CHECK (sales_end IS NULL OR sales_start IS NULL OR sales_end > sales_start) NOT VALID;

ALTER TABLE ticket_types DROP CONSTRAINT IF EXISTS chk_ticket_min_order_positive;
ALTER TABLE ticket_types
  ADD CONSTRAINT chk_ticket_min_order_positive
    CHECK (min_per_order IS NULL OR min_per_order >= 1) NOT VALID;

ALTER TABLE ticket_types DROP CONSTRAINT IF EXISTS chk_ticket_max_order_positive;
ALTER TABLE ticket_types
  ADD CONSTRAINT chk_ticket_max_order_positive
    CHECK (max_per_order IS NULL OR max_per_order >= 1) NOT VALID;

ALTER TABLE ticket_types DROP CONSTRAINT IF EXISTS chk_ticket_min_lte_max_order;
ALTER TABLE ticket_types
  ADD CONSTRAINT chk_ticket_min_lte_max_order
    CHECK (min_per_order IS NULL OR max_per_order IS NULL OR min_per_order <= max_per_order) NOT VALID;

ALTER TABLE ticket_types DROP CONSTRAINT IF EXISTS chk_ticket_quantity_sold_non_negative;
ALTER TABLE ticket_types
  ADD CONSTRAINT chk_ticket_quantity_sold_non_negative
    CHECK (quantity_sold >= 0) NOT VALID;

-- ── promo_codes ──────────────────────────────────────────────────────────────

ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_discount_positive;
ALTER TABLE promo_codes
  ADD CONSTRAINT chk_promo_discount_positive
    CHECK (discount_value > 0) NOT VALID;

ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_percent_max;
ALTER TABLE promo_codes
  ADD CONSTRAINT chk_promo_percent_max
    CHECK (discount_type != 'percent' OR discount_value <= 100) NOT VALID;

ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_discount_type;
ALTER TABLE promo_codes
  ADD CONSTRAINT chk_promo_discount_type
    CHECK (discount_type IN ('percent', 'fixed')) NOT VALID;

ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_max_uses_positive;
ALTER TABLE promo_codes
  ADD CONSTRAINT chk_promo_max_uses_positive
    CHECK (max_uses IS NULL OR max_uses >= 1) NOT VALID;

ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_uses_count_non_negative;
ALTER TABLE promo_codes
  ADD CONSTRAINT chk_promo_uses_count_non_negative
    CHECK (uses_count >= 0) NOT VALID;

ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS chk_promo_valid_window;
ALTER TABLE promo_codes
  ADD CONSTRAINT chk_promo_valid_window
    CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from) NOT VALID;

-- ── event_pages ───────────────────────────────────────────────────────────────

ALTER TABLE event_pages DROP CONSTRAINT IF EXISTS chk_event_page_date_order;
ALTER TABLE event_pages
  ADD CONSTRAINT chk_event_page_date_order
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at) NOT VALID;

ALTER TABLE event_pages DROP CONSTRAINT IF EXISTS chk_event_page_deadline_before_start;
ALTER TABLE event_pages
  ADD CONSTRAINT chk_event_page_deadline_before_start
    CHECK (registration_deadline IS NULL OR starts_at IS NULL OR registration_deadline < starts_at) NOT VALID;

ALTER TABLE event_pages DROP CONSTRAINT IF EXISTS chk_event_page_capacity_positive;
ALTER TABLE event_pages
  ADD CONSTRAINT chk_event_page_capacity_positive
    CHECK (max_capacity IS NULL OR max_capacity >= 1) NOT VALID;

-- ── events ────────────────────────────────────────────────────────────────────

ALTER TABLE events DROP CONSTRAINT IF EXISTS chk_event_name_not_empty;
ALTER TABLE events
  ADD CONSTRAINT chk_event_name_not_empty
    CHECK (char_length(trim(name)) > 0) NOT VALID;

ALTER TABLE events DROP CONSTRAINT IF EXISTS chk_event_status;
ALTER TABLE events
  ADD CONSTRAINT chk_event_status
    CHECK (status IN ('draft', 'published', 'archived')) NOT VALID;

-- ── registrations ─────────────────────────────────────────────────────────────

ALTER TABLE registrations DROP CONSTRAINT IF EXISTS chk_registration_name_not_empty;
ALTER TABLE registrations
  ADD CONSTRAINT chk_registration_name_not_empty
    CHECK (attendee_name IS NULL OR char_length(trim(attendee_name)) > 0) NOT VALID;
