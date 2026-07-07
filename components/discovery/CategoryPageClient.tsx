'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Globe, Calendar, SlidersHorizontal } from 'lucide-react';
import { PublicNav } from '@/components/events/PublicNav';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventPage = any;

interface Props {
  category: string;
  events: EventPage[];
}

const CATEGORY_LABELS: Record<string, string> = {
  tech: 'Tech', business: 'Business', arts: 'Arts & Culture', music: 'Music',
  sports: 'Sports & Fitness', food: 'Food & Drink', wellness: 'Wellness',
  education: 'Education', community: 'Community', networking: 'Networking',
  fintech: 'Fintech', design: 'Design',
};

const RELATED_CATEGORIES: Record<string, string[]> = {
  tech: ['fintech', 'design', 'education'],
  fintech: ['tech', 'business', 'networking'],
  design: ['tech', 'arts', 'education'],
  business: ['networking', 'fintech', 'education'],
  arts: ['music', 'community', 'design'],
  music: ['arts', 'community', 'food'],
  default: ['tech', 'business', 'arts'],
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getSlug(ep: EventPage) { return ep.custom_slug ?? ep.events?.slug ?? ep.id; }
function fmtPrice(p: number | null) { return !p || p === 0 ? 'Free' : `From $${p}`; }

function EventCard({ ep }: { ep: EventPage }) {
  return (
    <Link href={`/e/${getSlug(ep)}`} className="block rounded-2xl overflow-hidden transition hover:shadow-lg"
      style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', textDecoration: 'none' }}>
      <div className="h-36 relative" style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }}>
        {ep.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ep.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-[14px] mb-1.5 line-clamp-2" style={{ color: '#0F1F18' }}>{ep.title}</h3>
        <div className="flex items-center gap-1 text-[12px] mb-1" style={{ color: '#6B7A72' }}>
          <Calendar size={11} />
          {ep.starts_at ? fmtDate(ep.starts_at) : 'Date TBA'}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[12px]" style={{ color: '#6B7A72' }}>
            {ep.is_online ? <Globe size={11} /> : <MapPin size={11} />}
            <span>{ep.is_online ? 'Online' : ep.city ?? 'TBA'}</span>
          </div>
          <span className="text-[12px] font-semibold" style={{ color: '#1F4D3A' }}>{fmtPrice(ep.price_from)}</span>
        </div>
      </div>
    </Link>
  );
}

export function CategoryPageClient({ category, events }: Props) {
  const label = CATEGORY_LABELS[category.toLowerCase()] ?? (category.charAt(0).toUpperCase() + category.slice(1));
  const related = RELATED_CATEGORIES[category.toLowerCase()] ?? RELATED_CATEGORIES.default;

  const [format, setFormat] = useState<'all' | 'in-person' | 'online'>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');

  const filtered = events.filter((ep: EventPage) => {
    if (format === 'in-person' && ep.is_online) return false;
    if (format === 'online' && !ep.is_online) return false;
    if (priceFilter === 'free' && ep.price_from > 0) return false;
    if (priceFilter === 'paid' && (!ep.price_from || ep.price_from === 0)) return false;
    return true;
  });

  const soon = filtered.slice(0, Math.ceil(filtered.length / 2));
  const popular = filtered.slice(Math.ceil(filtered.length / 2));

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav />

      {/* Hero */}
      <div className="px-5 py-10 max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#6B7A72', fontFamily: 'Inter, system-ui, sans-serif' }}>
              Category
            </p>
            <h1 className="font-display font-bold text-[34px]" style={{ color: '#0F1F18', letterSpacing: '-0.03em' }}>
              {label} events
            </h1>
            <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
              {filtered.length} event{filtered.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <div className="flex items-center gap-1 text-[12px] font-semibold mr-1" style={{ color: '#6B7A72' }}>
            <SlidersHorizontal size={13} /> Filter:
          </div>
          {[
            { key: 'all', label: 'All formats' },
            { key: 'in-person', label: 'In person' },
            { key: 'online', label: 'Online' },
          ].map(f => (
            <button key={f.key} onClick={() => setFormat(f.key as 'all' | 'in-person' | 'online')}
              className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition"
              style={{
                background: format === f.key ? '#1F4D3A' : '#FFFFFF',
                color: format === f.key ? '#FAF6EE' : '#3A4A42',
                border: `1px solid ${format === f.key ? '#1F4D3A' : '#E5E0D4'}`,
              }}>
              {f.label}
            </button>
          ))}
          <div className="w-px h-5 mx-1" style={{ background: '#E5E0D4' }} />
          {[
            { key: 'all', label: 'Any price' },
            { key: 'free', label: 'Free' },
            { key: 'paid', label: 'Paid' },
          ].map(f => (
            <button key={f.key} onClick={() => setPriceFilter(f.key as 'all' | 'free' | 'paid')}
              className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition"
              style={{
                background: priceFilter === f.key ? '#1F4D3A' : '#FFFFFF',
                color: priceFilter === f.key ? '#FAF6EE' : '#3A4A42',
                border: `1px solid ${priceFilter === f.key ? '#1F4D3A' : '#E5E0D4'}`,
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Happening soon */}
        {soon.length > 0 && (
          <div className="mb-10">
            <h2 className="font-display font-semibold text-[18px] mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
              Happening soon
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {soon.map((ep: EventPage) => <EventCard key={ep.id} ep={ep} />)}
            </div>
          </div>
        )}

        {/* Popular this month */}
        {popular.length > 0 && (
          <div className="mb-10">
            <h2 className="font-display font-semibold text-[18px] mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
              Popular this month
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {popular.map((ep: EventPage) => <EventCard key={ep.id} ep={ep} />)}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="rounded-2xl py-20 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <p className="text-[15px] font-medium mb-1" style={{ color: '#0F1F18' }}>No events found</p>
            <p className="text-[13px]" style={{ color: '#6B7A72' }}>Try a different filter or check back soon</p>
          </div>
        )}

        {/* Related categories */}
        <div>
          <h2 className="font-display font-semibold text-[16px] mb-3" style={{ color: '#0F1F18' }}>Browse related</h2>
          <div className="flex flex-wrap gap-2">
            {related.map(cat => (
              <Link key={cat} href={`/discover/categories/${cat}`}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold border transition hover:opacity-80"
                style={{ background: '#FFFFFF', borderColor: '#E5E0D4', color: '#3A4A42' }}>
                {CATEGORY_LABELS[cat] ?? cat}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
