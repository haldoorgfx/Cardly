export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { PublicNav } from '@/components/events/PublicNav';
import FeedbackClient from '@/components/events/FeedbackClient';

interface Props { params: { slug: string }; searchParams: { reg?: string } }

export default async function FeedbackPage({ params, searchParams }: Props) {
  if (!searchParams.reg) redirect(`/e/${params.slug}`);

  const admin = createAdminClient();

  const { data: eventPage } = await admin
    .from('event_pages')
    .select('event_id, title, ends_at, events!inner(id, slug, name)')
    .or(`custom_slug.eq.${params.slug},events.slug.eq.${params.slug}`)
    .eq('is_public', true)
    .single();

  if (!eventPage) notFound();

  const event = eventPage.events as unknown as { id: string; slug: string; name: string };

  const { data: agendaSessions } = await admin
    .from('attendee_agendas')
    .select('session_id, sessions(id, title, starts_at, session_type)')
    .eq('registration_id', searchParams.reg)
    .order('created_at', { ascending: true });

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav eventSlug={params.slug} eventName={event.name} />
      <div className="max-w-[680px] mx-auto px-5 py-10">
        <FeedbackClient
          eventId={event.id}
          eventTitle={eventPage.title}
          registrationId={searchParams.reg}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          attendedSessions={(agendaSessions ?? []).map(r => r.sessions).filter(Boolean) as any}
        />
      </div>
    </div>
  );
}
