export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import MessagingClient from '@/components/messaging/MessagingClient';
interface Props { params: { slug: string }; searchParams: { reg?: string } }

export default async function MessagesPage({ params, searchParams }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event } = resolved;

  const regId = searchParams.reg;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: threads } = regId ? await (admin as any)
    .from('message_threads')
    .select('id, participant_a, participant_b, last_message_at, registrations!participant_b(id, attendee_name)')
    .or(`participant_a.eq.${regId},participant_b.eq.${regId}`)
    .order('last_message_at', { ascending: false })
    : { data: [] };

  const firstThread = (threads ?? [])[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: messages } = firstThread ? await (admin as any)
    .from('messages')
    .select('id, content, sender_id, created_at, read_at')
    .eq('thread_id', firstThread.id)
    .order('created_at', { ascending: true })
    : { data: [] };

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <MessagingClient
        eventId={event.id}
        registrationId={regId ?? null}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialThreads={(threads ?? []) as any}
        initialActiveThreadId={firstThread?.id ?? null}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialMessages={(messages ?? []) as any}
      />
    </div>
  );
}
