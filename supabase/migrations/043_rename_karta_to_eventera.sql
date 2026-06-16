-- 043: Rename Karta → Eventera
-- Part of the platform-wide rebrand. Renames the two card columns on
-- `registrations` and updates the brand-name default/seed on `site_settings`.
-- Safe to re-run (guarded by column-existence checks). RENAME COLUMN
-- automatically updates any dependent indexes/constraints/policies.

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

-- Brand name: new default + migrate the existing seeded row
alter table site_settings alter column brand_name set default 'Eventera';
update site_settings set brand_name = 'Eventera' where brand_name = 'Karta';
