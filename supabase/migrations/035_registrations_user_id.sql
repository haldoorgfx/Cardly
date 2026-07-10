-- Link registrations to attendee accounts when the registrant is logged in.
-- Nullable — guest registrations (no account) remain linked by email only.
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS registrations_user_id_idx ON registrations(user_id);
