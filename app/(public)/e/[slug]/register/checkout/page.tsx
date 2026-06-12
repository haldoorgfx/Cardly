export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { CheckoutClient } from '@/components/registration/CheckoutClient';

interface Props { params: Promise<{ slug: string }> }

export default async function CheckoutPage({ params }: Props) {
  const { slug } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  let ep = null;
  const { data: byCustom } = await db.from('event_pages')
    .select('id, title, cover_image_url, starts_at, venue_name, city, events!inner(id, name, slug, status)')
    .eq('custom_slug', slug).maybeSingle();
  ep = byCustom;
  if (!ep) {
    const { data: bySlug } = await db.from('event_pages')
      .select('id, title, cover_image_url, starts_at, venue_name, city, events!inner(id, name, slug, status)')
      .eq('events.slug', slug).maybeSingle();
    ep = bySlug;
  }

  if (!ep || ep.events?.status !== 'published') notFound();

  const { data: tickets } = await db.from('ticket_types')
    .select('id, name, price, currency').eq('event_id', ep.events.id)
    .eq('is_visible', true).order('price');

  return (
    <CheckoutClient
      eventName={ep.title ?? ep.events.name}
      eventSlug={slug}
      coverImage={ep.cover_image_url}
      startsAt={ep.starts_at}
      venueName={ep.venue_name}
      city={ep.city}
      tickets={tickets ?? []}
    />
  );
}
