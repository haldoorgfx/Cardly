-- ============================================================================
-- 050_attendee_security_rls.sql
--
-- SECURITY HARDENING for the attendee engagement tables.
--
-- SAFE & IDEMPOTENT: every statement is guarded with `drop policy if exists`
-- and a `to_regclass()` table-exists check, so this migration can be run
-- multiple times and against databases where some tables don't exist yet.
-- Paste into the Supabase SQL Editor and Run.
--
-- WHAT THIS DOES ─────────────────────────────────────────────────────────────
-- The engagement tables below are WRITTEN exclusively through our /api/* routes
-- using the service-role admin client (which bypasses RLS). Direct anon /
-- authenticated writes should therefore NOT be allowed. Previously each table
-- had a wide-open `public_all` policy (`for all using (true) with check (true)`)
-- that let anyone with the anon key insert/update/delete arbitrary rows.
--
-- For each such table we:
--   1. DROP the `public_all` policy.
--   2. Add a permissive SELECT-only policy (`for select using (true)`) so the
--      app's direct client reads (mobile + web) keep working.
--   -> With RLS enabled and NO insert/update/delete policy, writes from
--      anon/authenticated are denied; only the service-role API can write.
--
-- For the per-user tables the app writes DIRECTLY (saved_events,
-- organizer_follows) we (re)assert OWN-ROW policies so a user can only touch
-- their own rows.
-- ============================================================================

-- ── Engagement tables: SELECT-only for clients, writes via service role only ──
do $$
declare
  t text;
  read_only_tables text[] := array[
    'attendee_connections',
    'message_threads',
    'messages',
    'qa_questions',
    'qa_upvotes',
    'poll_votes',
    'poll_options',
    'leaderboard_points',
    'attendee_agendas',
    'session_ratings',
    'event_feedback'
  ];
begin
  foreach t in array read_only_tables loop
    if to_regclass(format('public.%I', t)) is not null then
      -- Ensure RLS is on (writes are denied unless a policy allows them).
      execute format('alter table public.%I enable row level security', t);

      -- Remove the old wide-open policy.
      execute format('drop policy if exists public_all on public.%I', t);

      -- Re-create a clean, permissive READ policy so direct reads keep working.
      execute format('drop policy if exists public_select on public.%I', t);
      execute format('create policy public_select on public.%I for select using (true)', t);
    end if;
  end loop;
end $$;

-- ── saved_events: OWN-ROW only (app writes directly as the logged-in user) ────
do $$ begin
  if to_regclass('public.saved_events') is not null then
    alter table public.saved_events enable row level security;
    -- Drop any wide-open policy and re-assert own-row access keyed on user_id.
    drop policy if exists public_all on public.saved_events;
    drop policy if exists "saved_events: own rows" on public.saved_events;
    create policy "saved_events: own rows" on public.saved_events
      for all using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- ── organizer_follows: OWN-ROW (follower) + organizer read of their followers ─
do $$ begin
  if to_regclass('public.organizer_follows') is not null then
    alter table public.organizer_follows enable row level security;
    drop policy if exists public_all on public.organizer_follows;

    drop policy if exists "organizer_follows: follower own" on public.organizer_follows;
    create policy "organizer_follows: follower own" on public.organizer_follows
      for all using (auth.uid() = follower_id)
      with check (auth.uid() = follower_id);

    -- Organizers may still read the follower rows that point at them (for counts).
    drop policy if exists "organizer_follows: organizer read count" on public.organizer_follows;
    create policy "organizer_follows: organizer read count" on public.organizer_follows
      for select using (auth.uid() = organizer_id);
  end if;
end $$;
