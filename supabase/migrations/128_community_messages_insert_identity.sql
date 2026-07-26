-- ============================================================================
-- 128_community_messages_insert_identity.sql
--
-- WHAT WAS WRONG
--   community_messages' `attendee_insert` policy (migration 051) only checks
--   that the supplied registration_id belongs to SOME registration for the
--   event the target channel belongs to:
--
--     with check (
--       registration_id is not null
--       and exists (select 1 from registrations r join community_channels c
--                   on c.id = community_messages.channel_id
--                   where r.id = community_messages.registration_id
--                     and r.event_id = c.event_id)
--     )
--
--   It never compares the CALLER's identity (auth.uid()) to that
--   registration's owner. registration_id is a plain, enumerable id -- not a
--   secret (the same fact that drove qr_code_token becoming the load-bearing
--   credential everywhere else in the engagement suite, see
--   lib/attendee-identity.ts and migrations 116/119). Net effect: ANY
--   signed-in attendee could insert a community_messages row with a
--   registration_id belonging to a DIFFERENT attendee, making the chat show
--   a message as having come from someone who never sent it -- impersonation
--   in a feature attendees see projected/shared at the event.
--
--   Migration 078's engagement RLS lockdown pass reviewed this exact table
--   for its SELECT policy (tightened to `is_event_participant()`, requiring
--   auth.uid()) but explicitly left `attendee_insert` "untouched" -- this
--   appears to have been an oversight, not a deliberate call, given 078's own
--   stated reasoning for every other table it touched.
--
--   Since 078 already requires auth.uid() to even SELECT a channel or its
--   messages, there is no supported anonymous/guest posting flow here to
--   preserve -- unlike the qr_code_token-gated routes, this table's own read
--   side already assumes a signed-in caller. So requiring auth.uid() on
--   INSERT too is not a new restriction on top of what SELECT already
--   requires, just closing the same door on the write side.
--
-- FIX
--   Add an auth.uid() match to the existing check: the registration being
--   posted as must belong to the caller, by the same two-clause identity
--   test is_event_participant() already uses (user_id match, or email match
--   for a registration made before the account existed) -- kept inline
--   rather than reusing is_event_participant() itself, since that function
--   answers "is the caller SOME participant of this event", not "does the
--   caller own THIS SPECIFIC registration_id".
--
-- IDEMPOTENT: drop + create. Safe to re-run.
-- HOW TO APPLY: paste into the Supabase SQL editor and Run.
-- ============================================================================

drop policy if exists attendee_insert on public.community_messages;

create policy attendee_insert on public.community_messages
for insert
with check (
  registration_id is not null
  and exists (
    select 1
    from public.registrations r
    join public.community_channels c on c.id = community_messages.channel_id
    where r.id = community_messages.registration_id
      and r.event_id = c.event_id
      and (
        (r.user_id is not null and r.user_id = auth.uid())
        or lower(r.attendee_email) = lower(coalesce(
             (select email from public.profiles where id = auth.uid()), '__no_match__'))
      )
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Sanity check — run after applying, as any signed-in attendee:
--
--   Attempting to insert with a registration_id that is NOT yours must fail:
--     insert into community_messages (channel_id, registration_id, content)
--     values ('<a-real-channel-id>', '<someone-elses-registration-id>', 'test');
--   -> should raise "new row violates row-level security policy"
--
--   Inserting with your OWN registration_id must still succeed as before.
-- ─────────────────────────────────────────────────────────────────────────────
