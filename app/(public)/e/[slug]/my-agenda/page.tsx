export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { PublicNav } from '@/components/events/PublicNav';
import PersonalAgendaClient from '@/components/events/PersonalAgendaClient';

interface Props { params: { slug: string }; searchParams: { reg?: string } }

export default async function MyAgendaPage({ params, searchParams }: Props) {
  if (!searchParams.reg) redirect(`/e/${params.slug}/schedule`);

  const admin = createAdminClient();

  const { data: eventPage } = await admin
    .from('event_pages')
    .select('event_id, title, starts_at, ends_at, timezone, events!inner(id, slug, name)')
    .or(`custom_slug.eq.${params.slug},events.slug.eq.${params.slug}`)
    .eq('is_public', true)
    .single();

  if (!eventPage) notFound();

  const event = eventPage.events as unknown as { id: string; slug: string; name: string };

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
      <div className="max-w-[700px] mx-auto px-5 py-10">
        <div className="mb-8">
          <h1 className="font-display font-normal text-[28px]" style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}>
            My Agenda
          </h1>
          <p className="text-[15px] mt-1" style={{ color: '#6B7A72' }}>
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} saved · {eventPage.title}
          </p>
        </div>
        <PersonalAgendaClient
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sessions={sessions as any}
          registrationId={searchParams.reg}
          eventSlug={params.slug}
        />
      </div>
    </div>
  );
}
