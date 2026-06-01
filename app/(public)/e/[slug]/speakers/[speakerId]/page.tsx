export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicNav } from '@/components/events/PublicNav';
import SpeakerProfileClient from '@/components/events/SpeakerProfileClient';

interface Props { params: { slug: string; speakerId: string } }

export default async function SpeakerProfilePage({ params }: Props) {
  const admin = createAdminClient();

  const { data: eventPage } = await admin
    .from('event_pages')
    .select('event_id, title, events!inner(id, slug, name)')
    .or(`custom_slug.eq.${params.slug},events.slug.eq.${params.slug}`)
    .eq('is_public', true)
    .single();

  if (!eventPage) notFound();

  const event = eventPage.events as unknown as { id: string; slug: string; name: string };

  const [{ data: speaker }, { data: sessions }] = await Promise.all([
    admin.from('speakers').select('*').eq('id', params.speakerId).eq('event_id', event.id).single(),
    admin.from('sessions')
      .select('*, tracks(id,name,color), session_speakers!inner(speaker_id)')
      .eq('event_id', event.id)
      .eq('session_speakers.speaker_id', params.speakerId)
      .eq('is_published', true)
      .order('starts_at', { ascending: true }),
  ]);

  if (!speaker) notFound();

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav eventSlug={params.slug} eventName={event.name} />
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <SpeakerProfileClient speaker={speaker as any} sessions={(sessions ?? []) as any} eventSlug={params.slug} />
    </div>
  );
}
