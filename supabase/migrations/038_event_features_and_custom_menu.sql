-- ============================================================
-- 038: Per-event feature toggles + custom menu
-- Adds two jsonb columns to event_pages. Idempotent.
--
-- features:    which attendee-app sections are enabled, e.g.
--              { "schedule": true, "speakers": true, "networking": false,
--                "qa": true, "polls": true, "newsfeed": true, "sponsors": true,
--                "gamification": false }
--              Absent keys are treated as enabled (opt-out model).
--
-- custom_menu: ordered list of organizer-defined links/pages shown in the
--              attendee app, e.g.
--              [ { "id": "m1", "label": "Code of Conduct", "type": "link",
--                  "url": "https://…" },
--                { "id": "m2", "label": "Venue Map", "type": "page",
--                  "content": "markdown…" } ]
-- ============================================================

alter table event_pages
  add column if not exists features    jsonb not null default '{}'::jsonb,
  add column if not exists custom_menu jsonb not null default '[]'::jsonb;
