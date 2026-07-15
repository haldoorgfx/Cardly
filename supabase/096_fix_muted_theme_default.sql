-- 096_fix_muted_theme_default.sql
-- The WCAG-AA contrast fix (muted #6B7A72 → #65736B) shipped in code, but
-- site_settings.colors was seeded once (migration 005) and site_settings.colors
-- overrides the code default at runtime (see lib/theme/settings.ts). Update the
-- live row so the darker, compliant muted color actually renders.
-- IDEMPOTENT: safe to run multiple times.

update site_settings
set colors = jsonb_set(colors, '{muted}', '"#65736B"'),
    updated_at = now()
where id = 1
  and colors->>'muted' = '#6B7A72';
