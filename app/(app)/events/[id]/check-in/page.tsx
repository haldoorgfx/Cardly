export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Check-in' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import CheckInDashboard from '@/components/check-in/CheckInDashboard';

interface Props { params: Promise<{ id: string }> }

export type RecentCheckin = {
  id: string;
  attendee_name: string | null;
  ticket_type: string | null;
  checked_in_at: string | null;
};

export default async function CheckInPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const { data: event } = await admin
    .from('events')
    .select('id, name, slug, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!event) redirect('/dashboard');

  const [{ count: totalCount }, { count: checkedInCount }, { data: recentRaw }] = await Promise.all([
    admin.from('registrations').select('*', { count: 'exact', head: true })
      .eq('event_id', id).in('status', ['confirmed', 'checked_in']),
    admin.from('registrations').select('*', { count: 'exact', head: true })
      .eq('event_id', id).eq('status', 'checked_in'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('registrations')
      .select('id, attendee_name, checked_in_at, ticket_types(name)')
      .eq('event_id', id).eq('status', 'checked_in')
      .order('checked_in_at', { ascending: false }).limit(10),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentCheckins: RecentCheckin[] = ((recentRaw ?? []) as any[]).map((r) => ({
    id: r.id,
    attendee_name: r.attendee_name ?? null,
    ticket_type: r.ticket_types?.name ?? null,
    checked_in_at: r.checked_in_at ?? null,
  }));

  return (
    <CheckInDashboard
      eventId={event.id}
      eventName={event.name}
      eventStatus={event.status}
      totalRegistrations={totalCount ?? 0}
      initialCheckedIn={checkedInCount ?? 0}
      recentCheckins={recentCheckins}
    />
  );
}
