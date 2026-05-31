-- Indexes on the hot query paths identified in the production-readiness audit.
-- All use IF NOT EXISTS so the migration is safe to re-run.

-- events.user_id — dashboard list, analytics, all owner lookups
create index if not exists events_user_id_idx
  on events(user_id);

-- events.slug — attendee page lookup (highest public traffic, must be fast)
-- slug already has a UNIQUE constraint which gives an implicit index on most DBs,
-- but Supabase/Postgres creates it as a unique-constraint index, not a plain btree.
-- This is a no-op if the unique index already covers the column.
create index if not exists events_slug_idx
  on events(slug);

-- events.status — filtered on every attendee page load and dashboard tab
create index if not exists events_status_idx
  on events(status);

-- Composite: (user_id, status) covers the common dashboard + analytics pattern
create index if not exists events_user_id_status_idx
  on events(user_id, status);

-- event_variants.event_id — loading variants for canvas editor and attendee page
create index if not exists event_variants_event_id_idx
  on event_variants(event_id);

-- generated_cards.event_id — analytics, card count, idempotency checks
create index if not exists generated_cards_event_id_idx
  on generated_cards(event_id);

-- generated_cards.created_at — analytics ordering (latest cards first)
create index if not exists generated_cards_created_at_idx
  on generated_cards(created_at desc);
