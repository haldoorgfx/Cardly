-- The live registrations_status_check constraint is missing some statuses the app
-- actually uses (notably 'refunded', plus 'waitlisted' and 'pending_approval'),
-- so refunds and other status changes fail with a 500 check-constraint violation.
-- Re-create the constraint with the full set of statuses used across the platform.

alter table registrations
  drop constraint if exists registrations_status_check;

alter table registrations
  add constraint registrations_status_check
  check (status in (
    'pending', 'confirmed', 'checked_in', 'cancelled', 'refunded',
    'waitlisted', 'pending_approval'
  ));
