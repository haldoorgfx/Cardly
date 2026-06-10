export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicNav } from '@/components/events/PublicNav';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const admin = createAdminClient();
  const { data } = await admin.from('event_series').select('name, description').eq('slug', params.slug).single();
  if (!data) return {};
  return {
    title: `${data.name} — Karta`,
    description: data.description ?? `All events in the ${data.name} series.`,
  };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function SeriesPage({ params }: Props) {
  const admin = createAdminClient();

  const { data: series } = await admin
    .from('event_series')
    .select('id, name, slug, description, organizer_id, profiles!organizer_id(full_name, avatar_url)')
    .eq('slug', params.slug)
    .single();

  if (!series) notFound();

  const { data: pages } = await admin
    .from('event_pages')
    .select('id, title, cover_image_url, starts_at, city, is_online, price_from, custom_slug, events(slug, user_id)')
    .eq('series_id', series.id)
    .eq('is_public', true)
    .order('starts_at', { ascending: true });

  const events = pages ?? [];
  const upcoming = events.filter(e => new Date(e.starts_at) >= new Date());
  const past = events.filter(e => new Date(e.starts_at) < new Date());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const organizer = (series as any).profiles;

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav />
      <div className="max-w-[1120px] mx-auto px-5 py-10 pb-24">

        {/* Breadcrumb */}
        <nav className="text-[12px] mb-4" style={{ color: '#6B7A72' }}>
          <Link href="/events" style={{ color: '#6B7A72' }}>Events</Link>
          {' / '}
          <span style={{ color: '#0F1F18' }}>Series</span>
        </nav>

        {/* Hero */}
        <div
          className="rounded-2xl px-6 py-10 mb-10 relative overflow-hidden"
          style={{ background: '#1F4D3A', border: '1px solid #163828' }}
        >
          <div
            className="absolute inset-0 opacity-10 pointer-events-none rounded-2xl"
            style={{ backgroundImage: 'radial-gradient(circle, #E8C57E 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          />
          <div className="relative">
            <div
              className="text-[11px] font-medium mb-3 tracking-widest uppercase"
              style={{ color: '#E8C57E', fontFamily: '"JetBrains Mono", monospace' }}
            >
              Event series
            </div>
            <h1
              className="font-display font-semibold mb-2"
              style={{ fontSize: 'clamp(24px,4vw,38px)', color: '#FFFFFF', letterSpacing: '-0.025em' }}
            >
              {series.name}
            </h1>
            {series.description && (
              <p className="text-[14px] mb-4 max-w-xl" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                {series.description}
              </p>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: '"JetBrains Mono", monospace' }}>
                {events.length} event{events.length !== 1 ? 's' : ''}
              </span>
              {organizer?.full_name && (
                <Link
                  href={`/o/${series.organizer_id}`}
                  className="text-[13px] hover:opacity-80 transition-opacity"
                  style={{ color: '#E8C57E' }}
                >
                  by {organizer.full_name} →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming events */}
        {upcoming.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display font-semibold text-[20px] mb-5" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
              Upcoming
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map(ep => <SeriesEventCard key={ep.id} page={ep} />)}
            </div>
          </section>
        )}

        {/* Past events */}
        {past.length > 0 && (
          <section>
            <h2 className="font-display font-semibold text-[20px] mb-5" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
              Past events
            </h2>
            <div className="grid gap-3">
              {past.map(ep => <SeriesPastRow key={ep.id} page={ep} />)}
            </div>
          </section>
        )}

        {events.length === 0 && (
          <div className="rounded-2xl py-20 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <div className="font-medium text-[15px] mb-1" style={{ color: '#0F1F18' }}>No events yet</div>
            <div className="text-[13px]" style={{ color: '#6B7A72' }}>Events will appear here when they&apos;re published.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveSlug(ep: any): string {
  return ep.custom_slug ?? ep.events?.slug ?? ep.id;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SeriesEventCard({ page }: { page: any }) {
  const slug = resolveSlug(page);
  const price = page.price_from === 0 ? 'Free' : page.price_from != null ? `From $${page.price_from}` : null;
  return (
    <Link
      href={`/e/${slug}`}
      className="block rounded-2xl overflow-hidden transition hover:shadow-lg"
      style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}
    >
      <div className="relative overflow-hidden" style={{ paddingTop: '56.25%' }}>
        {page.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={page.cover_image_url} alt={page.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }} />
        )}
      </div>
      <div className="p-4">
        <div className="text-[11px] font-medium mb-1" style={{ color: '#C9A45E', fontFamily: '"JetBrains Mono", monospace' }}>
          {fmtDate(page.starts_at)}
        </div>
        <div className="font-display font-medium text-[15px] leading-snug mb-1" style={{ color: '#0F1F18' }}>
          {page.title}
        </div>
        <div className="flex items-center justify-between gap-2 mt-2">
          <span className="text-[12px] truncate" style={{ color: '#6B7A72' }}>
            {page.is_online ? 'Online' : (page.city ?? 'Location TBA')}
          </span>
          {price && (
            <span className="text-[12px] font-semibold shrink-0" style={{ color: page.price_from === 0 ? '#C9A45E' : '#1F4D3A', fontFamily: '"JetBrains Mono", monospace' }}>
              {price}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SeriesPastRow({ page }: { page: any }) {
  const slug = resolveSlug(page);
  return (
    <Link
      href={`/e/${slug}`}
      className="flex items-center gap-4 rounded-xl px-4 py-3 transition hover:border-[#1F4D3A]"
      style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}
    >
      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
        {page.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={page.cover_image_url} alt={page.title} className="w-full h-full object-cover opacity-70" />
        ) : (
          <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #3A4A42, #6B7A72)' }} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium truncate" style={{ color: '#3A4A42' }}>{page.title}</div>
        <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72', fontFamily: '"JetBrains Mono", monospace' }}>
          {fmtDate(page.starts_at)} · {page.is_online ? 'Online' : (page.city ?? '')}
        </div>
      </div>
      <span className="text-[12px] shrink-0" style={{ color: '#6B7A72', fontFamily: '"JetBrains Mono", monospace' }}>Past</span>
    </Link>
  );
}
