export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Settings' };
}

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { EventSettingsView } from '@/components/events/EventSettingsView';

export default async function EventSettingsPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: page } = await admin
    .from('event_pages')
    .select('venue_name, venue_address, venue_lat, venue_lng, city, country, timezone, starts_at, ends_at, max_capacity, is_public, is_online')
    .eq('event_id', id)
    .single();

  // Read fee_bearer defensively — the column exists after migration 040.
  let feeBearer: 'absorb' | 'pass' = 'absorb';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: fb } = await (admin as any).from('events').select('fee_bearer').eq('id', id).single();
  if (fb?.fee_bearer === 'pass') feeBearer = 'pass';

  return (
    <EventSettingsView
      event={{
        id: event.id,
        name: event.name,
        slug: event.slug,
        status: event.status,
        fee_bearer: feeBearer,
        starts_at: page?.starts_at ?? null,
        ends_at: page?.ends_at ?? null,
        max_capacity: page?.max_capacity ?? null,
        is_public: page?.is_public ?? true,
        is_online: page?.is_online ?? false,
        venue_name: page?.venue_name ?? null,
        venue_address: page?.venue_address ?? null,
        venue_lat: page?.venue_lat ?? null,
        venue_lng: page?.venue_lng ?? null,
        city: page?.city ?? null,
        country: page?.country ?? null,
        timezone: page?.timezone ?? 'UTC',
      }}
    />
  );
}
