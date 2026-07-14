-- 093_sponsor_rls_lockdown.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- CRITICAL PRODUCTION SECURITY FIX. Paste the WHOLE file into the Supabase SQL
-- editor and run once. Safe + idempotent (re-runnable).
--
-- WHAT WAS WRONG: migration 027_exhibitor_tables.sql created `sponsor_members`
-- and `sponsor_resources` with a wide-open policy:
--     create policy public_all ... for all using (true) with check (true);
-- That grants role PUBLIC — which INCLUDES the browser-exposed anon key — full
-- read AND write on both tables. So anyone holding the public anon key could
-- read every sponsor team member's invited email / name / role and every
-- resource file URL across every event on the platform, and could insert or
-- delete rows, with zero authentication.
--
-- The 2026-07-09 engagement-tables lockdown (078_engagement_rls_lockdown.sql)
-- re-scoped the networking / QA / community tables but SKIPPED these two
-- sponsor/exhibitor tables — they were created in a different migration (027)
-- and slipped through that pass. This migration closes that gap using the same
-- conventions as 078.
--
-- THE FIX: drop the `public_all` policy on both tables and replace it with an
-- organizer-scoped policy. Access is resolved sponsor_id → sponsors.event_id →
-- events.user_id = auth.uid(). 078's helpers (my_registration_ids(),
-- is_event_participant()) don't traverse sponsor → event, so — exactly like
-- 078's own poll_votes / attendee_agendas / session_ratings sections — we use
-- an inline EXISTS(... JOIN events ...) subquery. Only the event ORGANIZER can
-- SELECT / INSERT / UPDATE / DELETE. No anon access at all. anon is REVOKE'd
-- from both tables for defense in depth.
--
-- WHY THIS IS SAFE FOR THE EXHIBITOR TOKEN PORTAL: every read and write of
-- these two tables in the token-gated exhibitor portal goes through
-- createAdminClient() (the Supabase SERVICE-ROLE client), which BYPASSES RLS
-- entirely. Verified in:
--   • app/api/exhibitor/team/route.ts      (POST/PATCH/DELETE on sponsor_members)
--   • app/api/exhibitor/resources/route.ts (POST/DELETE on sponsor_resources)
--   • app/exhibitor/[token]/team/page.tsx        (reads sponsor_members)
--   • app/exhibitor/[token]/resources/page.tsx   (reads sponsor_resources)
--   • app/exhibitor/[token]/page.tsx             (sponsor_resources count)
-- The token portal authorizes each request itself (invite_token → sponsors row)
-- and never uses the anon/authenticated client for these tables, so tightening
-- RLS to organizer-only does NOT break it.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── sponsor_members ──────────────────────────────────────────────────────────
do $$ begin
  if to_regclass('public.sponsor_members') is not null then
    alter table public.sponsor_members enable row level security;

    -- Drop the wide-open PUBLIC policy from 027.
    drop policy if exists public_all on public.sponsor_members;
    drop policy if exists "sponsor_members: organizer all" on public.sponsor_members;

    -- Only the event organizer (owner of the sponsor's event) has any access.
    create policy "sponsor_members: organizer all" on public.sponsor_members
      for all using (
        exists (
          select 1 from public.sponsors s
          join public.events e on e.id = s.event_id
          where s.id = sponsor_members.sponsor_id
            and e.user_id = auth.uid()
        )
      ) with check (
        exists (
          select 1 from public.sponsors s
          join public.events e on e.id = s.event_id
          where s.id = sponsor_members.sponsor_id
            and e.user_id = auth.uid()
        )
      );
  end if;
end $$;


-- ── sponsor_resources ────────────────────────────────────────────────────────
do $$ begin
  if to_regclass('public.sponsor_resources') is not null then
    alter table public.sponsor_resources enable row level security;

    -- Drop the wide-open PUBLIC policy from 027.
    drop policy if exists public_all on public.sponsor_resources;
    drop policy if exists "sponsor_resources: organizer all" on public.sponsor_resources;

    -- Only the event organizer (owner of the sponsor's event) has any access.
    create policy "sponsor_resources: organizer all" on public.sponsor_resources
      for all using (
        exists (
          select 1 from public.sponsors s
          join public.events e on e.id = s.event_id
          where s.id = sponsor_resources.sponsor_id
            and e.user_id = auth.uid()
        )
      ) with check (
        exists (
          select 1 from public.sponsors s
          join public.events e on e.id = s.event_id
          where s.id = sponsor_resources.sponsor_id
            and e.user_id = auth.uid()
        )
      );
  end if;
end $$;


-- ── Defense in depth: strip anon's table grants entirely ─────────────────────
-- RLS already blocks anon (no policy matches an unauthenticated caller), but
-- revoking the grants removes the privilege at the SQL layer too. The service-
-- role client used by the exhibitor portal is unaffected (it bypasses both).
do $$ begin
  if to_regclass('public.sponsor_members') is not null then
    revoke all on public.sponsor_members from anon;
  end if;
  if to_regclass('public.sponsor_resources') is not null then
    revoke all on public.sponsor_resources from anon;
  end if;
end $$;


-- ── Sanity: after running, re-run these as an ANONYMOUS caller (no
--    Authorization header, just the public anon apikey). All must return [] :
--   /rest/v1/sponsor_members?select=*    → []
--   /rest/v1/sponsor_resources?select=*  → []
-- And the exhibitor token portal (service-role) must still list/add/delete
-- team members and resources exactly as before.
