export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { PublicNav } from '@/components/events/PublicNav';
import QandAClient from '@/components/qa/QandAClient';
import type { QAQuestion } from '@/components/qa/QandAClient';

interface Props {
  params: { slug: string };
  searchParams: { reg?: string };
}

interface EventPageRow {
  id: string;
  title: string;
  event_id: string;
}

export default async function QandAPage({ params, searchParams }: Props) {
  const { slug } = params;
  const regParam = searchParams.reg ?? null;

  const admin = createAdminClient();

  const { data: eventPage } = await (admin as any)
    .from('event_pages')
    .select('id, title, event_id')
    .eq('custom_slug', slug)
    .single() as { data: EventPageRow | null };

  if (!eventPage) notFound();

  // Fetch questions (exclude hidden for public)
  let questions: QAQuestion[] = [];
  try {
    const { data } = await (admin as any)
      .from('qa_questions')
      .select('id, event_id, session_id, registration_id, question_text, asker_name, is_anonymous, upvotes_count, is_featured, status, created_at')
      .eq('event_id', eventPage.event_id)
      .neq('status', 'hidden')
      .order('upvotes_count', { ascending: false })
      .limit(200) as { data: QAQuestion[] | null };
    questions = data ?? [];
  } catch { /* table may not exist yet */ }

  // Fetch sessions for filter
  let sessions: { id: string; title: string }[] = [];
  try {
    const { data } = await (admin as any)
      .from('sessions')
      .select('id, title')
      .eq('event_id', eventPage.event_id)
      .eq('is_published', true)
      .order('starts_at', { ascending: true }) as { data: { id: string; title: string }[] | null };
    sessions = data ?? [];
  } catch { /* table may not exist */ }

  return (
    <div className="min-h-screen" style={{ background: '#FAF6EE' }}>
      <PublicNav eventSlug={slug} eventTitle={eventPage.title} />
      <main className="max-w-[700px] mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display font-medium" style={{ fontSize: 28, color: '#1F4D3A' }}>
            Q&amp;A
          </h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
            Ask the speakers a question
          </p>
        </div>
        <QandAClient
          eventId={eventPage.event_id}
          registrationId={regParam}
          initialQuestions={questions}
          sessions={sessions}
        />
      </main>
    </div>
  );
}
