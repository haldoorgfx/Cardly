import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';

interface Props { params: Promise<{ id: string }> }

// Recurring event series is not shipped. The page here queried
// event_series.parent_event_id / frequency / default_time and an
// event_series_instances table — none of which exist in production (verified
// with the anon key: the recurrence columns return 400 "column does not
// exist", and event_series_instances returns 404 "table not found"). Nothing
// anywhere ever wrote to the instances table either, so even fixing the
// query would leave "Upcoming instances" permanently empty.
//
// It also collides with a table name that already has a real, different job:
// migration 030's event_series (organizer_id, name, slug, description) is a
// NAMED grouping of already-published events — that one works today and
// backs the public /events/series/[slug] page. Bolting parent_event_id /
// frequency / owner_id onto the same table would corrupt its existing rows'
// meaning rather than build the recurrence feature. That is real feature
// work and a schema decision, not a query fix — following the same honest
// redirect this event nav already uses for virtual/livestream, which had the
// identical shape (inert controls, no backend).
export default async function SeriesPage({ params }: Props) {
  const { id: ref } = await params;
  const ev = await resolveEventRef(ref);
  redirect(ev ? `/events/${ev.slug}` : '/dashboard');
}
