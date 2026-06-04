export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CommunicationsView } from '@/components/events/CommunicationsView';

export default async function CommunicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('id, name, slug')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!event) redirect('/dashboard');

  const { count: regCount } = await admin
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', id)
    .in('status', ['confirmed', 'checked_in']);

  return (
    <CommunicationsView
      eventId={id}
      eventName={event.name}
      registrantCount={regCount ?? 0}
    />
  );
}
