export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Event Page' };
}

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { EventPageEditor } from '@/components/events/EventPageEditor';
import { getUserPlan } from '@/lib/billing/can';

interface Props { params: Promise<{ id: string }> }

export default async function EventPageEditorPage({ params }: Props) {
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
    .select('id, name, slug')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (!event) redirect('/dashboard');

  const [{ data: existing }, plan] = await Promise.all([
    admin.from('event_pages').select('*').eq('event_id', id).single(),
    getUserPlan(user.id),
  ]);

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <EventPageEditor
        eventId={id}
        eventSlug={event.slug}
        eventName={event.name}
        existing={existing ?? null}
        plan={plan}
      />
    </div>
  );
}
