-- ============================================================================
-- 095_decrement_ticket_quantity_sold.sql
--
-- WHY THIS EXISTS
--   increment_ticket_quantity_sold() (017_event_registration.sql) has no
--   counterpart. Deleting a registration, or cancelling/refunding one against
--   a limited-quantity ticket type, never releases the slot back — over time
--   TicketTypesManager's remaining-capacity math drifts low and can falsely
--   mark a ticket type "Sold out" with real capacity available.
--
--   Mirrors increment's clamping behaviour (never goes below 0) so a stray
--   double-call can't corrupt the counter negative.
--
-- DEPENDS ON
--   017_event_registration.sql → ticket_types.quantity_sold
--
-- IDEMPOTENT: create or replace function. Safe to re-run.
-- ============================================================================

create or replace function decrement_ticket_quantity_sold(ticket_id uuid, qty int default 1)
returns void
language plpgsql security definer as $$
begin
  update ticket_types
  set    quantity_sold = greatest(0, quantity_sold - qty)
  where  id = ticket_id;
end;
$$;
