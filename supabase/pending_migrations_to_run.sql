-- ============================================================================
-- PENDING MIGRATIONS — paste this whole file into the Supabase SQL editor and Run.
-- Safe to run as one batch; each block is idempotent (guarded / drop-if-exists).
-- Order matters: 041 → 042 → 043.
--
-- 043 is REQUIRED — until it runs, the app references eventera_card_url /
-- eventera_card_zone_data columns that don't exist yet and will 500 at runtime.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 041_form_field_types
-- Expand registration_form_fields.field_type to support date, number, section.
-- ----------------------------------------------------------------------------
alter table registration_form_fields
  drop constraint if exists registration_form_fields_field_type_check;

alter table registration_form_fields
  add constraint registration_form_fields_field_type_check
  check (field_type in (
    'text', 'textarea', 'select', 'checkbox', 'radio', 'phone', 'url',
    'date', 'number', 'section'
  ));


-- ----------------------------------------------------------------------------
-- 042_registrations_status_check
-- Add the statuses the app uses (refunded, waitlisted, pending_approval) so
-- refunds and status changes stop failing with a check-constraint 500.
-- ----------------------------------------------------------------------------
alter table registrations
  drop constraint if exists registrations_status_check;

alter table registrations
  add constraint registrations_status_check
  check (status in (
    'pending', 'confirmed', 'checked_in', 'cancelled', 'refunded',
    'waitlisted', 'pending_approval'
  ));


-- ----------------------------------------------------------------------------
-- 043_rename_karta_to_eventera  (REQUIRED — app breaks without this)
-- Rename the two card columns on registrations and update the brand-name
-- default/seed on site_settings. Guarded by column-existence checks.
-- ----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'registrations' and column_name = 'karta_card_url'
  ) then
    alter table registrations rename column karta_card_url to eventera_card_url;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_name = 'registrations' and column_name = 'karta_card_zone_data'
  ) then
    alter table registrations rename column karta_card_zone_data to eventera_card_zone_data;
  end if;
end $$;

alter table site_settings alter column brand_name set default 'Eventera';
update site_settings set brand_name = 'Eventera' where brand_name = 'Karta';
