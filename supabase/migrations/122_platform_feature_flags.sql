-- ============================================================================
-- 122_platform_feature_flags.sql
--
-- WHAT THIS ADDS
--   Seeds "platform:*" rows in the existing feature_flags table (009) as a
--   super-admin-only kill-switch for whole platform features (Q&A, Polls,
--   Sponsors, etc.) — separate from:
--     • the 5 existing dev-experiment flags in that same table (ai_captions,
--       bulk_export, ...), which stay admin-manageable as before
--     • event_pages.features (038), the PER-EVENT organizer toggle for a
--       subset of these same areas
--   A feature can only actually be used when BOTH gates allow it: the
--   platform flag here must be true, AND (for the areas that also have a
--   per-event toggle) the organizer's own event_pages.features must allow it.
--
-- WHY "platform:" PREFIX, NOT A NEW TABLE
--   feature_flags.flag has no format constraint (plain text primary key), so
--   reusing the existing table + isEnabled()-style storage avoids a parallel
--   flags system for what is structurally the same primitive (a named
--   boolean). app/api/admin/flags/route.ts is left untouched for the 5
--   existing flags; a new app/api/admin/platform-features/route.ts (super
--   admin only) manages "platform:*" rows specifically.
--
-- WHY ALL SEEDED enabled = true
--   These are all features that ALREADY WORK on the live platform today.
--   This migration is a kill-switch to let Abdalla turn OFF what he decides
--   is unnecessary, one at a time — it must never silently turn anything off
--   by being applied. lib/features/platform.ts also defaults to "enabled"
--   for any key that has no row at all (covers app code shipping before
--   this migration is pasted in, and any future key added to the list
--   before its row exists).
--
-- IDEMPOTENT: ON CONFLICT DO NOTHING. Safe to re-run.
-- ============================================================================

insert into feature_flags (flag, label, description, enabled) values
  ('platform:qa',             'Q&A',                 'Live audience questions on the event page + organizer moderation', true),
  ('platform:polls',          'Polls',                'Live polls on the event page + organizer results view',           true),
  ('platform:networking',     'Attendee networking',  'Attendee-to-attendee messaging and connection requests',          true),
  ('platform:speed_networking','Speed networking',    'Timed 1:1 attendee matchmaking sessions',                         true),
  ('platform:community',      'Community',            'Event-wide attendee post feed / discussion wall',                 true),
  ('platform:photos',         'Photo wall',            'Attendee photo uploads + moderated public wall',                  true),
  ('platform:gamification',   'Gamification',          'Leaderboard and point-scoring for Q&A/polls/networking',          true),
  ('platform:speakers',       'Speakers & CFP',        'Call-for-papers submissions + public speaker profiles',           true),
  ('platform:sponsors',       'Sponsors',              'Sponsor listings on the public event page',                       true),
  ('platform:exhibitors',     'Exhibitors',            'Exhibitor booth portal, products, and lead capture',              true),
  ('platform:catering',       'Catering & dietary',    'Attendee dietary/accessibility capture + catering counts',        true),
  ('platform:entitlements',   'Entitlements',          'Add-on entitlements (meals, swag, sessions) per registration',    true),
  ('platform:multi_day',      'Multi-day events',      'Multiple event days/sessions under one event',                   true),
  ('platform:communications', 'Communications',        'Organizer broadcast email/WhatsApp to attendees',                true),
  ('platform:waitlist',       'Waitlist',               'Attendee waitlist + organizer invite-to-register',               true),
  ('platform:promote',        'Promote & promoter links', 'Promo codes, promoter links, and promoted listings',          true),
  ('platform:ai_copilot',     'AI Copilot',            'Claude-powered organizer chat assistant',                        true),
  ('platform:developer_api',  'Developer API',         'API keys, webhooks, and the public v1 API',                      true),
  ('platform:white_label',    'White-label branding',  'Custom domain + branding removal for Studio organizers',         true)
on conflict (flag) do nothing;
