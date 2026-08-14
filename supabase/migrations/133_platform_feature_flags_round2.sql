-- ============================================================================
-- 133_platform_feature_flags_round2.sql
--
-- WHAT THIS ADDS
--   Round 2 of the platform feature kill-switch (see 122 for the original
--   19 keys). Seeds "platform:*" rows for 4 more features that already work
--   on the live platform today but had ZERO platform-flag coverage:
--     • platform:card_studio — Eventera Card design & generation (the
--       canvas editor, /api/render + /api/v1/render, and the /c/[slug]
--       public claim flow). This is the platform's flagship feature, so it
--       gets its own emphasis in the admin UI grouping (see
--       lib/features/platformFeatureMeta.ts's "Core extras" group).
--     • platform:analytics   — organizer-facing analytics/reports/revenue/
--       source-analytics/downloads. Deliberately does NOT cover
--       app/api/admin/analytics/route.ts, which is platform-owner analytics,
--       not an organizer feature, and stays admin-only/always-on.
--     • platform:teams       — Studio team accounts (app/(app)/team,
--       app/api/teams/**). This sits ALONGSIDE the existing
--       plan === 'studio' check in app/api/teams/route.ts and
--       app/(app)/team/page.tsx, not instead of it — both gates must pass.
--     • platform:feedback    — post-event attendee feedback surveys
--       (app/api/events/[id]/feedback, app/(app)/attending/[slug]/feedback).
--   Catering-at-registration is NOT a new key here — it folds into the
--   existing platform:catering flag (see migration 134 for the RPC-level
--   fix that closes catering's separate bypass).
--
-- WHY ALL SEEDED enabled = true
--   Same rule as 122: these are all features that ALREADY WORK today. This
--   migration is a kill-switch to let Abdalla turn OFF what he decides is
--   unnecessary for a given launch, one at a time — it must never silently
--   turn anything off by being applied. lib/features/platform.ts also
--   defaults to "enabled" for any key with no row at all, so app code
--   shipping before this migration is pasted in stays working.
--
-- IDEMPOTENT: ON CONFLICT DO NOTHING. Safe to re-run. Does not touch or
-- renumber any existing migration, including 122's original 19 rows.
-- ============================================================================

insert into feature_flags (flag, label, description, enabled) values
  ('platform:card_studio', 'Card Studio',          'Eventera Card design & generation — canvas editor, public claim flow, and PNG rendering', true),
  ('platform:analytics',   'Analytics & reports',  'Event analytics, reports, revenue, roster, and source-analytics dashboards',              true),
  ('platform:teams',       'Studio team accounts', 'Multi-user team accounts with shared, role-based access to Studio-plan events',           true),
  ('platform:feedback',    'Event feedback',       'Post-event attendee feedback surveys and organizer ratings',                              true)
on conflict (flag) do nothing;
