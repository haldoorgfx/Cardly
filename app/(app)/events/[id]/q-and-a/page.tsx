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

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display font-semibold text-[24px]" style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}>Q&amp;A &amp; Polls</h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>Moderate live questions from attendees.</p>
        </div>
        <QAModerationClient
          eventId={params.id}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialQuestions={(questions ?? []) as any}
          sessions={(sessions ?? []) as { id: string; title: string }[]}
        />
      </div>
    </div>
  );
}
