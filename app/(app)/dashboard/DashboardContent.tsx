'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus } from 'lucide-react';
import EventCard from './EventCard';
import type { Database } from '@/types/database';

type EventRowType = Database['public']['Tables']['events']['Row'];
type Event = Pick<EventRowType, 'id' | 'name' | 'slug' | 'status' | 'view_count' | 'download_count' | 'updated_at'> & {
  event_pages?: Array<{ starts_at: string | null; venue_name: string | null }> | null;
  event_variants?: Array<{ id: string; background_url: string | null; position: number }> | null;
};
type Filter  = 'all' | 'active' | 'draft' | 'archived';
type SortKey = 'recent' | 'registrations' | 'revenue';

interface Props {
  events:      Event[];
  atLimit:     boolean;
  regsByEvent: Record<string, { count: number; revenue: number; checkedIn: number }>;
  draftCount:  number;
  activeCount: number;
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'active',   label: 'Active' },
  { key: 'draft',    label: 'Draft' },
  { key: 'archived', label: 'Archived' },
];

export default function DashboardContent({ events, atLimit, regsByEvent }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [sort,   setSort]   = useState<SortKey>('recent');

  const counts = {
    all:      events.length,
    active:   events.filter(e => e.status === 'published').length,
    draft:    events.filter(e => e.status === 'draft').length,
    archived: events.filter(e => e.status === 'archived').length,
  };

  const filtered = events
    .filter(e => {
      if (filter === 'all')      return true;
      if (filter === 'active')   return e.status === 'published';
      if (filter === 'draft')    return e.status === 'draft';
      if (filter === 'archived') return e.status === 'archived';
      return true;
    })
    .sort((a, b) => {
      if (sort === 'registrations') return (regsByEvent[b.id]?.count   ?? 0) - (regsByEvent[a.id]?.count   ?? 0);
      if (sort === 'revenue')       return (regsByEvent[b.id]?.revenue ?? 0) - (regsByEvent[a.id]?.revenue ?? 0);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-0.5 p-1 rounded-xl" style={{ background: 'white', border: '1px solid #E5E0D4' }} role="tablist">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              role="tab"
              aria-selected={filter === f.key}
              className="h-7 px-3 rounded-lg text-[12.5px] font-medium transition"
              style={filter === f.key ? { background: '#E8EFEB', color: '#0F1F18' } : { color: '#6B7A72' }}
            >
              {f.label}
              <span className="ml-1.5 font-mono text-[11px]" style={{ color: filter === f.key ? '#3A4A42' : '#6B7A72' }}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          className="h-8 text-[12px] rounded-lg px-2.5 cursor-pointer outline-none"
          style={{ background: 'white', border: '1px solid #E5E0D4', color: '#3A4A42' }}
        >
          <option value="recent">Most recent</option>
          <option value="registrations">Most registrations</option>
          <option value="revenue">Most revenue</option>
        </select>
      </div>

      {/* Empty filter state */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center" style={{ borderColor: '#E5E0D4' }}>
          <div className="mx-auto h-10 w-10 rounded-xl grid place-items-center mb-3" style={{ background: '#E8EFEB' }}>
            <Search size={16} strokeWidth={1.8} color="#1F4D3A" />
          </div>
          <div className="font-display font-semibold text-[14px] text-[#0F1F18]">No events match this filter</div>
          <p className="text-[13px] text-[#6B7A72] mt-1">Switch the filter above.</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                index={i}
                regCount={regsByEvent[event.id]?.count    ?? 0}
                revenue={regsByEvent[event.id]?.revenue   ?? 0}
                checkedIn={regsByEvent[event.id]?.checkedIn ?? 0}
              />
            ))}
          </div>

          {!atLimit && filter !== 'archived' && (
            <div className="mt-4">
              <Link href="/events/new"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1F4D3A] hover:underline">
                <Plus size={13} strokeWidth={2.4} /> Create a new event
              </Link>
            </div>
          )}
        </>
      )}
    </>
  );
}
