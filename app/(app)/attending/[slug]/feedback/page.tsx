export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import FeedbackClient from '@/components/events/FeedbackClient';
import { requireAttendeeContext } from '@/lib/attendee/requireAttendeeContext';

export const metadata = { title: 'Feedback' };

export default async function AttendingFeedbackPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { registrationId, event, eventPageTitle } = await requireAttendeeContext(
    slug,
    `/attending/${slug}/feedback`,
  );

  const admin = createAdminClient();

  const { data: agendaSessions } = await admin
    .from('attendee_agendas')
    .select('session_id, sessions(id, title, starts_at, session_type)')
    .eq('registration_id', registrationId)
    .order('created_at', { ascending: true });

  const { data: existingFeedback } = await admin
    .from('event_feedback')
    .select('overall_rating, highlights, comment')
    .eq('registration_id', registrationId)
    .eq('event_id', event.id)
    .maybeSingle();

  return (
    <div className="max-w-[680px]">
      <FeedbackClient
        eventId={event.id}
        eventTitle={eventPageTitle ?? event.name}
        registrationId={registrationId}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attendedSessions={(agendaSessions ?? []).map(r => r.sessions).filter(Boolean) as any}
        existingFeedback={existingFeedback ?? null}
      />
    </div>
  );
}
