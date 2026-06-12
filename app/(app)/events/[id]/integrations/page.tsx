export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { IntegrationsView } from '@/components/events/IntegrationsView';

export const metadata: Metadata = {
  title: 'Integrations',
  description: 'Connect Karta to your tools.',
};

export default async function IntegrationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events').select('id, name').eq('id', id).eq('user_id', user.id).single();
  if (!event) redirect('/dashboard');

  return <IntegrationsView eventId={id} eventName={event.name} />;
}
