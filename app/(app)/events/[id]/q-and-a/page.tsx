export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EventManageNav } from '@/components/events/EventManageNav';
import QAModerationClient from '@/components/qa/QAModerationClient';
import type { QAQuestion } from '@/components/qa/QandAClient';

export default async function OrganizerQandAPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  // Verify event ownership
  const { data: event } = await admin
    .from('events')
    .select('id, name')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!event) redirect('/dashboard');

  let questions: QAQuestion[] = [];
  try {
    const { data } = await (admin as any)
      .from('qa_questions')
      .select('id, event_id, session_id, registration_id, question_text, asker_name, is_anonymous, upvotes_count, is_featured, status, created_at')
      .eq('event_id', id)
      .order('upvotes_count', { ascending: false })
      .limit(500) as { data: QAQuestion[] | null };
    questions = data ?? [];
  } catch { /* table may not exist */ }

  let sessions: { id: string; title: string }[] = [];
  try {
    const { data } = await (admin as any)
      .from('sessions')
      .select('id, title')
      .eq('event_id', id)
      .order('starts_at', { ascending: true }) as { data: { id: string; title: string }[] | null };
    sessions = data ?? [];
  } catch { /* table may not exist */ }

  return (
    <div>
      <EventManageNav eventId={id} active="q-and-a" />
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-[1100px]">
        <QAModerationClient
          eventId={id}
          initialQuestions={questions}
          sessions={sessions}
        />
      </div>
    </div>
  );
}
