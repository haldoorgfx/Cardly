-- M5: Ticketing depth — PWYW, access codes, require-approval, ticket transfer

-- PWYW: attendee picks their own price >= min_price
-- Access codes: hidden tickets unlocked by a secret code
ALTER TABLE ticket_types
  ADD COLUMN IF NOT EXISTS min_price   numeric DEFAULT NULL CHECK (min_price IS NULL OR min_price >= 0),
  ADD COLUMN IF NOT EXISTS access_code text    DEFAULT NULL;

-- Expand registrations status to include pending_approval
DO $$
BEGIN
  ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_status_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE registrations
  ADD CONSTRAINT registrations_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'checked_in', 'pending_approval'));

-- Ticket transfers audit log
CREATE TABLE IF NOT EXISTS ticket_transfers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  from_name       text NOT NULL,
  from_email      text NOT NULL,
  to_name         text NOT NULL,
  to_email        text NOT NULL,
  transferred_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ticket_transfers_reg_idx ON ticket_transfers(registration_id);

ALTER TABLE ticket_transfers ENABLE ROW LEVEL SECURITY;
-- Organizer can read transfers for their events
CREATE POLICY "organizer reads transfers" ON ticket_transfers FOR SELECT
  USING (
    registration_id IN (
      SELECT r.id FROM registrations r
      JOIN events e ON e.id = r.event_id
      WHERE e.user_id = auth.uid()
    )
  );
-- Attendee inserts their own transfer
CREATE POLICY "attendee inserts transfer" ON ticket_transfers FOR INSERT
  WITH CHECK (true);
