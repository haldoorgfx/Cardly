export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { EmbedWidgetsClient } from '@/components/events/EmbedWidgetsClient';

export async function generateMetadata() {
  return { title: 'Embed Widgets' };
}

export default async function EmbedPage({ params }: { params: Promise<{ id: string }> }) {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: page } = await (admin as any)
    .from('event_pages')
    .select('custom_slug')
    .eq('event_id', id)
    .single();

  const publicSlug = page?.custom_slug ?? event.slug;

  return <EmbedWidgetsClient eventId={id} eventName={event.name} slug={publicSlug} status={event.status} />;
}
