export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import AttendeeFlow from './AttendeeFlow';
import VariantPickerClient from './VariantPickerClient';
import type { Zone, Variant } from '@/types/database';

export default async function AttendeePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: event } = await admin
    .from('events')
    .select('id, name, slug, status, view_count')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!event) notFound();

  // Atomic view count increment via RPC (avoids read-modify-write race)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (admin as any).rpc('increment_view_count', { p_event_id: event.id }).then(() => {});

  const { data: variantsData } = await admin
    .from('event_variants')
    .select('*')
    .eq('event_id', event.id)
    .order('position', { ascending: true });

  const variants = (variantsData ?? []) as unknown as Variant[];

  if (variants.length === 0) notFound();

  // Single variant — skip the picker and go straight to the form
  if (variants.length === 1) {
    const v = variants[0];
    return (
      <AttendeeFlow
        variantId={v.id}
        eventName={event.name}
        backgroundUrl={v.background_url ?? ''}
        backgroundWidth={v.background_width ?? 1080}
        backgroundHeight={v.background_height ?? 1350}
        zones={(v.zones as unknown as Zone[]) ?? []}
      />
    );
  }

  // Multiple variants — show the picker
  return (
    <VariantPickerClient
      eventName={event.name}
      eventSlug={event.slug}
      variants={variants}
    />
  );
}
