export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { SpeakerPortalClient } from '@/components/speaker/SpeakerPortalClient';

interface Props { params: { slug: string; speakerId: string } }

export async function generateMetadata({ params }: Props) {
  return { title: 'Speaker Portal' };
}

export default async function SpeakerPortalPage({ params }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event } = resolved;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: speaker } = await (admin as any)
    .from('speakers')
    .select('*')
    .eq('id', params.speakerId)
    .eq('event_id', event.id)
    .single();

  if (!speaker) notFound();

  // Sessions for this speaker
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessionSpeakers } = await (admin as any)
    .from('session_speakers')
    .select('sessions(id, title, starts_at, ends_at, room, session_type, track_id, tracks(name))')
    .eq('speaker_id', params.speakerId);

  const sessions = (sessionSpeakers ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((ss: any) => ss.sessions)
    .filter(Boolean);

  // Event resources (if table exists)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let resources: any[] = [];
  try {
    const { data } = await (admin as any)
      .from('event_resources')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: true });
    resources = data ?? [];
  } catch {
    resources = [];
  }

  return (
    <SpeakerPortalClient
      speaker={speaker}
      event={{ id: event.id, name: event.name, slug: event.slug, starts_at: (event as any).starts_at, ends_at: (event as any).ends_at }}
      sessions={sessions}
      resources={resources}
    />
  );
}
