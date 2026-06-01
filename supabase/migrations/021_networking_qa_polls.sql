-- Phase 3: Networking, Messaging, Live Q&A, Polls, Leaderboard
-- Idempotent — all CREATE TABLE IF NOT EXISTS

-- ─── attendee_connections ─────────────────────────────────────────────────────
-- Connections between event attendees (by registration_id)
create table if not exists attendee_connections (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id) on delete cascade,
  requester_id    uuid not null references registrations(id) on delete cascade,
  recipient_id    uuid not null references registrations(id) on delete cascade,
  status          text not null default 'pending'
                    check (status in ('pending','accepted','declined')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (requester_id, recipient_id)
);
create index if not exists connections_event_idx     on attendee_connections(event_id);
create index if not exists connections_requester_idx on attendee_connections(requester_id);
create index if not exists connections_recipient_idx on attendee_connections(recipient_id);

-- ─── message_threads ──────────────────────────────────────────────────────────
create table if not exists message_threads (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references events(id) on delete cascade,
  participant_a uuid not null references registrations(id) on delete cascade,
  participant_b uuid not null references registrations(id) on delete cascade,
  last_message_at timestamptz,
  created_at    timestamptz not null default now(),
  unique (participant_a, participant_b)
);
create index if not exists threads_event_idx on message_threads(event_id);
create index if not exists threads_a_idx     on message_threads(participant_a);
create index if not exists threads_b_idx     on message_threads(participant_b);

-- ─── messages ─────────────────────────────────────────────────────────────────
create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references message_threads(id) on delete cascade,
  sender_id   uuid not null references registrations(id) on delete cascade,
  content     text not null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists messages_thread_idx on messages(thread_id, created_at);
create index if not exists messages_sender_idx on messages(sender_id);

-- ─── qa_questions ─────────────────────────────────────────────────────────────
create table if not exists qa_questions (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id) on delete cascade,
  session_id      uuid references sessions(id) on delete cascade,
  registration_id uuid references registrations(id) on delete set null,
  question        text not null,
  is_anonymous    boolean not null default false,
  upvotes_count   int not null default 0,
  status          text not null default 'pending'
                    check (status in ('pending','answered','hidden')),
  is_featured     boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists qa_event_idx   on qa_questions(event_id, status, created_at);
create index if not exists qa_session_idx on qa_questions(session_id);

-- ─── qa_upvotes ───────────────────────────────────────────────────────────────
create table if not exists qa_upvotes (
  question_id     uuid not null references qa_questions(id) on delete cascade,
  registration_id uuid not null references registrations(id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (question_id, registration_id)
);

-- ─── polls ────────────────────────────────────────────────────────────────────
create table if not exists polls (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  session_id  uuid references sessions(id) on delete cascade,
  organizer_id uuid references profiles(id) on delete set null,
  question    text not null,
  is_active   boolean not null default false,
  is_closed   boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists polls_event_idx on polls(event_id);

-- ─── poll_options ─────────────────────────────────────────────────────────────
create table if not exists poll_options (
  id          uuid primary key default gen_random_uuid(),
  poll_id     uuid not null references polls(id) on delete cascade,
  text        text not null,
  votes_count int not null default 0,
  position    int not null default 0
);
create index if not exists poll_options_poll_idx on poll_options(poll_id);

-- ─── poll_votes ───────────────────────────────────────────────────────────────
create table if not exists poll_votes (
  poll_id         uuid not null references polls(id) on delete cascade,
  option_id       uuid not null references poll_options(id) on delete cascade,
  registration_id uuid not null references registrations(id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (poll_id, registration_id)   -- one vote per poll per attendee
);

-- ─── leaderboard_points ───────────────────────────────────────────────────────
create table if not exists leaderboard_points (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id) on delete cascade,
  registration_id uuid not null references registrations(id) on delete cascade,
  action_type     text not null
                    check (action_type in ('session_attend','connection_made','question_asked','poll_voted','feedback_given','card_shared')),
  points          int not null default 10,
  ref_id          uuid,                    -- session_id / question_id / etc.
  created_at      timestamptz not null default now()
);
create index if not exists leaderboard_event_idx on leaderboard_points(event_id);
create index if not exists leaderboard_reg_idx   on leaderboard_points(registration_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table attendee_connections  enable row level security;
alter table message_threads       enable row level security;
alter table messages              enable row level security;
alter table qa_questions          enable row level security;
alter table qa_upvotes            enable row level security;
alter table polls                 enable row level security;
alter table poll_options          enable row level security;
alter table poll_votes            enable row level security;
alter table leaderboard_points    enable row level security;

-- All Phase 3 tables: public read/insert (attendees use qr_code_token, not auth)
-- Event owners get full access for moderation
do $$ begin
  if not exists (select 1 from pg_policies where tablename='attendee_connections' and policyname='public_all') then
    create policy public_all on attendee_connections for all using (true) with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='message_threads' and policyname='public_all') then
    create policy public_all on message_threads for all using (true) with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='messages' and policyname='public_all') then
    create policy public_all on messages for all using (true) with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='qa_questions' and policyname='public_all') then
    create policy public_all on qa_questions for all using (true) with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='qa_upvotes' and policyname='public_all') then
    create policy public_all on qa_upvotes for all using (true) with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='polls' and policyname='public_read') then
    create policy public_read on polls for select using (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='polls' and policyname='owner_write') then
    create policy owner_write on polls for all
      using (event_id in (select id from events where user_id = auth.uid()))
      with check (event_id in (select id from events where user_id = auth.uid()));
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='poll_options' and policyname='public_all') then
    create policy public_all on poll_options for all using (true) with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='poll_votes' and policyname='public_all') then
    create policy public_all on poll_votes for all using (true) with check (true);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='leaderboard_points' and policyname='public_all') then
    create policy public_all on leaderboard_points for all using (true) with check (true);
  end if;
end $$;

-- ─── Helper: atomic upvote toggle ─────────────────────────────────────────────
create or replace function toggle_qa_upvote(p_question_id uuid, p_registration_id uuid)
returns boolean   -- true = upvoted, false = un-upvoted
language plpgsql security definer as $$
declare v_exists boolean;
begin
  select exists(select 1 from qa_upvotes where question_id=p_question_id and registration_id=p_registration_id) into v_exists;
  if v_exists then
    delete from qa_upvotes where question_id=p_question_id and registration_id=p_registration_id;
    update qa_questions set upvotes_count = greatest(0, upvotes_count-1) where id=p_question_id;
    return false;
  else
    insert into qa_upvotes(question_id, registration_id) values(p_question_id, p_registration_id);
    update qa_questions set upvotes_count = upvotes_count+1 where id=p_question_id;
    return true;
  end if;
end;
$$;

-- ─── Helper: cast poll vote ───────────────────────────────────────────────────
create or replace function cast_poll_vote(p_poll_id uuid, p_option_id uuid, p_registration_id uuid)
returns void language plpgsql security definer as $$
begin
  insert into poll_votes(poll_id, option_id, registration_id) values(p_poll_id, p_option_id, p_registration_id)
  on conflict (poll_id, registration_id) do nothing;
  update poll_options set votes_count = votes_count+1 where id=p_option_id;
end;
$$;
