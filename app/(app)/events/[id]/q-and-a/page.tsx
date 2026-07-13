export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import QAModerationClient from '@/components/qa/QAModerationClient';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { hasModeratorAccess } from '@/lib/rbac/ownership';
import { PageShell, PageHeader } from '@/components/dash';

interface Props { params: { id: string } }

export default async function QAModerationPage({ params }: Props) {
  const _ev = await resolveEventRef(params.id);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  if (!(await hasModeratorAccess(user.id, id))) redirect('/dashboard');

  const admin = createAdminClient();
  const [{ data: event }, { data: sessions }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).single(),
    admin.from('sessions').select('id, title').eq('event_id', id).eq('is_published', true).order('starts_at', { ascending: true }),
  ]);

  if (!event) redirect('/dashboard');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: questions } = await (admin as any)
    .from('qa_questions')
    .select('*, registrations!qa_questions_registration_id_fkey(attendee_name)')
    .eq('event_id', id)
    .order('upvotes_count', { ascending: false })
    .order('created_at', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: polls } = await (admin as any)
    .from('polls')
    .select('*, poll_options(id, text, votes_count, position)')
    .eq('event_id', id)
    .order('created_at', { ascending: false });

  return (
    <PageShell width="wide">
      <PageHeader title="Q&amp;A Moderation" subtitle="Feature, answer, or hide questions in real time." />
      <QAModerationClient
        eventId={id}
        eventSlug={event.slug}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialQuestions={(questions ?? []) as any}
        sessions={(sessions ?? []) as { id: string; title: string }[]}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialPolls={(polls ?? []) as any}
      />
    </PageShell>
  );
}
