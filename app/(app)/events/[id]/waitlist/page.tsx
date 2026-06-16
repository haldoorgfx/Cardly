export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { WaitlistClient } from '@/components/events/WaitlistClient';

interface Props { params: Promise<{ id: string }> }

export default async function WaitlistPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const [
    { data: event },
    { data: waitlist },
    { count: totalRegs },
    { count: maxCapacity },
  ] = await Promise.all([
    db.from('events').select('id, name').eq('id', id).eq('user_id', user.id).single(),
    db.from('registrations').select('id, attendee_name, attendee_email, created_at, status, ticket_types(name)')
      .eq('event_id', id).eq('status', 'waitlisted').order('created_at', { ascending: true }),
    db.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', id).in('status', ['confirmed', 'checked_in']),
    db.from('ticket_types').select('cap', { count: 'exact', head: false }).eq('event_id', id),
  ]);

  if (!event) redirect('/dashboard');

  // Sum all ticket type caps for total capacity
  const cap = maxCapacity ?? 0;

  return (
    <WaitlistClient
      eventId={id}
      eventName={event.name}
      waitlist={waitlist ?? []}
      totalRegs={totalRegs ?? 0}
      capacity={cap}
    />
  );
}
