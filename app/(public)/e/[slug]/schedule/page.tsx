export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { PublicNav } from '@/components/events/PublicNav';
import ScheduleClient from '@/components/events/ScheduleClient';

interface Props { params: { slug: string }; searchParams: { reg?: string } }

export default async function SchedulePage({ params, searchParams }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { eventId: _eventId, eventPageTitle, event } = resolved;
  const eventPage = { title: eventPageTitle };

  const [{ data: sessions }, { data: tracks }, savedSessionIds] = await Promise.all([
    admin.from('sessions')
      .select('*, tracks(id,name,color), session_speakers(speaker_id, position, speakers(id,name,photo_url,role))')
      .eq('event_id', event.id)
      .eq('is_published', true)
      .order('starts_at', { ascending: true }),
    admin.from('tracks').select('*').eq('event_id', event.id).order('position', { ascending: true }),
    searchParams.reg
      ? admin.from('attendee_agendas')
          .select('session_id')
          .eq('registration_id', searchParams.reg)
          .then(r => r.data?.map(a => a.session_id) ?? [])
      : Promise.resolve([] as string[]),
  ]);

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav eventSlug={params.slug} eventName={event.name} />
      <div className="max-w-[1000px] mx-auto px-5 py-10">
        <div className="mb-8">
          <h1 className="font-display font-normal text-[32px]" style={{ color: '#1F4D3A', letterSpacing: '-0.025em' }}>
            Schedule
          </h1>
          <p className="text-[16px] mt-2" style={{ color: '#6B7A72' }}>{eventPage.title}</p>
        </div>
        <ScheduleClient
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sessions={(sessions ?? []) as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tracks={(tracks ?? []) as any}
          registrationId={searchParams.reg ?? null}
          savedSessionIds={savedSessionIds}
        />
      </div>
    </div>
  );
}
