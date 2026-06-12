export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicNav } from '@/components/events/PublicNav';
import { WorkshopsClient } from '@/components/events/WorkshopsClient';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';

interface Props { params: { slug: string }; searchParams: { reg?: string } }

export default async function WorkshopsPage({ params, searchParams }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event } = resolved;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  const [{ data: sessions }, bookedIds] = await Promise.all([
    adminAny
      .from('sessions')
      .select('id, title, starts_at, ends_at, room, capacity, registrations_count, track_id, tracks(name, color), session_speakers(speakers(name))')
      .eq('event_id', event.id)
      .eq('is_published', true)
      .not('capacity', 'is', null)
      .order('starts_at', { ascending: true }),
    searchParams.reg
      ? adminAny
          .from('attendee_agendas')
          .select('session_id')
          .eq('registration_id', searchParams.reg)
          .then((r: { data: { session_id: string }[] | null }) => r.data?.map((a) => a.session_id) ?? [])
      : Promise.resolve([]),
  ]);

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav eventSlug={params.slug} eventName={event.name} />
      <WorkshopsClient
        eventId={event.id}
        eventSlug={params.slug}
        sessions={sessions ?? []}
        bookedIds={bookedIds as string[]}
        registrationId={searchParams.reg}
      />
    </div>
  );
}
