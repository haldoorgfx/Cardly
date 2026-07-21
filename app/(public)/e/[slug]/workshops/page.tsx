export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { WorkshopsClient } from '@/components/events/WorkshopsClient';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { getEventFeatures, isSectionEnabled } from '@/lib/events/sectionGate';
import { resolveViewerRegistrationId } from '@/lib/attendee/resolveViewerRegistration';

interface Props { params: { slug: string }; searchParams: { reg?: string } }

export default async function WorkshopsPage({ params, searchParams }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event } = resolved;
  // Workshops are capacity-limited agenda sessions — gate with the schedule
  // section; 404 when the organizer has explicitly disabled it.
  if (!isSectionEnabled(await getEventFeatures(event.id), 'schedule')) notFound();

  // Resolve the viewer's registration from their session so booking works
  // when arriving from the hub without an explicit ?reg=.
  const viewerReg = await resolveViewerRegistrationId(event.id, searchParams.reg);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  const [{ data: sessions }, bookedIds, { data: eventPage }] = await Promise.all([
    adminAny
      .from('sessions')
      .select('id, title, starts_at, ends_at, room, capacity, registrations_count, track_id, tracks(name, color), session_speakers(speakers(name))')
      .eq('event_id', event.id)
      .eq('is_published', true)
      .not('capacity', 'is', null)
      .order('starts_at', { ascending: true }),
    viewerReg
      ? adminAny
          .from('attendee_agendas')
          .select('session_id')
          .eq('registration_id', viewerReg)
          .then((r: { data: { session_id: string }[] | null }) => r.data?.map((a) => a.session_id) ?? [])
      : Promise.resolve([]),
    adminAny.from('event_pages').select('timezone').eq('event_id', event.id).maybeSingle(),
  ]);

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <WorkshopsClient
        eventId={event.id}
        eventSlug={params.slug}
        sessions={sessions ?? []}
        bookedIds={bookedIds as string[]}
        registrationId={viewerReg ?? undefined}
        timezone={eventPage?.timezone || 'UTC'}
      />
    </div>
  );
}
