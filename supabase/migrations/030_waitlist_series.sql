-- M3: Waitlist entries + Event series

-- Waitlist entries (attendee-facing queue when event is sold out)
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_page_id uuid NOT NULL REFERENCES event_pages(id) ON DELETE CASCADE,
  email         text NOT NULL,
  name          text NOT NULL,
  status        text NOT NULL DEFAULT 'waiting'
                  CHECK (status IN ('waiting', 'invited', 'registered', 'expired')),
  position      int,
  notified_at   timestamptz,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (event_page_id, email)
);
CREATE INDEX IF NOT EXISTS waitlist_entries_page_idx ON waitlist_entries(event_page_id, status, position);

ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can join waitlist"  ON waitlist_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "organizer reads waitlist"  ON waitlist_entries FOR SELECT
  USING (
    event_page_id IN (
      SELECT ep.id FROM event_pages ep
      JOIN events e ON e.id = ep.event_id
      WHERE e.user_id = auth.uid()
    )
  );
CREATE POLICY "organizer updates waitlist" ON waitlist_entries FOR UPDATE
  USING (
    event_page_id IN (
      SELECT ep.id FROM event_pages ep
      JOIN events e ON e.id = ep.event_id
      WHERE e.user_id = auth.uid()
    )
  );

-- Event series
CREATE TABLE IF NOT EXISTS event_series (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name          text NOT NULL,
  slug          text UNIQUE NOT NULL,
  description   text,
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_series_org_idx ON event_series(organizer_id);

ALTER TABLE event_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads series"   ON event_series FOR SELECT USING (true);
CREATE POLICY "organizer owns series" ON event_series FOR ALL USING (organizer_id = auth.uid());

-- Link event_pages to a series
ALTER TABLE event_pages
  ADD COLUMN IF NOT EXISTS series_id   uuid REFERENCES event_series(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS series_name text;  -- denormalized for query performance

CREATE INDEX IF NOT EXISTS event_pages_series_idx ON event_pages(series_id) WHERE series_id IS NOT NULL;
