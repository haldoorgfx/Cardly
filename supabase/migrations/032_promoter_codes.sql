-- M6: Promoter/affiliate link tracking + UTM source capture

-- 1. Referral attribution columns on registrations
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS referral_code text    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS utm_source    text    DEFAULT NULL;

-- 2. Promoter codes table
CREATE TABLE IF NOT EXISTS promoter_codes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  code        text        NOT NULL,
  label       text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(event_id, code)
);

ALTER TABLE promoter_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizer manages promoter codes" ON promoter_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE id = promoter_codes.event_id AND user_id = auth.uid())
  );
