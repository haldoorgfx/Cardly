export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EventSeriesClient } from '@/components/events/EventSeriesClient';

export async function generateMetadata() {
  return { title: 'Event Series' };
}

export default async function SeriesPage({ params }: { params: Promise<{ id: string }> }) {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  const { data: series } = await adminAny
    .from('event_series')
    .select('*, event_series_instances(id, event_id, scheduled_date, status, registrations_count, events(name, status))')
    .eq('parent_event_id', id)
    .maybeSingle();

  return (
    <EventSeriesClient
      eventId={id}
      eventName={event.name}
      eventSlug={event.slug}
      series={series}
    />
  );
}
