export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EventManageNav } from '@/components/events/EventManageNav';
import PollsManagerClient from '@/components/polls/PollsManagerClient';
import type { Poll } from '@/components/polls/PollsClient';

export default async function OrganizerPollsPage({ params }: { params: Promise<{ id: string }> }) {
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

  let polls: Poll[] = [];
  try {
    const { data } = await (admin as any)
      .from('polls')
      .select('id, event_id, question, is_active, is_closed, total_votes, created_at, poll_options(id, poll_id, text, votes_count, position)')
      .eq('event_id', id)
      .order('created_at', { ascending: false }) as { data: any[] | null };

    if (data) {
      polls = data.map((p) => ({
        ...p,
        options: p.poll_options ?? [],
      }));
    }
  } catch { /* table may not exist yet */ }

  return (
    <div>
      <EventManageNav eventId={id} active="polls" />
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-[800px]">
        <PollsManagerClient eventId={id} initialPolls={polls} />
      </div>
    </div>
  );
}
