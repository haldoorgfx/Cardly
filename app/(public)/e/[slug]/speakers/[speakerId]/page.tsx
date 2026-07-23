export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import SpeakerProfileClient from '@/components/events/SpeakerProfileClient';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

interface Props { params: { slug: string; speakerId: string } }

export default async function SpeakerProfilePage({ params }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event } = resolved;
  if (!(await isPlatformFeatureEnabled('speakers'))) notFound();

  // speakerId may be a UUID (old links) or a slug (new links)
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const speakerCol = UUID_RE.test(params.speakerId) ? 'id' : 'slug';

  // Explicit column list — `select('*')` also shipped speakers.email (added in
  // migration 039) into this public page's RSC payload, publishing every
  // speaker's private address to scrapers.
  const { data: speaker } = await admin
    .from('speakers')
    .select('id, name, headline, bio, photo_url, company, role, linkedin_url, twitter_url, website_url, speaker_type, is_featured, event_id')
    .eq(speakerCol, params.speakerId)
    .eq('event_id', event.id)
    .maybeSingle();
  if (!speaker) notFound();

  // Session times must render in the EVENT's timezone, not the viewer's.
  const { data: eventPage } = await admin
    .from('event_pages')
    .select('timezone')
    .eq('event_id', event.id)
    .maybeSingle();

  // Filter sessions by the RESOLVED speaker UUID. session_speakers.speaker_id is
  // a UUID, so filtering by the slug (new-style links) always returned nothing.
  const { data: sessions } = await admin.from('sessions')
    .select('*, tracks(id,name,color), session_speakers!inner(speaker_id)')
    .eq('event_id', event.id)
    .eq('session_speakers.speaker_id', speaker.id)
    .eq('is_published', true)
    .order('starts_at', { ascending: true });

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <SpeakerProfileClient speaker={speaker as any} sessions={(sessions ?? []) as any} eventSlug={params.slug} timezone={eventPage?.timezone ?? null} />
    </div>
  );
}
