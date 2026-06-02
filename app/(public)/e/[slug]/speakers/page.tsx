export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicNav } from '@/components/events/PublicNav';
import SpeakerDirectoryClient from '@/components/events/SpeakerDirectoryClient';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';

interface Props { params: { slug: string } }

export default async function PublicSpeakersPage({ params }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { eventPageTitle, event } = resolved;
  const eventPage = { title: eventPageTitle };

  const { data: speakers } = await admin
    .from('speakers')
    .select('*')
    .eq('event_id', event.id)
    .order('is_featured', { ascending: false })
    .order('position', { ascending: true });

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav eventSlug={params.slug} eventName={event.name} />
      <div className="max-w-[1000px] mx-auto px-5 py-10">
        <div className="mb-8">
          <h1 className="font-display font-normal text-[32px]" style={{ color: '#1F4D3A', letterSpacing: '-0.025em' }}>
            Speakers
          </h1>
          <p className="text-[16px] mt-2" style={{ color: '#6B7A72' }}>
            {speakers?.length ?? 0} speaker{(speakers?.length ?? 0) !== 1 ? 's' : ''} at {eventPage.title}
          </p>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <SpeakerDirectoryClient speakers={(speakers ?? []) as any} eventSlug={params.slug} />
      </div>
    </div>
  );
}
