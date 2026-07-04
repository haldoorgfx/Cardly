export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import VirtualPlayerClient from '@/components/sessions/VirtualPlayerClient';

interface Props { params: { slug: string; sessionId: string } }

export default async function WatchPage({ params }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event } = resolved;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session } = await (admin as any)
    .from('sessions')
    .select('id, title, description, stream_url, starts_at, ends_at, track')
    .eq('id', params.sessionId)
    .eq('event_id', event.id)
    .single();

  if (!session) notFound();

  const { data: speakers } = await admin
    .from('session_speakers')
    .select('speakers(id, full_name, avatar_url, title)')
    .eq('session_id', params.sessionId);

  const { data: relatedSessions } = await admin
    .from('sessions')
    .select('id, title, starts_at, track')
    .eq('event_id', event.id)
    .neq('id', params.sessionId)
    .eq('is_published', true)
    .limit(3);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: questions } = await (admin as any)
    .from('qa_questions')
    .select('id, question, upvotes_count, is_featured, is_anonymous, created_at, registrations!qa_questions_registration_id_fkey(attendee_name)')
    .eq('session_id', params.sessionId)
    .neq('status', 'hidden')
    .order('upvotes_count', { ascending: false })
    .limit(30);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speakerList = (speakers ?? []).map((s: any) => s.speakers).filter(Boolean);

  return (
    <VirtualPlayerClient
      event={{ id: event.id, name: event.name, slug: params.slug }}
      session={{
        id: session.id,
        title: session.title,
        description: session.description ?? '',
        stream_url: session.stream_url ?? null,
        starts_at: session.starts_at,
        ends_at: session.ends_at,
        track: session.track ?? null,
      }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      speakers={speakerList as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialQuestions={(questions ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      relatedSessions={(relatedSessions ?? []) as any}
    />
  );
}
