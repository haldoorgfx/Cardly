-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 028: Database-level validation constraints
--
-- These CHECK constraints are the final safety net. Even if API-level Zod
-- validation is bypassed (direct DB access, future bugs, SDK calls), these
-- constraints prevent logically invalid data from ever being stored.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── ticket_types ─────────────────────────────────────────────────────────────

-- Price must be zero or positive (no negative ticket prices)
ALTER TABLE ticket_types
  ADD CONSTRAINT IF NOT EXISTS chk_ticket_price_non_negative
    CHECK (price >= 0);

-- Quantity must be positive when set (NULL = unlimited)
ALTER TABLE ticket_types
  ADD CONSTRAINT IF NOT EXISTS chk_ticket_quantity_positive
    CHECK (quantity IS NULL OR quantity > 0);

-- Sales end must be after sales start when both are set
ALTER TABLE ticket_types
  ADD CONSTRAINT IF NOT EXISTS chk_ticket_sales_window
    CHECK (sales_end IS NULL OR sales_start IS NULL OR sales_end > sales_start);

-- min_per_order must be at least 1 when set
ALTER TABLE ticket_types
  ADD CONSTRAINT IF NOT EXISTS chk_ticket_min_order_positive
    CHECK (min_per_order IS NULL OR min_per_order >= 1);

-- max_per_order must be at least 1 when set
ALTER TABLE ticket_types
  ADD CONSTRAINT IF NOT EXISTS chk_ticket_max_order_positive
    CHECK (max_per_order IS NULL OR max_per_order >= 1);

-- min_per_order must not exceed max_per_order when both are set
ALTER TABLE ticket_types
  ADD CONSTRAINT IF NOT EXISTS chk_ticket_min_lte_max_order
    CHECK (min_per_order IS NULL OR max_per_order IS NULL OR min_per_order <= max_per_order);

-- quantity_sold must never be negative (guard against bad RPC calls)
ALTER TABLE ticket_types
  ADD CONSTRAINT IF NOT EXISTS chk_ticket_quantity_sold_non_negative
    CHECK (quantity_sold >= 0);

-- ── promo_codes ──────────────────────────────────────────────────────────────

-- Discount value must be positive
ALTER TABLE promo_codes
  ADD CONSTRAINT IF NOT EXISTS chk_promo_discount_positive
    CHECK (discount_value > 0);

-- Percent discount cannot exceed 100%
ALTER TABLE promo_codes
  ADD CONSTRAINT IF NOT EXISTS chk_promo_percent_max
    CHECK (discount_type != 'percent' OR discount_value <= 100);

-- Discount type must be one of the known values
ALTER TABLE promo_codes
  ADD CONSTRAINT IF NOT EXISTS chk_promo_discount_type
    CHECK (discount_type IN ('percent', 'fixed'));

-- max_uses must be at least 1 when set (0 would make the code useless immediately)
ALTER TABLE promo_codes
  ADD CONSTRAINT IF NOT EXISTS chk_promo_max_uses_positive
    CHECK (max_uses IS NULL OR max_uses >= 1);

-- times_used must never be negative
ALTER TABLE promo_codes
  ADD CONSTRAINT IF NOT EXISTS chk_promo_times_used_non_negative
    CHECK (times_used IS NULL OR times_used >= 0);

-- valid_until must be after valid_from when both are set
ALTER TABLE promo_codes
  ADD CONSTRAINT IF NOT EXISTS chk_promo_valid_window
    CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from);

-- ── event_pages ───────────────────────────────────────────────────────────────

-- Event end must be after event start when both are set
ALTER TABLE event_pages
  ADD CONSTRAINT IF NOT EXISTS chk_event_page_date_order
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at);

-- Registration deadline must be before event starts when both are set
ALTER TABLE event_pages
  ADD CONSTRAINT IF NOT EXISTS chk_event_page_deadline_before_start
    CHECK (registration_deadline IS NULL OR starts_at IS NULL OR registration_deadline < starts_at);

-- max_capacity must be at least 1 when set
ALTER TABLE event_pages
  ADD CONSTRAINT IF NOT EXISTS chk_event_page_capacity_positive
    CHECK (max_capacity IS NULL OR max_capacity >= 1);

-- ── events ────────────────────────────────────────────────────────────────────

-- Event name must not be empty
ALTER TABLE events
  ADD CONSTRAINT IF NOT EXISTS chk_event_name_not_empty
    CHECK (char_length(trim(name)) > 0);

-- Status must be one of the known values
ALTER TABLE events
  ADD CONSTRAINT IF NOT EXISTS chk_event_status
    CHECK (status IN ('draft', 'published', 'archived'));

-- ── registrations ─────────────────────────────────────────────────────────────

-- Attendee name must not be empty when set
ALTER TABLE registrations
  ADD CONSTRAINT IF NOT EXISTS chk_registration_name_not_empty
    CHECK (attendee_name IS NULL OR char_length(trim(attendee_name)) > 0);
