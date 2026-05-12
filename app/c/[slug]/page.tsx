import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import AttendeeClient from './AttendeeClient';
import type { Zone } from '@/types/database';

export default async function AttendeePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: event } = await admin
    .from('events')
    .select('id, name, slug, background_url, background_width, background_height, zones, status, view_count')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!event) notFound();

  // Increment view count (fire-and-forget)
  admin
    .from('events')
    .update({ view_count: (event.view_count ?? 0) + 1 })
    .eq('id', event.id)
    .then(() => {});

  return (
    <AttendeeClient
      eventId={event.id}
      eventName={event.name}
      backgroundUrl={event.background_url ?? ''}
      backgroundWidth={event.background_width ?? 1080}
      backgroundHeight={event.background_height ?? 1350}
      zones={(event.zones as unknown as Zone[]) ?? []}
    />
  );
}
