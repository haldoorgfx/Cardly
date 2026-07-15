export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { hasCheckInAccess } from '@/lib/rbac/ownership';
import { WalkInClient } from '@/components/check-in/WalkInClient';

export async function generateMetadata() {
  return { title: 'Walk-in Registration' };
}

export default async function WalkInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  if (!(await hasCheckInAccess(user.id, id))) redirect('/dashboard');

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const admin = createAdminClient();
  const [{ data: event }, { data: tickets }, { data: checkinStats }, { data: eventPage }, { count: walkInsToday }] = await Promise.all([
    admin.from('events').select('id, name, slug, status').eq('id', id).single(),
    admin.from('ticket_types').select('id, name, price, currency, quantity').eq('event_id', id).eq('is_visible', true).order('position'),
    admin.from('registrations').select('id, status', { count: 'exact', head: false }).eq('event_id', id).in('status', ['confirmed', 'checked_in']),
    admin.from('event_pages').select('max_capacity').eq('event_id', id).maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', id).eq('source', 'walk_in').gte('created_at', todayStart.toISOString()),
  ]);

  if (!event) redirect('/dashboard');

  const checkedIn = (checkinStats ?? []).filter(r => r.status === 'checked_in').length;
  const confirmedCount = checkinStats?.length ?? 0;
  const walkIns = walkInsToday ?? 0;

  return (
    <WalkInClient
      eventId={id}
      eventSlug={event.slug}
      eventName={event.name}
      tickets={tickets ?? []}
      checkedIn={checkedIn}
      walkInsToday={walkIns}
      maxCapacity={eventPage?.max_capacity ?? null}
      confirmedCount={confirmedCount}
    />
  );
}
