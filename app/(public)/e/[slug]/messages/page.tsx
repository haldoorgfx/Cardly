export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { PublicNav } from '@/components/events/PublicNav';
import MessagingClient from '@/components/networking/MessagingClient';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';

interface Props { params: { slug: string }; searchParams: { reg?: string } }

export default async function MessagesPage({ params, searchParams }: Props) {
  if (!searchParams.reg) redirect(`/e/${params.slug}`);

  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event } = resolved;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: threads } = await (admin as any)
    .from('message_threads')
    .select('id, participant_a, participant_b, last_message_at')
    .eq('event_id', event.id)
    .or(`participant_a.eq.${searchParams.reg},participant_b.eq.${searchParams.reg}`)
    .order('last_message_at', { ascending: false });

  const reg = searchParams.reg!;
  const otherIds = (threads ?? []).map((t: { participant_a: string; participant_b: string }) =>
    t.participant_a === reg ? t.participant_b : t.participant_a
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: regs } = otherIds.length
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? await (admin as any).from('registrations').select('id, attendee_name').in('id', otherIds)
    : { data: [] };

  const nameMap = new Map((regs ?? []).map((r: { id: string; attendee_name: string }) => [r.id, r.attendee_name]));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enrichedThreads = (threads ?? []).map((t: any) => ({
    id: t.id,
    other_participant_id: t.participant_a === reg ? t.participant_b : t.participant_a,
    other_participant_name: nameMap.get(t.participant_a === reg ? t.participant_b : t.participant_a) ?? 'Attendee',
    last_message_at: t.last_message_at,
    unread_count: 0,
  }));

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav eventSlug={params.slug} eventName={event.name} />
      <MessagingClient
        eventId={event.id}
        registrationId={reg}
        initialThreads={enrichedThreads}
      />
    </div>
  );
}
