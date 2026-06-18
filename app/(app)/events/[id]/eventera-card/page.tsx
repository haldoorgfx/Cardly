export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Eventera Card' };
}

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { EventeraCardView } from '@/components/events/EventeraCardView';

export default async function EventeraCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    { data: event },
    { data: allVariants },
    { count: totalCards },
    { count: todayCards },
    { count: sharedCards },
  ] = await Promise.all([
    admin.from('events').select('id, name, slug, status').eq('id', id).eq('user_id', user.id).single(),
    admin.from('event_variants').select('id, background_url, background_width, background_height, zones').eq('event_id', id).order('position' as never),
    admin.from('generated_cards').select('id', { count: 'exact', head: true }).eq('event_id', id),
    admin.from('generated_cards').select('id', { count: 'exact', head: true }).eq('event_id', id).gte('created_at', todayStart.toISOString()),
    // Registrations where the attendee completed the card step (proxy for "shared")
    admin.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', id).not('eventera_card_url', 'is', null),
  ]);

  if (!event) redirect('/dashboard');

  const variants = (allVariants ?? []) as {
    id: string;
    background_url: string | null;
    background_width: number | null;
    background_height: number | null;
    zones: unknown;
  }[];

  // Primary variant for the main preview
  const primaryVariant = variants[0] ?? null;

  return (
    <EventeraCardView
      eventId={id}
      eventName={event.name}
      eventSlug={event.slug}
      eventStatus={event.status}
      totalCards={totalCards ?? 0}
      todayCards={todayCards ?? 0}
      sharedCards={sharedCards ?? 0}
      primaryVariant={primaryVariant ? {
        id: primaryVariant.id,
        backgroundUrl: primaryVariant.background_url,
        backgroundWidth: primaryVariant.background_width,
        backgroundHeight: primaryVariant.background_height,
        zonesCount: Array.isArray(primaryVariant.zones) ? (primaryVariant.zones as unknown[]).length : 0,
      } : null}
      allVariants={variants.map((v, i) => ({
        id: v.id,
        position: i,
        backgroundUrl: v.background_url,
        zonesCount: Array.isArray(v.zones) ? (v.zones as unknown[]).length : 0,
      }))}
    />
  );
}
