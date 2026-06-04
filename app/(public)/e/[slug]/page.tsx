export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { formatEventDateRange, formatMinPrice } from '@/lib/events/format';
import { PublicEventPageClient } from '@/components/events/PublicEventPageClient';
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
  searchParams: { preview?: string; event_id?: string };
}

async function resolveEventPage(slug: string) {
  const admin = createAdminClient();

  // 1. Try custom_slug first
  const { data: byCustomSlug } = await admin
    .from('event_pages')
    .select('*')
    .eq('custom_slug', slug)
    .eq('is_public', true)
    .single();
  if (byCustomSlug) return byCustomSlug;

  // 2. Fallback: look up events.slug → event_pages
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

export default async function PublicEventPage({ params, searchParams }: Props) {
  const page = await resolveEventPage(params.slug);
  if (!page) notFound();

  const admin = createAdminClient();
  const { data: tickets } = await admin
    .from('ticket_types')
    .select('*')
    .eq('event_id', page.event_id)
    .eq('is_visible', true)
    .order('position');

  const allTickets = tickets ?? [];
  const { date, time, endTime } = formatEventDateRange(page.starts_at, page.ends_at, page.timezone);
  const minPrice = formatMinPrice(allTickets);
  const registrationSlug = params.slug;
  const isPreview = searchParams.preview === '1';
  const editorEventId = searchParams.event_id ?? null;

  return (
    <>
      {/* Preview bar — shown when organizer clicks "Preview" in event-page editor */}
      {isPreview && editorEventId && (
        <div
          className="sticky top-0 z-50 flex items-center justify-between gap-4 px-5 py-3"
          style={{ background: '#0F1F18', borderBottom: '1px solid rgba(232,197,126,0.15)' }}
        >
          <div className="flex items-center gap-2.5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E8C57E" strokeWidth="2" strokeLinecap="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Preview as attendee
            </span>
            <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              — this is how <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{page.title}</strong> appears to the public
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/events/${editorEventId}/event-page`}
              className="px-4 py-1.5 rounded-lg text-[13px] font-medium transition hover:opacity-80"
              style={{ border: '1px solid rgba(232,197,126,0.4)', color: '#E8C57E' }}
            >
              Edit page
            </a>
            <a
              href={`/events/${editorEventId}/publish`}
              className="px-4 py-1.5 rounded-lg text-[13px] font-semibold transition hover:opacity-90"
              style={{ background: '#E8C57E', color: '#0F1F18' }}
            >
              Publish
            </a>
          </div>
        </div>
      )}
      <PublicEventPageClient
        page={page}
        tickets={allTickets}
        dateStr={date}
        timeStr={time}
        endTimeStr={endTime}
        minPrice={minPrice}
        registrationSlug={registrationSlug}
      />
    </>
  );
}
