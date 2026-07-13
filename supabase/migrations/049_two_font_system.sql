-- Migration 049: lock the two-font system on the default brand settings.
--
-- The site_settings row (id = 1) drives the runtime CSS font variables
-- (--theme-font-display / --theme-font-body). Its values had drifted and were
-- effectively swapped (body = 'DM Sans', display = 'Inter'), which is why body
-- text rendered in DM Sans and .font-display elements rendered in Inter across
-- the platform. This resets them to Eventera's locked two-font system:
--   Display -> Plus Jakarta Sans   (headings, wordmark, big numbers)
--   Body    -> Inter               (all body / UI text)
--   Mono    -> Inter               (no monospace; mono retired)
--
-- Safe to re-run.

update site_settings
set fonts = jsonb_build_object(
      'display', 'Plus Jakarta Sans',
      'body',    'Inter',
      'mono',    'Inter'
    ),
    updated_at = now()
where id = 1;

-- Keep the column default in sync for any future fresh install.
alter table site_settings
  alter column fonts set default jsonb_build_object(
    'display', 'Plus Jakarta Sans',
    'body',    'Inter',
    'mono',    'Inter'
  );
