export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WalkInClient } from '@/components/check-in/WalkInClient';

export async function generateMetadata() {
  return { title: 'Walk-in Registration' };
}

export default async function WalkInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: tickets }, { data: checkinStats }] = await Promise.all([
    admin.from('events').select('id, name, slug, status').eq('id', id).eq('user_id', user.id).single(),
    admin.from('ticket_types').select('id, name, price, currency, quantity').eq('event_id', id).eq('is_visible', true).order('position'),
    admin.from('registrations').select('id, status', { count: 'exact', head: false }).eq('event_id', id).in('status', ['confirmed', 'checked_in']),
  ]);

  if (!event) redirect('/dashboard');

  const checkedIn = (checkinStats ?? []).filter(r => r.status === 'checked_in').length;
  const walkIns = 0; // would track walk-in count separately with a session

  return (
    <WalkInClient
      eventId={id}
      eventName={event.name}
      tickets={tickets ?? []}
      checkedIn={checkedIn}
      walkInsToday={walkIns}
    />
  );
}
