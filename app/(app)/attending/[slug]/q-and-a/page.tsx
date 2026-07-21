export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import QandAClient from '@/components/qa/QandAClient';
import { resolveAttendeeWorkspace } from '@/lib/attendee/eventWorkspace';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reg?: string; session?: string }>;
}

export default async function QandAPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { reg } = await searchParams;
  const ws = await resolveAttendeeWorkspace({ slug, reg, section: 'qa' });

  const admin = createAdminClient();
  const [{ data: questions }, { data: sessions }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('qa_questions')
      .select('*, registrations!qa_questions_registration_id_fkey(attendee_name)')
      .eq('event_id', ws.eventId)
      .neq('status', 'hidden')
      .order('upvotes_count', { ascending: false })
      .order('created_at', { ascending: true }),
    admin
      .from('sessions')
      .select('id, title')
      .eq('event_id', ws.eventId)
      .eq('is_published', true)
      .order('starts_at', { ascending: true }),
  ]);

  // QandAClient renders "Anonymous" client-side, but the real attendee_name and
  // registration_id still shipped inside this page's payload — any attendee
  // could read the network response and de-anonymise every anonymous question.
  // Redact server-side, matching what /api/events/[id]/q-and-a already does.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeQuestions = (questions ?? []).map((q: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { registration_id: _registrationId, registrations, ...rest } = q;
    return { ...rest, registrations: q.is_anonymous ? null : registrations };
  });

  return (
    <div className="max-w-[760px]">
      <QandAClient
        eventId={ws.eventId}
        registrationId={ws.registrationId}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialQuestions={safeQuestions as any}
        sessions={(sessions ?? []) as { id: string; title: string }[]}
      />
    </div>
  );
}
