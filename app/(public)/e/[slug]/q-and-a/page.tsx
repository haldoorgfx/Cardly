export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicNav } from '@/components/events/PublicNav';
import QandAClient from '@/components/qa/QandAClient';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';

interface Props { params: { slug: string }; searchParams: { reg?: string; session?: string } }

export default async function QandAPage({ params, searchParams }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event } = resolved;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: questions } = await (admin as any)
    .from('qa_questions')
    .select('*, registrations(attendee_name)')
    .eq('event_id', event.id)
    .neq('status', 'hidden')
    .order('upvotes_count', { ascending: false })
    .order('created_at', { ascending: true });

  // If a specific session is requested, look up its title + room
  let sessionTitle: string | null = null;
  let sessionRoom: string | null = null;
  if (searchParams.session) {
    const { data: sess } = await admin
      .from('sessions')
      .select('title, room')
      .eq('id', searchParams.session)
      .single();
    sessionTitle = sess?.title ?? null;
    sessionRoom  = sess?.room  ?? null;
  }

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav eventSlug={params.slug} eventName={event.name} />
      <QandAClient
        eventId={event.id}
        registrationId={searchParams.reg ?? null}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        questions={(questions ?? []) as any}
        sessionTitle={sessionTitle}
        sessionRoom={sessionRoom}
      />
    </div>
  );
}
