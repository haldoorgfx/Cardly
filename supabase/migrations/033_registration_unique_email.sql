-- Remove duplicate registrations per event+email, keeping the most recent
DELETE FROM registrations
WHERE id NOT IN (
  SELECT DISTINCT ON (event_id, attendee_email) id
  FROM registrations
  ORDER BY event_id, attendee_email, created_at DESC NULLS LAST
);

-- Unique constraint: one registration per attendee email per event
ALTER TABLE registrations
ADD CONSTRAINT registrations_event_email_unique UNIQUE (event_id, attendee_email);
