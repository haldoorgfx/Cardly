export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { formatEventDateRange, formatMinPrice } from '@/lib/events/format';
import { PublicEventPageClient } from '@/components/events/PublicEventPageClient';
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
}

async function resolveEventPage(slug: string) {
  const admin = createAdminClient();

  const { data: byCustomSlug } = await admin
    .from('event_pages')
    .select('*')
    .eq('custom_slug', slug)
    .eq('is_public', true)
    .single();
  if (byCustomSlug) return byCustomSlug;

  const { data: event } = await admin
    .from('events')
    .select('id')
    .eq('slug', slug)
    .single();
  if (!event) return null;

  const { data: byEventSlug } = await admin
    .from('event_pages')
    .select('*')
    .eq('event_id', event.id)
    .eq('is_public', true)
    .single();
  return byEventSlug ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await resolveEventPage(params.slug);
  if (!page) return { title: 'Event — Karta' };
  return {
    title: page.seo_title ?? `${page.title} — Karta`,
    description: page.seo_description ?? page.tagline ?? undefined,
    openGraph: {
      title: page.seo_title ?? page.title,
      description: page.seo_description ?? page.tagline ?? undefined,
      images: page.cover_image_url ? [{ url: page.cover_image_url }] : [],
    },
  };
}

export default async function PublicEventPage({ params }: Props) {
  const page = await resolveEventPage(params.slug);
  if (!page) notFound();

  const admin = createAdminClient();

  const [
    { data: tickets },
    { data: speakers },
    { data: sessions },
    { data: regCount },
  ] = await Promise.all([
    admin.from('ticket_types').select('*').eq('event_id', page.event_id).eq('is_visible', true).order('position'),
    admin.from('speakers').select('id, name, role, photo_url').eq('event_id', page.event_id).order('position').limit(6),
    admin.from('sessions')
      .select('id, title, starts_at, room, session_speakers(speakers(name))')
      .eq('event_id', page.event_id)
      .eq('is_published', true)
      .order('starts_at')
      .limit(5),
    admin.from('registrations').select('id').eq('event_id', page.event_id).in('status', ['confirmed', 'checked_in']),
  ]);

  const allTickets = tickets ?? [];
  const { date, time, endTime } = formatEventDateRange(page.starts_at, page.ends_at, page.timezone);
  const minPrice = formatMinPrice(allTickets);

  return (
    <PublicEventPageClient
      page={page}
      tickets={allTickets}
      dateStr={date}
      timeStr={time}
      endTimeStr={endTime}
      minPrice={minPrice}
      registrationSlug={params.slug}
      speakers={(speakers ?? []).map(s => ({
        id: s.id,
        name: s.name,
        role: s.role ?? null,
        photoUrl: s.photo_url ?? null,
      }))}
      sessions={(sessions ?? []).map(s => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const firstSpeaker = (s.session_speakers as any)?.[0]?.speakers?.name ?? null;
        return {
          id: s.id,
          title: s.title,
          startsAt: s.starts_at,
          room: s.room ?? null,
          speakerName: firstSpeaker,
        };
      })}
      registrationCount={regCount?.length ?? 0}
    />
  );
}
