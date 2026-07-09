export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { PublicNav } from '@/components/events/PublicNav';
import MessagingClient from '@/components/networking/MessagingClient';
import type { ThreadSummary } from '@/components/networking/MessagingClient';

interface Props {
  params: { slug: string };
  searchParams: { reg?: string };
}

interface EventPageRow {
  id: string;
  title: string;
  event_id: string;
}

export default async function MessagesPage({ params, searchParams }: Props) {
  const { slug } = params;
  const regParam = searchParams.reg ?? null;

  const admin = createAdminClient();

  const { data: eventPage } = await (admin as any)
    .from('event_pages')
    .select('id, title, event_id')
    .eq('custom_slug', slug)
    .single() as { data: EventPageRow | null };

  if (!eventPage) notFound();

  if (!regParam) {
    return (
      <div className="min-h-screen" style={{ background: '#FAF6EE' }}>
        <PublicNav eventSlug={slug} eventTitle={eventPage.title} />
        <main className="max-w-[900px] mx-auto px-4 sm:px-6 py-16 text-center">
          <p className="text-[16px] font-medium" style={{ color: '#1F4D3A' }}>
            Register for this event to use messaging.
          </p>
          <p className="text-[14px] mt-2" style={{ color: '#6B7A72' }}>
            You need a registration to send and receive messages.
          </p>
        </main>
      </div>
    );
  }

  // Fetch threads for this registration
  let threads: ThreadSummary[] = [];
  try {
    const { data: threadData } = await (admin as any)
      .from('message_threads')
      .select('id, participant_a_id, participant_b_id, last_message_content, last_message_sender_id, unread_a, unread_b')
      .or(`participant_a_id.eq.${regParam},participant_b_id.eq.${regParam}`)
      .eq('event_id', eventPage.event_id)
      .order('updated_at', { ascending: false })
      .limit(50) as { data: any[] | null };

    if (threadData) {
      // Fetch names for other participants
      const otherIds = threadData.map((t) =>
        t.participant_a_id === regParam ? t.participant_b_id : t.participant_a_id
      );

      const { data: regNames } = await (admin as any)
        .from('registrations')
        .select('id, attendee_name')
        .in('id', otherIds) as { data: { id: string; attendee_name: string }[] | null };

      const nameMap: Record<string, string> = {};
      for (const r of regNames ?? []) {
        nameMap[r.id] = r.attendee_name;
      }

      threads = threadData.map((t) => {
        const otherId = t.participant_a_id === regParam ? t.participant_b_id : t.participant_a_id;
        const isA = t.participant_a_id === regParam;
        return {
          id: t.id,
          other_participant_id: otherId,
          other_participant_name: nameMap[otherId] ?? 'Attendee',
          last_message: t.last_message_content
            ? { content: t.last_message_content, sender_id: t.last_message_sender_id }
            : null,
          unread_count: isA ? (t.unread_a ?? 0) : (t.unread_b ?? 0),
        };
      });
    }
  } catch {
    // table may not exist yet — return empty threads
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAF6EE' }}>
      <PublicNav eventSlug={slug} eventTitle={eventPage.title} />
      <main className="max-w-[960px] mx-auto px-4 sm:px-6 py-6">
        <MessagingClient
          eventId={eventPage.event_id}
          registrationId={regParam}
          initialThreads={threads}
        />
      </main>
    </div>
  );
}
