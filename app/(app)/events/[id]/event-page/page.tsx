export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EventManageNav } from '@/components/events/EventManageNav';
import { EventPageEditor } from '@/components/events/EventPageEditor';

interface Props { params: { id: string } }

export default async function EventPageEditorPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('id, name, slug')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();
  if (!event) redirect('/dashboard');

  const { data: existing } = await admin
    .from('event_pages')
    .select('*')
    .eq('event_id', params.id)
    .single();

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <EventManageNav eventId={params.id} eventName={event.name} active="event-page" />
      <EventPageEditor
        eventId={params.id}
        eventSlug={event.slug}
        existing={existing ?? null}
      />
    </div>
  );
}
