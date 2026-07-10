-- Phase 3 supplement: AI match suggestions
-- Idempotent — CREATE TABLE IF NOT EXISTS

create table if not exists match_suggestions (
  id                      uuid primary key default gen_random_uuid(),
  event_id                uuid not null references events(id) on delete cascade,
  registration_id         uuid not null references registrations(id) on delete cascade,
  matched_registration_id uuid not null references registrations(id) on delete cascade,
  score                   int not null default 0 check (score between 0 and 100),
  reason                  text not null default '',
  created_at              timestamptz not null default now(),
  unique (event_id, registration_id, matched_registration_id)
);

create index if not exists match_suggestions_event_idx on match_suggestions(event_id);
create index if not exists match_suggestions_reg_idx   on match_suggestions(registration_id, score desc);

alter table match_suggestions enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'match_suggestions' and policyname = 'public_all'
  ) then
    create policy public_all on match_suggestions for all using (true) with check (true);
  end if;
end $$;
