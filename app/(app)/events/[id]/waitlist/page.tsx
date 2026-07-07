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
    { data: eventPage },
    { data: ticketQtys },
  ] = await Promise.all([
    db.from('events').select('id, name').eq('id', id).eq('user_id', user.id).single(),
    db.from('registrations').select('id, attendee_name, attendee_email, created_at, status, ticket_types(name)')
      .eq('event_id', id).eq('status', 'waitlisted').order('created_at', { ascending: true }),
    db.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', id).in('status', ['confirmed', 'checked_in']),
    db.from('event_pages').select('max_capacity').eq('event_id', id).maybeSingle(),
    db.from('ticket_types').select('quantity').eq('event_id', id),
  ]);

  if (!event) redirect('/dashboard');

  // Total capacity: prefer the event's overall cap; otherwise fall back to the
  // sum of all ticket-type quantities (0 = unlimited/uncapped).
  const summedQty = (ticketQtys ?? []).reduce(
    (sum: number, t: { quantity: number | null }) => sum + (t.quantity ?? 0),
    0,
  );
  const cap = eventPage?.max_capacity ?? summedQty;

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
