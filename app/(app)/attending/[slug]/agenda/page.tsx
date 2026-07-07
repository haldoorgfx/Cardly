export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import PersonalAgendaClient from '@/components/events/PersonalAgendaClient';
import { requireAttendeeContext } from '@/lib/attendee/requireAttendeeContext';

export const metadata = { title: 'My agenda' };

export default async function AttendingAgendaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { registrationId, eventPageTitle, event } = await requireAttendeeContext(
    slug,
    `/attending/${slug}/agenda`,
  );

  const admin = createAdminClient();
  const { data: agendaRows } = await admin
    .from('attendee_agendas')
    .select('session_id, sessions(id, title, starts_at, ends_at, room, session_type, tracks(id,name,color), session_speakers(speaker_id, speakers(id,name,photo_url)))')
    .eq('registration_id', registrationId)
    .order('created_at', { ascending: true });

  type AgendaSession = { starts_at: string; [key: string]: unknown };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessions = ((agendaRows ?? []) as any[])
    .map((r: { sessions: unknown }) => r.sessions as AgendaSession)
    .filter(Boolean)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-semibold text-[26px] sm:text-[30px] leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
          My Agenda
        </h1>
        <p className="text-[14px] sm:text-[14.5px] mt-1.5" style={{ color: '#3A4A42' }}>
          {sessions.length} session{sessions.length !== 1 ? 's' : ''} saved · {eventPageTitle ?? event.name}
        </p>
      </div>
      <PersonalAgendaClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sessions={sessions as any}
        registrationId={registrationId}
        eventSlug={slug}
      />
    </div>
  );
}
