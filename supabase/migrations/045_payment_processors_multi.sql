-- Allow organizers to enable multiple payment processors simultaneously.
-- Attendees choose their preferred method at checkout.
alter table event_pages
  add column if not exists payment_processors text[] default null;

-- Backfill: copy existing single-processor value into the array column.
update event_pages
  set payment_processors = array[payment_processor]
  where payment_processor is not null
    and payment_processors is null;
