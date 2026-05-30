-- Migration 011: add logo_light_url to site_settings
-- White/light logo variant for dark backgrounds (sidebar, admin panel)
-- Colored logo stays in logo_url (for marketing nav on light backgrounds)

alter table site_settings
  add column if not exists logo_light_url text;
