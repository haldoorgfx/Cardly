export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Event Page' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EventPageEditor } from '@/components/events/EventPageEditor';

interface Props { params: Promise<{ id: string }> }

export default async function EventPageEditorPage({ params }: Props) {
  const { id } = await params;
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

  const { data: existing } = await admin
    .from('event_pages')
    .select('*')
    .eq('event_id', id)
    .single();

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <EventPageEditor
        eventId={id}
        eventSlug={event.slug}
        eventName={event.name}
        existing={existing ?? null}
      />
    </div>
  );
}
