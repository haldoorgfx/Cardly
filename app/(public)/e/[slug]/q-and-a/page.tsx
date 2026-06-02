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
  const { eventPageTitle, event } = resolved;
  const eventPage = { title: eventPageTitle };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: questions } = await (admin as any)
    .from('qa_questions')
    .select('*, registrations(attendee_name)')
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
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav eventSlug={params.slug} eventName={event.name} />
      <div className="max-w-[760px] mx-auto px-5 py-10">
        <div className="mb-8">
          <h1 className="font-display font-normal text-[32px]" style={{ color: '#1F4D3A', letterSpacing: '-0.025em' }}>
            Q&amp;A
          </h1>
          <p className="text-[16px] mt-2" style={{ color: '#6B7A72' }}>{eventPage.title}</p>
        </div>
        <QandAClient
          eventId={event.id}
          registrationId={searchParams.reg ?? null}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialQuestions={(questions ?? []) as any}
          sessions={(sessions ?? []) as { id: string; title: string }[]}
        />
      </div>
    </div>
  );
}
