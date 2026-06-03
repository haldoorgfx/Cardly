export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { PublicNav } from '@/components/events/PublicNav';
import FeedbackClient from '@/components/events/FeedbackClient';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';

interface Props { params: { slug: string }; searchParams: { reg?: string } }

export default async function FeedbackPage({ params, searchParams }: Props) {
  if (!searchParams.reg) redirect(`/e/${params.slug}`);

  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { eventPageTitle, event } = resolved;

  const { data: agendaSessions } = await admin
    .from('attendee_agendas')
    .select('session_id, sessions(id, title, starts_at)')
    .eq('registration_id', searchParams.reg)
    .order('created_at', { ascending: true });

  const sessions = (agendaSessions ?? [])
    .map(r => r.sessions)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter(Boolean) as any as { id: string; title: string; starts_at: string }[];

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav eventSlug={params.slug} eventName={event.name} />
      <FeedbackClient
        eventName={eventPageTitle ?? event.name}
        registrationId={searchParams.reg}
        eventSlug={params.slug}
        sessions={sessions}
      />
    </div>
  );
}
