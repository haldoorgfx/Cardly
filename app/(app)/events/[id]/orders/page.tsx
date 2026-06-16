export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Orders' };
}

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OrdersClient } from '@/components/events/OrdersClient';
import { resolveEventRef } from '@/lib/events/resolveEventRef';

interface Props { params: Promise<{ id: string }> }

export default async function OrdersPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: orders }] = await Promise.all([
    admin.from('events').select('id, name').eq('id', id).eq('user_id', user.id).single(),
    admin
      .from('registrations')
      .select('id, attendee_name, attendee_email, attendee_phone, status, payment_status, amount_paid, currency, ticket_type_id, created_at, ticket_types(name)')
      .eq('event_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (!event) redirect('/dashboard');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <OrdersClient eventId={id} orders={(orders ?? []) as any} />;
}
