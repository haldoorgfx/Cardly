export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OrdersClient } from '@/components/events/OrdersClient';

interface Props { params: Promise<{ id: string }> }

export default async function OrdersPage({ params }: Props) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: orders }] = await Promise.all([
    admin.from('events').select('id, name').eq('id', id).eq('user_id', user.id).single(),
    admin
      .from('registrations')
      .select('id, attendee_name, attendee_email, status, amount_paid, currency, ticket_type_id, created_at, ticket_types(name)')
      .eq('event_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (!event) redirect('/dashboard');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <OrdersClient orders={(orders ?? []) as any} />;
}
