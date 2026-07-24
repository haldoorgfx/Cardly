-- ============================================================================
-- 123_remove_dead_feature_flags.sql
--
-- WHAT THIS REMOVES
--   Deletes the 5 flags seeded by migration 009 (ai_captions, bulk_export,
--   analytics_v2, qr_customization, new_canvas_editor). A repo-wide grep
--   confirmed none of the five is checked anywhere in the codebase — no
--   isEnabled('ai_captions') or equivalent call exists for any of them.
--   Toggling any of them in /admin/flags has never had any real effect.
--
-- WHAT THIS KEEPS
--   The feature_flags / feature_flag_overrides tables, the /admin/flags
--   admin page, and the per-user override mechanism all stay — this is a
--   real, working system, just with dead seed data. The next real
--   dev-experiment flag should be added the same way 009 added these.
--
-- Any per-user overrides that happened to target these 5 flags cascade-
-- delete automatically (feature_flag_overrides.flag references
-- feature_flags(flag) on delete cascade, migration 009).
--
-- IDEMPOTENT: safe to re-run.
-- ============================================================================

delete from feature_flags
 where flag in ('ai_captions', 'bulk_export', 'analytics_v2', 'qr_customization', 'new_canvas_editor');
