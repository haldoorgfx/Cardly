export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import FeedbackClient from '@/components/events/FeedbackClient';
import { resolveAttendeeWorkspace } from '@/lib/attendee/eventWorkspace';

interface Props { params: Promise<{ slug: string }>; searchParams: Promise<{ reg?: string }> }

export default async function FeedbackPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { reg } = await searchParams;
  // The public copy had NO section gate, so feedback stayed reachable after an
  // organizer switched it off. Gated here.
  const ws = await resolveAttendeeWorkspace({ slug, reg, section: 'feedback' });

  const admin = createAdminClient();
  const [{ data: agendaSessions }, { data: existingFeedback }] = await Promise.all([
    admin
      .from('attendee_agendas')
      .select('session_id, sessions(id, title, starts_at, session_type)')
      .eq('registration_id', ws.registrationId)
      .order('created_at', { ascending: true }),
    admin
      .from('event_feedback')
      .select('overall_rating, highlights, comment')
      .eq('registration_id', ws.registrationId)
      .eq('event_id', ws.eventId)
      .maybeSingle(),
  ]);

  return (
    <FeedbackClient
      eventId={ws.eventId}
      eventTitle={ws.eventName}
      registrationId={ws.registrationId}
      qrToken={ws.qrToken}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      attendedSessions={(agendaSessions ?? []).map(r => r.sessions).filter(Boolean) as any}
      existingFeedback={existingFeedback ?? null}
    />
  );
}
