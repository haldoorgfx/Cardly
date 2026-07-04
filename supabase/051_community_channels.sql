-- Phase: Attendee Community (event channels + chat)
-- Idempotent — safe to run once. Creates the two tables the community
-- feature reads/writes on both web (/e/[slug]/community) and mobile
-- (community_chat_screen.dart).

-- ─── community_channels ───────────────────────────────────────────────────────
-- Organizer-created channels for an event (e.g. #announcements, #general).
create table if not exists community_channels (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  name        text not null,
  description text,
  is_pinned   boolean not null default false,
  position    int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists community_channels_event_idx
  on community_channels(event_id, position);

-- ─── community_messages ───────────────────────────────────────────────────────
-- Attendee (or organizer) messages posted into a channel. Author is an event
-- registration; the channel scopes it to an event.
create table if not exists community_messages (
  id              uuid primary key default gen_random_uuid(),
  channel_id      uuid not null references community_channels(id) on delete cascade,
  registration_id uuid references registrations(id) on delete set null,
  content         text not null,
  is_pinned       boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists community_messages_channel_idx
  on community_messages(channel_id, created_at);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
-- Matches the Phase 3 engagement model: attendees participate via
-- registration_id (no auth session), so reads are public and inserts are
-- allowed when the row references a valid registration. Organizers moderate
-- via the admin (service-role) client, which bypasses RLS.
alter table community_channels enable row level security;
alter table community_messages enable row level security;

-- Channels: anyone can read; writes go through the service-role admin client.
do $$ begin
  if not exists (select 1 from pg_policies where tablename='community_channels' and policyname='public_read') then
    create policy public_read on community_channels for select using (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='community_channels' and policyname='owner_write') then
    create policy owner_write on community_channels for all
      using (event_id in (select id from events where user_id = auth.uid()))
      with check (event_id in (select id from events where user_id = auth.uid()));
  end if;
end $$;

-- Messages: anyone can read. Inserts are allowed only when registration_id is a
-- real registration whose event owns the target channel (prevents cross-event
-- spoofing). Direct anon inserts from the mobile app satisfy this because the
-- app posts the attendee's own registration_id.
do $$ begin
  if not exists (select 1 from pg_policies where tablename='community_messages' and policyname='public_read') then
    create policy public_read on community_messages for select using (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='community_messages' and policyname='attendee_insert') then
    create policy attendee_insert on community_messages for insert
      with check (
        registration_id is not null
        and exists (
          select 1
          from registrations r
          join community_channels c on c.id = community_messages.channel_id
          where r.id = community_messages.registration_id
            and r.event_id = c.event_id
        )
      );
  end if;
end $$;

-- ─── Seed: give every existing event a #general channel ───────────────────────
-- So the Community tab has content the moment this runs. Idempotent — only
-- inserts for events that have no channel yet. (New events created later can be
-- given a channel from the organizer UI, or by re-running this insert.)
insert into community_channels (event_id, name, description, position)
select e.id, 'general', 'Event-wide chat for all attendees', 0
from events e
where not exists (
  select 1 from community_channels c where c.event_id = e.id
);
