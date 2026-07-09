export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { PublicNav } from '@/components/events/PublicNav';
import PersonalAgendaClient from '@/components/events/PersonalAgendaClient';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';

interface Props { params: { slug: string }; searchParams: { reg?: string } }

export default async function MyAgendaPage({ params, searchParams }: Props) {
  if (!searchParams.reg) redirect(`/e/${params.slug}/schedule`);

  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { eventPageTitle, event } = resolved;
  const eventPage = { title: eventPageTitle };

  const { data: agendaRows } = await admin
    .from('attendee_agendas')
    .select('session_id, sessions(id, title, starts_at, ends_at, room, session_type, tracks(id,name,color), session_speakers(speaker_id, speakers(id,name,photo_url)))')
    .eq('registration_id', searchParams.reg)
    .order('created_at', { ascending: true });

  type AgendaSession = { starts_at: string; [key: string]: unknown };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawSessions = ((agendaRows ?? []) as any[]).map((r: { sessions: unknown }) => r.sessions as AgendaSession).filter(Boolean);
  rawSessions.sort((a: AgendaSession, b: AgendaSession) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const sessions = rawSessions;

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav eventSlug={params.slug} eventName={event.name} />
      <div>
        <PersonalAgendaClient
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sessions={sessions as any}
          eventName={eventPage.title ?? event.name}
          eventSlug={params.slug}
          registrationId={searchParams.reg!}
        />
      </div>
    </div>
  );
}
