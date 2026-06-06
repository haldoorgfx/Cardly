export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BadgesClient } from '@/components/events/BadgesClient';

interface Props { params: Promise<{ id: string }> }

export default async function BadgesPage({ params }: Props) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [
    { data: event },
    { data: ticketTypes },
    { count: regCount },
  ] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single(),
    admin.from('ticket_types').select('id, name').eq('event_id', id),
    admin.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', id).in('status', ['confirmed', 'checked_in']),
  ]);

  if (!event) redirect('/dashboard');

  return (
    <BadgesClient
      eventId={id}
      eventName={event.name}
      ticketTypes={ticketTypes ?? []}
      regCount={regCount ?? 0}
    />
  );
}
