'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus } from 'lucide-react';
import EventRow from './EventCard';
import type { Database } from '@/types/database';

type EventRowType = Database['public']['Tables']['events']['Row'];
type Event = Pick<EventRowType, 'id' | 'name' | 'slug' | 'status' | 'view_count' | 'download_count' | 'updated_at'> & {
  event_pages?: Array<{ starts_at: string | null; venue_name: string | null }> | null;
};
type Filter  = 'all' | 'active' | 'draft' | 'archived';
type SortKey = 'recent' | 'registrations' | 'revenue';

interface Props {
  events:      Event[];
  atLimit:     boolean;
  regsByEvent: Record<string, { count: number; revenue: number }>;
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
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b flex-wrap" style={{ borderColor: '#E5E0D4' }}>
        <div className="flex items-center gap-0.5" role="tablist">
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
          className="h-7 text-[12px] rounded-lg px-2.5 cursor-pointer outline-none"
          style={{ background: 'white', border: '1px solid #E5E0D4', color: '#3A4A42' }}
        >
          <option value="recent">Most recent</option>
          <option value="registrations">Most registrations</option>
          <option value="revenue">Most revenue</option>
        </select>
      </div>

      {/* Column headers */}
      <div className="hidden md:grid px-5 py-2 border-b" style={{ borderColor: '#F0EDE7', gridTemplateColumns: '1fr 90px 110px 70px 80px 160px' }}>
        {['Event', 'Status', 'Date', 'Reg.', 'Revenue', ''].map((h, i) => (
          <div key={i} className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#6B7A72]">{h}</div>
        ))}
      </div>

      {/* Rows */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="h-10 w-10 rounded-xl grid place-items-center" style={{ background: '#E8EFEB' }}>
            <Search size={16} strokeWidth={1.8} color="#1F4D3A" />
          </div>
          <div>
            <div className="font-display font-semibold text-[14px] text-[#0F1F18]">No events match this filter</div>
            <p className="text-[13px] text-[#6B7A72] mt-0.5">Switch the filter above to see more.</p>
          </div>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: '#F0EDE7' }}>
          {filtered.map(event => (
            <EventRow
              key={event.id}
              event={event}
              regCount={regsByEvent[event.id]?.count   ?? 0}
              revenue={regsByEvent[event.id]?.revenue ?? 0}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      {!atLimit && filter !== 'archived' && (
        <div className="px-5 py-3 border-t" style={{ borderColor: '#F0EDE7' }}>
          <Link href="/events/new" className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#1F4D3A] hover:underline">
            <Plus size={13} strokeWidth={2.4} /> Create a new event
          </Link>
        </div>
      )}
    </div>
  );
}
