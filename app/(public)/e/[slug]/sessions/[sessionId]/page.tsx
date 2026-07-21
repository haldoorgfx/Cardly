export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import SessionDetailClient from '@/components/events/SessionDetailClient';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { resolveViewerRegistrationId } from '@/lib/attendee/resolveViewerRegistration';

interface Props { params: { slug: string; sessionId: string }; searchParams: { reg?: string } }

export default async function SessionDetailPage({ params, searchParams }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event } = resolved;

  // Resolve the viewer's registration from their session (or ?reg=) so the
  // "Save to agenda" booking works when arriving from the hub without ?reg=.
  const viewerReg = await resolveViewerRegistrationId(event.id, searchParams.reg);

  // The agenda save/remove endpoint now requires this registration's own
  // qr_code_token to prove guest identity (a bare registration id is no
  // longer sufficient — see lib/attendee-identity.ts).
  let viewerQrToken: string | null = null;
  if (viewerReg) {
    const { data: viewerRegRow } = await admin
      .from('registrations')
      .select('qr_code_token')
      .eq('id', viewerReg)
      .maybeSingle();
    viewerQrToken = viewerRegRow?.qr_code_token ?? null;
  }

  const [{ data: session }, relatedResult, isSavedResult, { data: eventPage }] = await Promise.all([
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
    viewerReg
      ? admin.from('attendee_agendas')
          .select('session_id')
          .eq('registration_id', viewerReg)
          .eq('session_id', params.sessionId)
          .maybeSingle()
          .then(r => !!r.data)
      : Promise.resolve(false),
    admin.from('event_pages').select('timezone').eq('event_id', event.id).maybeSingle(),
  ]);

  if (!session) notFound();

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <SessionDetailClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session={session as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        relatedSessions={(relatedResult.data ?? []) as any}
        registrationId={viewerReg}
        qrToken={viewerQrToken}
        initialSaved={isSavedResult}
        timezone={eventPage?.timezone || 'UTC'}
      />
    </div>
  );
}
