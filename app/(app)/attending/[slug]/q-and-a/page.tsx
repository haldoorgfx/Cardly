export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import QandAClient from '@/components/qa/QandAClient';
import { requireAttendeeContext } from '@/lib/attendee/requireAttendeeContext';

export const metadata = { title: 'Q&A' };

export default async function AttendingQandAPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { registrationId, event, eventPageTitle } = await requireAttendeeContext(
    slug,
    `/attending/${slug}/q-and-a`,
  );

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: questions } = await (admin as any)
    .from('qa_questions')
    .select('*, registrations!qa_questions_registration_id_fkey(attendee_name)')
    .eq('event_id', event.id)
    .neq('status', 'hidden')
    .order('upvotes_count', { ascending: false })
    .order('created_at', { ascending: true });

  const { data: sessions } = await admin
    .from('sessions')
    .select('id, title')
    .eq('event_id', event.id)
    .eq('is_published', true)
    .order('starts_at', { ascending: true });

  return (
    <div className="max-w-[760px]">
      <div className="mb-8">
        <h1 className="font-display font-normal text-[28px]" style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}>
          Q&amp;A
        </h1>
        <p className="text-[15px] mt-1" style={{ color: '#6B7A72' }}>{eventPageTitle ?? event.name}</p>
      </div>
      <QandAClient
        eventId={event.id}
        registrationId={registrationId}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialQuestions={(questions ?? []) as any}
        sessions={(sessions ?? []) as { id: string; title: string }[]}
      />
    </div>
  );
}
