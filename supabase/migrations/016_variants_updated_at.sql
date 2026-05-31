-- Add updated_at to event_variants for optimistic concurrency control
alter table event_variants
  add column if not exists updated_at timestamptz not null default now();

-- Back-fill existing rows
update event_variants set updated_at = created_at where updated_at = now();
