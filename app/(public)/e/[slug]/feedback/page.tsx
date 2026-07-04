export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import FeedbackClient from '@/components/events/FeedbackClient';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';

interface Props { params: { slug: string }; searchParams: { reg?: string } }

export default async function FeedbackPage({ params, searchParams }: Props) {
  if (!searchParams.reg) redirect(`/e/${params.slug}`);

  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { eventPageTitle, event } = resolved;
  const eventPage = { title: eventPageTitle ?? '' };

  const { data: agendaSessions } = await admin
    .from('attendee_agendas')
    .select('session_id, sessions(id, title, starts_at, session_type)')
    .eq('registration_id', searchParams.reg)
    .order('created_at', { ascending: true });

  // Pre-load any feedback this registration has already submitted so we can show
  // the "already submitted" state and pre-fill the form on edit.
  const { data: existingFeedback } = await admin
    .from('event_feedback')
    .select('overall_rating, highlights, comment')
    .eq('registration_id', searchParams.reg)
    .eq('event_id', event.id)
    .maybeSingle();

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <div className="max-w-[680px] mx-auto px-5 py-10">
        <FeedbackClient
          eventId={event.id}
          eventTitle={eventPage.title}
          registrationId={searchParams.reg}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          attendedSessions={(agendaSessions ?? []).map(r => r.sessions).filter(Boolean) as any}
          existingFeedback={existingFeedback ?? null}
        />
      </div>
    </div>
  );
}
