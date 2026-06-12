-- Migration 011: Discovery columns for marketplace M2
-- Adds city, country, category, price_from to event_pages
-- Adds bio to profiles

ALTER TABLE event_pages
  ADD COLUMN IF NOT EXISTS city       text,
  ADD COLUMN IF NOT EXISTS country    text,
  ADD COLUMN IF NOT EXISTS category   text,
  ADD COLUMN IF NOT EXISTS price_from numeric(10,2);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio text;

CREATE INDEX IF NOT EXISTS event_pages_city_idx
  ON event_pages(city, starts_at) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS event_pages_category_idx
  ON event_pages(category, starts_at) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS event_pages_country_idx
  ON event_pages(country, starts_at) WHERE is_public = true;
