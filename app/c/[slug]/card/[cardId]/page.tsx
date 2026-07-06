export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import CardRedownload from './CardRedownload';
import { AttendeeBrandProvider } from '@/components/white-label/attendee-brand';
import { getWhiteLabelByEvent } from '@/lib/white-label/server';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string; cardId: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events').select('name').eq('slug', slug).eq('status', 'published').single();
  return {
    title: event ? `Your ${event.name} card` : 'Your card',
    description: 'Download your personalized event card.',
  };
}

export default async function CardPage(
  { params }: { params: Promise<{ slug: string; cardId: string }> }
) {
  const { slug, cardId } = await params;
  const admin = createAdminClient();

  // Verify the event exists and is published
  const { data: event } = await admin
    .from('events')
    .select('id, name')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!event) notFound();

  // Fetch the card — verify it belongs to this event
  const { data: card } = await admin
    .from('generated_cards')
    .select('id, output_url, attendee_name, created_at')
    .eq('id', cardId)
    .eq('event_id', event.id)
    .single();

  if (!card || !card.output_url) notFound();

  const wl = await getWhiteLabelByEvent(event.id);
  const brand = {
    brandName: wl?.brandName ?? null,
    primaryColor: wl?.primaryColor ?? '#1F4D3A',
    hidePoweredBy: wl?.hidePoweredBy ?? false,
  };

  return (
    <AttendeeBrandProvider value={brand}>
      <CardRedownload
        eventName={event.name}
        attendeeName={card.attendee_name ?? undefined}
        outputUrl={card.output_url}
        createdAt={card.created_at}
      />
    </AttendeeBrandProvider>
  );
}
