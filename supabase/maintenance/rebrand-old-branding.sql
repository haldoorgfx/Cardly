-- ============================================================================
-- MAINTENANCE (not a migration — safe to run repeatedly, read-only by default)
-- Purpose: find + optionally clean up stale "Cardly"/"Karta" branding that was
--          baked into frozen card assets before the Eventera rebrand.
--
-- Context: built-in templates rasterise buildSVG() to a PNG at event-creation
-- time and store it in the `event-backgrounds` bucket; event_variants.background_url
-- points at that frozen PNG. Pre-rebrand events therefore still show the old
-- baked watermark ("MADE WITH CARDLY", "CARDLY · TEMPLATE").
--
-- The pixel fix is done by the app endpoint POST /api/admin/rebrand-backgrounds
-- (it re-rasterises the CURRENT buildSVG and repoints background_url). This file
-- is only for INSPECTION + the optional generated_cards cleanup, which SQL can do.
--
-- Built-in template PNGs live at:
--   .../event-backgrounds/<user_id>/[<event_id>-]template-<key>-<timestamp>.png
-- Custom organizer uploads live at:
--   .../event-backgrounds/<user_id>/<timestamp>.png      (NO "template-" segment)
-- => the pattern '%template-%' matches ONLY platform template art, never custom art.
-- ============================================================================


-- ── 1. Affected variants (built-in template backgrounds) ────────────────────
-- These are what the rebrand-backgrounds endpoint will re-rasterise.
-- Custom uploads are excluded by requiring the 'template-' segment.
select
  v.id            as variant_id,
  v.event_id,
  e.name          as event_name,
  e.slug          as event_slug,
  e.status,
  v.background_url
from event_variants v
join events e on e.id = v.event_id
where v.background_url like '%/event-backgrounds/%template-%.png'
order by e.created_at;


-- ── 1b. The two events to verify after the fix (Sunrise / Faith) ────────────
select v.id as variant_id, e.name, e.slug, v.background_url
from event_variants v
join events e on e.id = v.event_id
where (e.name ilike '%sunrise hackathon%' or e.name ilike '%faith conference%')
  and v.background_url like '%/event-backgrounds/%template-%.png'
order by e.name;


-- ── 2. DB-managed templates that may carry old baked branding ───────────────
-- These feed NEW events (app/api/apply-template-bg copies background_url as-is),
-- so any with pre-rebrand art must be re-exported and re-uploaded via the admin
-- Templates UI. SQL can't read pixels, so review these by eye in the dashboard.
-- (Nothing is auto-changed here.)
select id, name, category, min_plan, published, featured,
       background_url, thumbnail_url, created_at, updated_at
from templates
order by created_at;


-- ── 3. Already-generated attendee cards (generated_cards) ───────────────────
-- The final composited PNGs in the `generated-cards` bucket cannot be faithfully
-- re-rendered server-side: attendee photos are never persisted (they pass through
-- /api/render transiently). So a bulk re-render is not possible. Options:
--
--   (a) Do nothing — every FUTURE card render uses the now-fixed background, so
--       new downloads are correct. This is the recommended default.
--   (b) If you want old cards to regenerate on the attendee's next visit, null the
--       stored URL so the card page re-renders (only helps flows that re-render when
--       output_url is empty; will not restore a card whose photo is gone).
--
-- First INSPECT the candidates (created before the rebrand cutoff — set the date):
select gc.id, gc.event_id, e.name as event_name, gc.attendee_name,
       gc.output_url, gc.created_at
from generated_cards gc
join events e on e.id = gc.event_id
where gc.created_at < timestamptz '2026-06-01'   -- ⚠ set to your actual rebrand cutoff
order by gc.created_at desc;

-- Optional cleanup (uncomment to run) — clears stale stored PNG links so they
-- re-render on next download. Also clears the mirrored URL on registrations.
-- BEGIN;
--   update registrations r
--     set eventera_card_url = null
--   from generated_cards gc
--   where gc.output_url = r.eventera_card_url
--     and gc.created_at < timestamptz '2026-06-01';
--
--   update generated_cards
--     set output_url = null
--   where created_at < timestamptz '2026-06-01';
-- COMMIT;
