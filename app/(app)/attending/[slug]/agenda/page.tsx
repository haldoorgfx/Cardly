export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import PersonalAgendaClient from '@/components/events/PersonalAgendaClient';
import { resolveAttendeeWorkspace } from '@/lib/attendee/eventWorkspace';

interface Props { params: Promise<{ slug: string }>; searchParams: Promise<{ reg?: string }> }

export default async function MyAgendaPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { reg } = await searchParams;
  const ws = await resolveAttendeeWorkspace({ slug, reg, section: 'agenda' });

  const admin = createAdminClient();
  const [{ data: agendaRows }, { data: eventPage }] = await Promise.all([
    admin
      .from('attendee_agendas')
      .select('session_id, sessions(id, title, starts_at, ends_at, room, session_type, tracks(id,name,color), session_speakers(speaker_id, speakers(id,name,photo_url)))')
      .eq('registration_id', ws.registrationId)
      .order('created_at', { ascending: true }),
    admin.from('event_pages').select('timezone').eq('event_id', ws.eventId).maybeSingle(),
  ]);

  type AgendaSession = { starts_at: string; [key: string]: unknown };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessions = ((agendaRows ?? []) as any[])
    .map((r: { sessions: unknown }) => r.sessions as AgendaSession)
    .filter(Boolean)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  return (
    <div className="max-w-[700px]">
      <p className="text-[14px] mb-5" style={{ color: '#65736B' }}>
        {sessions.length} session{sessions.length !== 1 ? 's' : ''} saved
      </p>
      <PersonalAgendaClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sessions={sessions as any}
        registrationId={ws.registrationId}
        qrToken={ws.qrToken}
        eventSlug={slug}
        timezone={eventPage?.timezone || 'UTC'}
      />
    </div>
  );
}
