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

  const { data: event } = await db
    .from('events').select('id, name').eq('id', id).eq('user_id', user.id).single();
  if (!event) redirect('/dashboard');

  // WHY this reads waitlist_entries and not registrations.status='waitlisted':
  // the public "Join waitlist" form (POST /api/events/[id]/waitlist) writes to
  // waitlist_entries keyed by event_page_id, and NOTHING in the product ever
  // writes registrations.status='waitlisted'. Reading that status made this
  // page permanently render "Waitlist is empty" while real people sat queued
  // waiting on an invite the organizer had no way to see or send.
  const { data: eventPage } = await db
    .from('event_pages').select('id, max_capacity').eq('event_id', id).maybeSingle();

  const [{ data: entries }, { count: totalRegs }, { data: ticketQtys }] = await Promise.all([
    eventPage?.id
      ? db.from('waitlist_entries')
          .select('id, name, email, status, notified_at, created_at')
          .eq('event_page_id', eventPage.id)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] }),
    db.from('registrations').select('id', { count: 'exact', head: true })
      .eq('event_id', id).in('status', ['confirmed', 'checked_in']),
    db.from('ticket_types').select('quantity').eq('event_id', id),
  ]);

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
      waitlist={entries ?? []}
      totalRegs={totalRegs ?? 0}
      capacity={cap}
    />
  );
}
