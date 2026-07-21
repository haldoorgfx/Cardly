-- 117_exhibitor_products_published_only.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Paste the WHOLE file into the Supabase SQL editor and run once.
-- Safe + idempotent (re-runnable).
--
-- WHAT IS WRONG TODAY
-- Migration 060 created the exhibitor product showcase with a deliberately
-- public read policy, so the products could be listed on the public booth
-- directory:
--
--     create policy exhibitor_products_read on exhibitor_products
--       for select using (true);
--
-- The intent (a public directory) is right, but `using (true)` is wider than
-- the intent. It does not look at the event at all, so it also publishes the
-- products of events that are still `draft` or have been `archived`. Verified
-- against production on 2026-07-21 with nothing but the browser-exposed anon
-- key and no Authorization header:
--
--     GET /rest/v1/exhibitor_products?select=*   →  200, full rows
--
-- Every other public surface in this schema is gated on publication — see
-- 001_initial_schema.sql, where the events policy is
-- `for select using (status = 'published')`. This table simply never got the
-- same treatment.
--
-- THE CONSEQUENCE
-- An exhibitor filling in their booth before launch expects that work to be
-- private until the organizer publishes. Instead the product names, blurbs and
-- image URLs of an unannounced event are world-readable in advance — an
-- unreleased line-up, sponsor roster or product reveal leaks ahead of the
-- announcement, to anyone who reads the anon key out of the page source.
--
-- THE FIX
-- Keep the read public — the directory genuinely is public — but scope it to
-- events that are actually published, matching the events table's own rule.
-- Writes are untouched: they were already correctly restricted to the sponsor's
-- own team / the event organizer, and a write probe from the anon key returned
-- 42501 (RLS violation) as it should.
--
-- WHY THIS DOES NOT BREAK THE EXHIBITOR PORTAL
-- The token-gated portal (app/exhibitor/[token]/products) and its API route
-- (app/api/exhibitor/products) both go through createAdminClient() — the
-- SERVICE-ROLE client, which bypasses RLS entirely. So an exhibitor still sees
-- and edits their own products on a draft event exactly as before. Only the
-- anonymous public read narrows.
-- ─────────────────────────────────────────────────────────────────────────────

do $$ begin
  if to_regclass('public.exhibitor_products') is not null then
    alter table public.exhibitor_products enable row level security;

    -- Replace 060's unconditional public read.
    drop policy if exists exhibitor_products_read on public.exhibitor_products;
    drop policy if exists exhibitor_products_read_published on public.exhibitor_products;

    create policy exhibitor_products_read_published on public.exhibitor_products
      for select using (
        exists (
          select 1 from public.events e
          where e.id = exhibitor_products.event_id
            and e.status = 'published'
        )
      );
  end if;
end $$;


-- ── Sanity check ─────────────────────────────────────────────────────────────
-- Re-run as an ANONYMOUS caller (public anon apikey, no Authorization header):
--
--   /rest/v1/exhibitor_products?select=id,event_id
--
-- Every event_id returned must belong to a published event. Products attached
-- to a draft or archived event must no longer appear. The exhibitor token
-- portal must still list and edit those same products unchanged, because it
-- reads them with the service-role client.
