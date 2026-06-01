export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EventManageNav } from '@/components/events/EventManageNav';
import PollsManagerClient from '@/components/polls/PollsManagerClient';

interface Props { params: { id: string } }

export default async function PollsManagerPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id, name, slug').eq('id', params.id).eq('user_id', user.id).single();
  if (!event) redirect('/dashboard');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: polls } = await (admin as any)
    .from('polls')
    .select('*, poll_options(id, text, votes_count, position)')
    .eq('event_id', params.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <EventManageNav eventId={params.id} eventName={event.name} active="polls" />
      <div className="max-w-[800px] mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>Polls</h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>Create and launch live polls during sessions.</p>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <PollsManagerClient eventId={params.id} initialPolls={(polls ?? []) as any} />
      </div>
    </div>
  );
}
