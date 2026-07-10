-- Add logo_light_url to site_settings for white/light logo used on dark backgrounds
alter table site_settings
  add column if not exists logo_light_url text;

comment on column site_settings.logo_light_url is
  'White or light-coloured logo variant — used on dark backgrounds (sidebar, admin panel)';
