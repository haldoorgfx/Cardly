export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { formatEventDateRange, formatMinPrice } from '@/lib/events/format';
import { PublicEventPageClient } from '@/components/events/PublicEventPageClient';
import { geocodeAddress } from '@/lib/events/geocode';
import { ensurePublicEventPage } from '@/lib/events/resolvePublicSlug';
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
  searchParams: { preview?: string; event_id?: string; tab?: string; reg?: string };
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
    .select('id, name, status')
    .eq('slug', slug)
    .maybeSingle();
  if (!event) return null;

  const { data: byEventSlug } = await admin
    .from('event_pages')
    .select('*')
    .eq('event_id', event.id)
    .eq('is_public', true)
    .maybeSingle();
  if (byEventSlug) return byEventSlug;

  // Self-heal: published event with no public page → create one, then load it
  if (event.status === 'published') {
    await ensurePublicEventPage(event.id, event.name);
    const { data: healed } = await admin
      .from('event_pages')
      .select('*')
      .eq('event_id', event.id)
      .eq('is_public', true)
      .maybeSingle();
    return healed ?? null;
  }

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await resolveEventPage(params.slug);
  if (!page) return { title: 'Event' };
  return {
    title: page.seo_title ?? page.title,
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

  const [ticketsRes, eventRes] = await Promise.all([
    admin.from('ticket_types').select('*').eq('event_id', page.event_id).eq('is_visible', true).order('position'),
    admin.from('events').select('user_id').eq('id', page.event_id).single(),
  ]);

  const allTickets = ticketsRes.data ?? [];
  const organizerUserId = eventRes.data?.user_id ?? null;
  const { date, time, endTime } = formatEventDateRange(page.starts_at, page.ends_at, page.timezone);

  let organizerAvatarUrl: string | null = page.organizer_avatar_url ?? null;
  let organizerCity: string | null = null;
  if (organizerUserId) {
    const { data: organizerProfile } = await admin
      .from('profiles').select('avatar_url, city').eq('id', organizerUserId).single();
    organizerAvatarUrl = organizerAvatarUrl ?? organizerProfile?.avatar_url ?? null;
    organizerCity = organizerProfile?.city ?? null;
  }

  const minPrice = formatMinPrice(allTickets);
  const registrationSlug = params.slug;
  const isPreview = searchParams.preview === '1';
  const editorEventId = searchParams.event_id ?? null;
  const initialTab = searchParams.tab ?? 'overview';

  let seriesSlug: string | null = null;
  if (page.series_id) {
    const { data: series } = await admin.from('event_series').select('slug').eq('id', page.series_id).single();
    seriesSlug = series?.slug ?? null;
  }

  // Check if the current logged-in user has saved this event
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let initialSaved = false;
  if (user) {
    const { data: saveRow } = await supabase
      .from('saved_events')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_page_id', page.id)
      .maybeSingle();
    initialSaved = !!saveRow;
  }

  // Resolve the viewer's registration for this event so the Network tab can
  // load the directory + AI matches + connections. Prefer an explicit ?reg=
  // link (matches the messaging page), else fall back to the logged-in user's
  // confirmed registration on this event.
  let viewerRegistrationId: string | null = searchParams.reg ?? null;
  if (!viewerRegistrationId && user) {
    const { data: ownReg } = await admin
      .from('registrations')
      .select('id')
      .eq('event_id', page.event_id)
      .eq('user_id', user.id)
      .in('status', ['confirmed', 'checked_in'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    viewerRegistrationId = ownReg?.id ?? null;
  }

  // Fetch all section data in parallel — no limits, full fields
  const [sessionsRes, speakersRes, sponsorsRes, regRes] = await Promise.all([
    admin.from('sessions')
      .select('id, title, starts_at, ends_at, room, session_type, description')
      .eq('event_id', page.event_id)
      .eq('is_published', true)
      .order('starts_at'),
    admin.from('speakers')
      .select('*')
      .eq('event_id', page.event_id)
      .order('is_featured', { ascending: false })
      .order('position'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('sponsors')
      .select('id, company_name, tagline, logo_url, website_url, tier, position')
      .eq('event_id', page.event_id)
      .eq('is_visible', true)
      .order('position'),
    admin.from('registrations')
      .select('attendee_name, user_id', { count: 'exact' })
      .eq('event_id', page.event_id)
      .in('status', ['confirmed', 'checked_in'])
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const sessions = sessionsRes.data ?? [];
  const speakers = speakersRes.data ?? [];
  const sponsors = sponsorsRes.data ?? [];
  const regList = regRes.data ?? [];
  const attendeeCount = regRes.count ?? 0;

  const userIds = regList.map(r => r.user_id).filter((v): v is string => !!v);
  const avatarByUser: Record<string, string> = {};
  if (userIds.length) {
    const { data: avatarProfiles } = await admin.from('profiles').select('id, avatar_url').in('id', userIds);
    for (const p of avatarProfiles ?? []) {
      if (p.avatar_url) avatarByUser[p.id] = p.avatar_url;
    }
  }
  const attendees = regList.map(r => ({
    name: r.attendee_name,
    avatarUrl: r.user_id ? avatarByUser[r.user_id] ?? null : null,
  }));

  let venueLat = page.venue_lat as number | null;
  let venueLng = page.venue_lng as number | null;
  if (!page.is_online && (venueLat == null || venueLng == null)) {
    const venueQuery =
      page.venue_address?.trim() ||
      [page.venue_name, page.city, page.country].filter(Boolean).join(', ');
    const coords = venueQuery ? await geocodeAddress(venueQuery) : null;
    if (coords) {
      venueLat = coords.lat;
      venueLng = coords.lng;
      await admin.from('event_pages').update({ venue_lat: coords.lat, venue_lng: coords.lng }).eq('id', page.id);
    } else {
      const fallbackQuery = [organizerCity, page.country].filter(Boolean).join(', ');
      const fallback = fallbackQuery ? await geocodeAddress(fallbackQuery) : null;
      if (fallback) { venueLat = fallback.lat; venueLng = fallback.lng; }
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const eventUrl = `${appUrl}/e/${params.slug}`;
  // schema.org/Event structured data → Google event rich results.
  const eventJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: page.title,
    ...(page.starts_at ? { startDate: page.starts_at } : {}),
    ...(page.ends_at ? { endDate: page.ends_at } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: page.is_online
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    ...(page.seo_description || page.tagline
      ? { description: page.seo_description ?? page.tagline }
      : {}),
    ...(page.cover_image_url ? { image: [page.cover_image_url] } : {}),
    url: eventUrl,
    location: page.is_online
      ? { '@type': 'VirtualLocation', url: eventUrl }
      : {
          '@type': 'Place',
          name: page.venue_name ?? page.city ?? 'Venue',
          ...(([page.venue_address, page.city, page.country].filter(Boolean).join(', ')) ||
          undefined
            ? { address: [page.venue_address, page.city, page.country].filter(Boolean).join(', ') }
            : {}),
        },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      {isPreview && editorEventId && (
        <div
          className="sticky top-0 z-50 flex items-center justify-between gap-4 px-5 py-3"
          style={{ background: '#0F1F18', borderBottom: '1px solid rgba(232,197,126,0.15)' }}
        >
          <div className="flex items-center gap-2.5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E8C57E" strokeWidth="2" strokeLinecap="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
            </svg>
            <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Preview as attendee</span>
            <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              — this is how <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{page.title}</strong> appears to the public
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a href={`/events/${editorEventId}/event-page`}
              className="px-4 py-1.5 rounded-lg text-[13px] font-medium transition hover:opacity-80"
              style={{ border: '1px solid rgba(232,197,126,0.4)', color: '#E8C57E' }}>Edit page</a>
            <a href={`/events/${editorEventId}/publish`}
              className="px-4 py-1.5 rounded-lg text-[13px] font-semibold transition hover:opacity-90"
              style={{ background: '#E8C57E', color: '#0F1F18' }}>Publish</a>
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
        eventId={page.event_id}
        viewerRegistrationId={viewerRegistrationId}
        organizerUserId={organizerUserId}
        seriesSlug={seriesSlug}
        seriesName={page.series_name ?? null}
        sessions={sessions}
        speakers={speakers}
        sponsors={sponsors}
        attendees={attendees}
        attendeeCount={attendeeCount}
        organizerAvatarUrl={organizerAvatarUrl}
        venueLat={venueLat}
        venueLng={venueLng}
        initialTab={initialTab}
        initialSaved={initialSaved}
      />
    </>
  );
}
