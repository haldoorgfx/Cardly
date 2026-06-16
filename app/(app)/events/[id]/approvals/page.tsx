export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { ApprovalsClient } from '@/components/events/ApprovalsClient';

export async function generateMetadata() {
  return { title: 'Approvals' };
}

export default async function ApprovalsPage({ params }: { params: Promise<{ id: string }> }) {
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
    .select('id, name')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!event) redirect('/dashboard');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: regs } = await (admin as any)
    .from('registrations')
    .select('id, attendee_name, attendee_email, attendee_data, created_at, status, ticket_types(name)')
    .eq('event_id', id)
    .in('status', ['pending_approval', 'confirmed', 'rejected'])
    .order('created_at', { ascending: false });

  return <ApprovalsClient eventId={id} eventName={event.name} initialRegs={regs ?? []} />;
}
