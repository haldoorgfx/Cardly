export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Communications' };
}

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { CommunicationsView } from '@/components/events/CommunicationsView';
import { getUserPlan } from '@/lib/billing/can';

export default async function CommunicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { count: registrantCount }, plan] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single(),
    admin.from('registrations').select('id', { count: 'exact', head: true })
      .eq('event_id', id).in('status', ['confirmed', 'checked_in']),
    getUserPlan(user.id),
  ]);
  if (!event) redirect('/dashboard');

  return (
    <CommunicationsView
      eventId={id}
      eventName={event.name}
      registrantCount={registrantCount ?? 0}
      plan={plan}
    />
  );
}
