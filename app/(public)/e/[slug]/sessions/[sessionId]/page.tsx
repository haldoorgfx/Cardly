export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import SessionDetailClient from '@/components/events/SessionDetailClient';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';

interface Props { params: { slug: string; sessionId: string }; searchParams: { reg?: string } }

export default async function SessionDetailPage({ params, searchParams }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event } = resolved;

  const [{ data: session }, relatedResult, isSavedResult] = await Promise.all([
    admin.from('sessions')
      .select('*, tracks(id,name,color), session_speakers(speaker_id, position, speakers(id,name,photo_url,role,company,headline))')
      .eq('id', params.sessionId)
      .eq('event_id', event.id)
      .eq('is_published', true)
      .single(),
    admin.from('sessions')
      .select('id, title, starts_at, ends_at, room, tracks(id,name,color)')
      .eq('event_id', event.id)
      .eq('is_published', true)
      .neq('id', params.sessionId)
      .limit(3),
    searchParams.reg
      ? admin.from('attendee_agendas')
          .select('session_id')
          .eq('registration_id', searchParams.reg)
          .eq('session_id', params.sessionId)
          .maybeSingle()
          .then(r => !!r.data)
      : Promise.resolve(false),
  ]);

  if (!session) notFound();

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <SessionDetailClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session={session as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        relatedSessions={(relatedResult.data ?? []) as any}
        registrationId={searchParams.reg ?? null}
        initialSaved={isSavedResult}
      />
    </div>
  );
}
