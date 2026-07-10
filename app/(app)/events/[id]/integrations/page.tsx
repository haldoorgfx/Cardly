export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { IntegrationsView } from '@/components/events/IntegrationsView';

export const metadata: Metadata = {
  title: 'Integrations',
  description: 'Connect Eventera to your tools.',
};

export default async function IntegrationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events').select('id, name').eq('id', id).eq('user_id', user.id).single();
  if (!event) redirect('/dashboard');

  return <IntegrationsView eventId={id} eventName={event.name} />;
}
