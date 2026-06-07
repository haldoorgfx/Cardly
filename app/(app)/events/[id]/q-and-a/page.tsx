export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import QAModerationClient from '@/components/qa/QAModerationClient';

interface Props { params: { id: string } }

export default async function QAModerationPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: sessions }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', params.id).eq('user_id', user.id).single(),
    admin.from('sessions').select('id, title').eq('event_id', params.id).eq('is_published', true).order('starts_at', { ascending: true }),
  ]);

  if (!event) redirect('/dashboard');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: questions } = await (admin as any)
    .from('qa_questions')
    .select('*, registrations(attendee_name)')
    .eq('event_id', params.id)
    .order('upvotes_count', { ascending: false })
    .order('created_at', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: polls } = await (admin as any)
    .from('polls')
    .select('*, poll_options(id, text, votes_count, position)')
    .eq('event_id', params.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="px-6 py-6">
        <div className="mb-5">
          <h1 className="font-display font-semibold text-[22px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>Q&amp;A Moderation</h1>
          <p className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>Feature, answer, or hide questions in real time.</p>
        </div>
        <QAModerationClient
          eventId={params.id}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialQuestions={(questions ?? []) as any}
          sessions={(sessions ?? []) as { id: string; title: string }[]}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialPolls={(polls ?? []) as any}
        />
      </div>
    </div>
  );
}
