export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Karta Card' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KartaCardView } from '@/components/events/KartaCardView';

export default async function KartaCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const [
    { data: event },
    { data: allVariants },
    { count: totalCards },
  ] = await Promise.all([
    admin.from('events').select('id, name, slug, status').eq('id', id).eq('user_id', user.id).single(),
    admin.from('event_variants').select('id, background_url, background_width, background_height, zones').eq('event_id', id).order('position' as never),
    admin.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', id).not('karta_card_url', 'is', null),
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
    <KartaCardView
      eventId={id}
      eventName={event.name}
      eventSlug={event.slug}
      eventStatus={event.status}
      totalCards={totalCards ?? 0}
      sharedCards={0}
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
