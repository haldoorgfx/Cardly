-- 130_perf_indexes_and_leaderboard_aggregate.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Free-tier compute audit (2026-08-03): Abdalla is on Supabase's free plan —
-- request COUNT isn't limited, but the shared compute instance is. A slow,
-- unindexed query burns CPU for every project on that instance, not just a
-- rate-limit rejection for one user. This migration is the DB-side half of
-- that audit (see app code changes in the same commit for the query-shape
-- half). Safe + idempotent — paste the WHOLE file into the Supabase SQL
-- editor and run once.
--
-- WHAT WAS FOUND:
--
--  1. registrations.payment_status has NO index anywhere (only `status` is
--     indexed, and only combined with event_id). app/admin/billing/page.tsx
--     runs `.eq('payment_status', 'paid')` with NO event_id filter — a
--     platform-wide scan of every paid registration on the whole product —
--     and payment_status is read in 20 files total, so this gap only gets
--     more expensive as more organizers sign up.
--
--  2. registrations(event_id) is indexed, but NOT (event_id, created_at).
--     The Attendees list (app/(app)/events/[id]/registrations/page.tsx) does
--     `.eq('event_id', id).order('created_at', desc).range(0, 49)` — without
--     created_at in the index, Postgres has to pull every registration for
--     the event and sort them in memory before it can hand back 50 rows. A
--     composite index lets it walk the index in order and stop at 50,
--     regardless of how large the event's attendee list grows.
--
--  3. poll_votes' only index is its primary key (poll_id, registration_id).
--     "What did I vote?" (app/(public)/e/[slug]/polls/page.tsx and the
--     organizer-side attending/[slug]/polls/page.tsx) queries by
--     registration_id ALONE, which is the second column of that composite
--     key — not usable for an efficient lookup. Every poll page view scans
--     the whole poll_votes table for the event.
--
--  4. leaderboard_points had no correctness problem, but two call sites
--     (app/api/events/[id]/leaderboard/route.ts and the organizer
--     gamification page) each pull EVERY points row for the event and sum
--     them in JavaScript, on every page view. leaderboard_points gets a row
--     per Q&A vote / poll vote / connection made / session attended, so an
--     actively-engaged event's row count — and the bytes shipped back on
--     every leaderboard view — grows continuously for the life of the event.
--     Fixed by aggregating with SUM/GROUP BY in Postgres instead; the
--     function below replaces both call sites.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. registrations.payment_status — platform-wide admin billing scan ────────
create index if not exists registrations_payment_status_idx
  on registrations(payment_status);

-- ── 2. registrations(event_id, created_at) — paginated attendee list order ────
create index if not exists registrations_event_created_idx
  on registrations(event_id, created_at desc);

-- ── 3. poll_votes.registration_id — "my votes" lookup ──────────────────────────
create index if not exists poll_votes_registration_idx
  on poll_votes(registration_id);

-- ── 4. Aggregate leaderboard totals in SQL instead of in the API layer ────────
-- Same SUM/GROUP BY, done once by Postgres (index-scoped by the existing
-- leaderboard_event_idx) instead of shipping every points row over the wire
-- and summing it in Node on every request. Returns one row per registration
-- (not one row per point-earning action), pre-sorted highest-first — the API
-- layer still slices top-50 / finds "your rank" in memory, but over a set
-- that's already grouped instead of raw event rows.
create or replace function public.leaderboard_totals(p_event_id uuid)
returns table(registration_id uuid, total_points bigint)
language sql
stable
as $$
  select lp.registration_id, sum(lp.points)::bigint as total_points
  from leaderboard_points lp
  where lp.event_id = p_event_id
  group by lp.registration_id
  order by total_points desc;
$$;
grant execute on function public.leaderboard_totals(uuid) to authenticated, anon;
