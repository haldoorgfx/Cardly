export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EventSettingsView } from '@/components/events/EventSettingsView';

export default async function EventSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('id, name, slug, status, starts_at, ends_at, max_capacity, is_public')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!event) redirect('/dashboard');

  const { data: eventPage } = await admin
    .from('event_pages')
    .select('venue_name, timezone')
    .eq('event_id', id)
    .single();

  return (
    <EventSettingsView
      event={{
        id: event.id,
        name: event.name,
        slug: event.slug,
        status: event.status,
        starts_at: event.starts_at,
        ends_at: event.ends_at,
        max_capacity: event.max_capacity,
        is_public: event.is_public,
        venue_name: eventPage?.venue_name ?? null,
        timezone: eventPage?.timezone ?? 'UTC',
      }}
    />
  );
}
