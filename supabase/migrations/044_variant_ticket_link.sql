-- 044: link event_variants to ticket_types so different ticket tiers get different card designs
-- ticket_type_id NULL means "default variant" (used when no ticket-specific variant matches)

alter table event_variants
  add column if not exists ticket_type_id uuid references ticket_types(id) on delete set null;

create index if not exists idx_event_variants_ticket_type_id on event_variants(ticket_type_id);
