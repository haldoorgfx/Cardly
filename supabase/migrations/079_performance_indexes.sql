-- 079_performance_indexes.sql
-- Pass 4 (Performance): add indexes on hot foreign keys and filtered columns.
--
-- SAFE + IDEMPOTENT: every index is created only if its table AND all its
-- columns exist, and only if the index name doesn't already exist. Re-running
-- this migration is a no-op. Nothing is dropped or altered.
--
-- Scope: read paths that filter/sort by these columns are the busiest in the
-- app (registrations by event, entitlement redemptions, messaging, networking,
-- leaderboard, notifications). At larger event sizes these turn sequential
-- scans into index lookups.
--
-- NOTE: on a large live table CREATE INDEX briefly locks writes. At the current
-- data volume this is instant. If a table is very large when you apply this,
-- you can instead run each CREATE INDEX with CONCURRENTLY (outside a
-- transaction) — see the commented variant at the bottom.

DO $$
DECLARE
  r      record;
  col    text;
  ok     boolean;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      -- registrations (the hottest table)
      ('idx_registrations_event',            'registrations',          ARRAY['event_id']),
      ('idx_registrations_event_status',     'registrations',          ARRAY['event_id','status']),
      ('idx_registrations_ticket_type',      'registrations',          ARRAY['ticket_type_id']),
      ('idx_registrations_qr_token',         'registrations',          ARRAY['qr_code_token']),
      ('idx_registrations_stripe_pi',        'registrations',          ARRAY['stripe_payment_intent_id']),
      ('idx_registrations_email',            'registrations',          ARRAY['attendee_email']),
      ('idx_registrations_event_created',    'registrations',          ARRAY['event_id','created_at']),
      -- events
      ('idx_events_user',                    'events',                 ARRAY['user_id']),
      ('idx_events_status',                  'events',                 ARRAY['status']),
      ('idx_events_slug',                    'events',                 ARRAY['slug']),
      -- event_pages
      ('idx_event_pages_event',              'event_pages',            ARRAY['event_id']),
      ('idx_event_pages_starts_at',          'event_pages',            ARRAY['starts_at']),
      -- ticket_types
      ('idx_ticket_types_event',             'ticket_types',           ARRAY['event_id']),
      -- networking: connections
      ('idx_connections_event',              'attendee_connections',   ARRAY['event_id']),
      ('idx_connections_requester',          'attendee_connections',   ARRAY['requester_id']),
      ('idx_connections_recipient',          'attendee_connections',   ARRAY['recipient_id']),
      -- messaging
      ('idx_threads_event',                  'message_threads',        ARRAY['event_id']),
      ('idx_threads_participant_a',          'message_threads',        ARRAY['participant_a']),
      ('idx_threads_participant_b',          'message_threads',        ARRAY['participant_b']),
      ('idx_messages_thread',                'messages',               ARRAY['thread_id']),
      ('idx_messages_sender',                'messages',               ARRAY['sender_id']),
      -- gamification
      ('idx_leaderboard_event',              'leaderboard_points',     ARRAY['event_id']),
      ('idx_leaderboard_registration',       'leaderboard_points',     ARRAY['registration_id']),
      -- entitlements
      ('idx_entitlements_event',             'entitlements',           ARRAY['event_id']),
      ('idx_entitlements_ticket_type',       'entitlements',           ARRAY['ticket_type_id']),
      ('idx_ent_redemptions_registration',   'entitlement_redemptions',ARRAY['registration_id']),
      ('idx_ent_redemptions_entitlement',    'entitlement_redemptions',ARRAY['entitlement_id']),
      ('idx_ent_redemptions_event',          'entitlement_redemptions',ARRAY['event_id']),
      -- notifications
      ('idx_notifications_user',             'notifications',          ARRAY['user_id']),
      ('idx_notifications_user_created',     'notifications',          ARRAY['user_id','created_at']),
      -- sponsors / leads
      ('idx_sponsors_event',                 'sponsors',               ARRAY['event_id']),
      ('idx_sponsors_invite_token',          'sponsors',               ARRAY['invite_token']),
      ('idx_sponsor_leads_sponsor',          'sponsor_leads',          ARRAY['sponsor_id']),
      ('idx_sponsor_leads_event',            'sponsor_leads',          ARRAY['event_id']),
      -- programme
      ('idx_sessions_event',                 'sessions',               ARRAY['event_id']),
      ('idx_speakers_event',                 'speakers',               ARRAY['event_id']),
      -- discovery / follows
      ('idx_org_follows_follower',           'organizer_follows',      ARRAY['follower_id']),
      ('idx_org_follows_organizer',          'organizer_follows',      ARRAY['organizer_id']),
      -- orders (if present)
      ('idx_orders_event',                   'orders',                 ARRAY['event_id']),
      ('idx_orders_user',                    'orders',                 ARRAY['user_id']),
      -- downloads (if present)
      ('idx_downloads_user',                 'downloads',              ARRAY['user_id']),
      ('idx_downloads_event',                'downloads',              ARRAY['event_id']),
      -- saved events (if present)
      ('idx_saved_events_user',              'saved_events',           ARRAY['user_id']),
      -- cash shifts / transactions (if present)
      ('idx_cash_shifts_event',              'cash_shifts',            ARRAY['event_id']),
      -- event days (multi-day)
      ('idx_event_days_event',               'event_days',             ARRAY['event_id']),
      -- feedback / polls / q&a
      ('idx_feedback_event',                 'event_feedback',         ARRAY['event_id']),
      ('idx_polls_event',                    'polls',                  ARRAY['event_id']),
      ('idx_questions_event',                'live_questions',         ARRAY['event_id'])
    ) AS t(idxname, tbl, cols)
  LOOP
    -- skip if the table doesn't exist in this database
    IF to_regclass('public.' || r.tbl) IS NULL THEN
      CONTINUE;
    END IF;

    -- skip if any listed column is missing
    ok := true;
    FOREACH col IN ARRAY r.cols LOOP
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = r.tbl AND column_name = col
      ) THEN
        ok := false;
        EXIT;
      END IF;
    END LOOP;

    IF ok THEN
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I (%s)',
        r.idxname, r.tbl, array_to_string(r.cols, ', ')
      );
    END IF;
  END LOOP;
END $$;

-- Refresh planner statistics so the new indexes are used immediately.
ANALYZE;

-- ── CONCURRENT variant (only if a table is large when you apply this) ─────────
-- Run these individually, NOT inside a transaction, e.g.:
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_registrations_event
--     ON public.registrations (event_id);
-- CONCURRENTLY avoids locking writes but cannot run in the DO block above.
