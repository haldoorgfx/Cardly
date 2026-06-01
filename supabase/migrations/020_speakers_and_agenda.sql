-- Phase 2: Speakers, Sessions, Tracks, Personal Agenda, Feedback
-- Idempotent — all CREATE TABLE IF NOT EXISTS

-- ─── tracks ──────────────────────────────────────────────────────────────────
create table if not exists tracks (
  id        uuid primary key default gen_random_uuid(),
  event_id  uuid not null references events(id) on delete cascade,
  name      text not null,
  color     text not null default '#1F4D3A',
  position  int  not null default 0
);
create index if not exists tracks_event_idx on tracks(event_id);

-- ─── speakers ────────────────────────────────────────────────────────────────
create table if not exists speakers (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references events(id) on delete cascade,
  name          text not null,
  headline      text,
  bio           text,
  photo_url     text,
  company       text,
  role          text,
  linkedin_url  text,
  twitter_url   text,
  website_url   text,
  speaker_type  text not null default 'speaker'
                  check (speaker_type in ('keynote','speaker','panelist','workshop','mc')),
  is_featured   boolean not null default false,
  position      int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists speakers_event_idx on speakers(event_id);

-- ─── sessions ────────────────────────────────────────────────────────────────
create table if not exists sessions (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid not null references events(id) on delete cascade,
  track_id            uuid references tracks(id) on delete set null,
  title               text not null,
  description         text,
  session_type        text not null default 'talk'
                        check (session_type in ('talk','keynote','workshop','panel','fireside','lightning','break')),
  starts_at           timestamptz not null,
  ends_at             timestamptz not null,
  room                text,
  capacity            int,
  registrations_count int not null default 0,
  is_published        boolean not null default true,
  position            int not null default 0,
  created_at          timestamptz not null default now()
);
create index if not exists sessions_event_idx   on sessions(event_id);
create index if not exists sessions_track_idx   on sessions(track_id);
create index if not exists sessions_starts_idx  on sessions(event_id, starts_at);

-- ─── session_speakers (M:M) ───────────────────────────────────────────────────
create table if not exists session_speakers (
  session_id  uuid not null references sessions(id) on delete cascade,
  speaker_id  uuid not null references speakers(id) on delete cascade,
  position    int  not null default 0,
  primary key (session_id, speaker_id)
);

-- ─── attendee_agendas ─────────────────────────────────────────────────────────
create table if not exists attendee_agendas (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid not null references registrations(id) on delete cascade,
  session_id      uuid not null references sessions(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (registration_id, session_id)
);
create index if not exists attendee_agendas_reg_idx     on attendee_agendas(registration_id);
create index if not exists attendee_agendas_session_idx on attendee_agendas(session_id);

-- ─── session_ratings ──────────────────────────────────────────────────────────
create table if not exists session_ratings (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid not null references registrations(id) on delete cascade,
  session_id      uuid not null references sessions(id) on delete cascade,
  rating          int  not null check (rating between 1 and 5),
  created_at      timestamptz not null default now(),
  unique (registration_id, session_id)
);

-- ─── event_feedback ───────────────────────────────────────────────────────────
create table if not exists event_feedback (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid not null references registrations(id) on delete cascade,
  event_id        uuid not null references events(id) on delete cascade,
  overall_rating  int  check (overall_rating between 1 and 5),
  highlights      text[],
  comment         text,
  created_at      timestamptz not null default now(),
  unique (registration_id, event_id)
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table tracks            enable row level security;
alter table speakers          enable row level security;
alter table sessions          enable row level security;
alter table session_speakers  enable row level security;
alter table attendee_agendas  enable row level security;
alter table session_ratings   enable row level security;
alter table event_feedback    enable row level security;

-- tracks: owner full, public read
do $$ begin
  if not exists (select 1 from pg_policies where tablename='tracks' and policyname='owner_all') then
    create policy owner_all on tracks for all
      using (event_id in (select id from events where user_id = auth.uid()))
      with check (event_id in (select id from events where user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='tracks' and policyname='public_read') then
    create policy public_read on tracks for select using (true);
  end if;
end $$;

-- speakers: owner full, public read
do $$ begin
  if not exists (select 1 from pg_policies where tablename='speakers' and policyname='owner_all') then
    create policy owner_all on speakers for all
      using (event_id in (select id from events where user_id = auth.uid()))
      with check (event_id in (select id from events where user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='speakers' and policyname='public_read') then
    create policy public_read on speakers for select using (true);
  end if;
end $$;

-- sessions: owner full, public read published
do $$ begin
  if not exists (select 1 from pg_policies where tablename='sessions' and policyname='owner_all') then
    create policy owner_all on sessions for all
      using (event_id in (select id from events where user_id = auth.uid()))
      with check (event_id in (select id from events where user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='sessions' and policyname='public_read') then
    create policy public_read on sessions for select using (is_published = true);
  end if;
end $$;

-- session_speakers: public read, owner manages via sessions
do $$ begin
  if not exists (select 1 from pg_policies where tablename='session_speakers' and policyname='public_read') then
    create policy public_read on session_speakers for select using (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='session_speakers' and policyname='owner_all') then
    create policy owner_all on session_speakers for all
      using (session_id in (select id from sessions where event_id in (select id from events where user_id = auth.uid())))
      with check (session_id in (select id from sessions where event_id in (select id from events where user_id = auth.uid())));
  end if;
end $$;

-- attendee_agendas: registrant owns their rows, public insert
do $$ begin
  if not exists (select 1 from pg_policies where tablename='attendee_agendas' and policyname='public_all') then
    create policy public_all on attendee_agendas for all using (true) with check (true);
  end if;
end $$;

-- session_ratings + event_feedback: public insert, read own
do $$ begin
  if not exists (select 1 from pg_policies where tablename='session_ratings' and policyname='public_all') then
    create policy public_all on session_ratings for all using (true) with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='event_feedback' and policyname='public_all') then
    create policy public_all on event_feedback for all using (true) with check (true);
  end if;
end $$;
