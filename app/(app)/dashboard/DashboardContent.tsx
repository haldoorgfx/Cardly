'use client';

import { useState } from 'react';
import Link from 'next/link';
import EventCard from './EventCard';
import type { Database } from '@/types/database';

type Event = Database['public']['Tables']['events']['Row'];
type Filter = 'all' | 'active' | 'draft' | 'archived';
type SortKey = 'recent' | 'downloads' | 'views';

interface Props {
  events: Event[];
  atLimit: boolean;
}

export default function DashboardContent({ events, atLimit }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<SortKey>('recent');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const counts = {
    all: events.length,
    active: events.filter(e => e.status === 'published').length,
    draft: events.filter(e => e.status === 'draft').length,
    archived: events.filter(e => e.status === 'archived').length,
  };

  const filtered = events
    .filter(e => {
      if (filter === 'all') return true;
      if (filter === 'active') return e.status === 'published';
      if (filter === 'draft') return e.status === 'draft';
      if (filter === 'archived') return e.status === 'archived';
      return true;
    })
    .sort((a, b) => {
      if (sort === 'downloads') return b.download_count - a.download_count;
      if (sort === 'views') return b.view_count - a.view_count;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  const showNewTile = !atLimit && filter !== 'archived';

  return (
    <>
      {/* Filter + sort bar */}
      <div className="mt-9 flex items-center justify-between flex-wrap gap-3">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-[#e5e5ea]">
          {(['all', 'active', 'draft', 'archived'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[13px] font-medium px-3.5 py-1.5 rounded-lg transition capitalize ${
                filter === f
                  ? 'bg-[#fafafa] text-[#0f0f1a]'
                  : 'text-[#0f0f1a]/60 hover:text-[#0f0f1a]'
              }`}
            >
              {f === 'all' ? 'All' : f === 'active' ? 'Active' : f === 'draft' ? 'Draft' : 'Archived'}
              <span className="ml-1.5 text-[#0f0f1a]/40 font-mono text-[11px]">{counts[f]}</span>
            </button>
          ))}
        </div>

        {/* Sort + view toggle */}
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="text-[13px] text-[#0f0f1a]/70 bg-white border border-[#e5e5ea] px-3 py-2 rounded-xl hover:bg-[#fafafa] transition outline-none cursor-pointer"
          >
            <option value="recent">Sort: Most recent</option>
            <option value="downloads">Sort: Downloads</option>
            <option value="views">Sort: Views</option>
          </select>

          <div className="flex items-center bg-white border border-[#e5e5ea] rounded-xl p-1">
            <button
              onClick={() => setView('grid')}
              className={`h-7 w-7 rounded-lg grid place-items-center transition ${
                view === 'grid' ? 'bg-[#fafafa] text-[#0f0f1a]' : 'text-[#0f0f1a]/40 hover:text-[#0f0f1a]'
              }`}
              title="Grid view"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              onClick={() => setView('list')}
              className={`h-7 w-7 rounded-lg grid place-items-center transition ${
                view === 'list' ? 'bg-[#fafafa] text-[#0f0f1a]' : 'text-[#0f0f1a]/40 hover:text-[#0f0f1a]'
              }`}
              title="List view"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Empty filter state */}
      {filtered.length === 0 && !showNewTile ? (
        <div className="mt-10 rounded-2xl border border-dashed border-[#e5e5ea] bg-white p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-[#fafafa] grid place-items-center text-[#0f0f1a]/40">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
            </svg>
          </div>
          <div className="mt-4 font-display font-semibold">No events match that filter.</div>
          <p className="text-[14px] text-[#0f0f1a]/55 mt-1">Switch the filter, or create a new event.</p>
        </div>
      ) : (
        <div className={`mt-6 ${view === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5'
          : 'flex flex-col gap-3'
        }`}>
          {filtered.map(event => (
            <EventCard key={event.id} event={event} compact={view === 'list'} />
          ))}

          {/* New event tile */}
          {showNewTile && (
            view === 'list' ? (
              <Link
                href="/events/new"
                className="group flex items-center gap-4 bg-white rounded-2xl border-2 border-dashed border-[#e5e5ea] hover:border-[#6c63ff]/40 hover:bg-[#fafafa] transition px-5 py-4"
              >
                <div className="h-10 w-10 rounded-xl grid place-items-center text-white shrink-0" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <span className="font-display font-semibold text-[14px] text-[#0f0f1a]/60 group-hover:text-[#6c63ff] transition">Create a new event</span>
              </Link>
            ) : (
              <Link
                href="/events/new"
                className="group rounded-2xl border-2 border-dashed border-[#e5e5ea] hover:border-[#6c63ff]/40 hover:bg-white transition flex flex-col items-center justify-center gap-3 p-8 text-center"
                style={{ minHeight: 280 }}
              >
                <div className="h-14 w-14 rounded-2xl grid place-items-center text-white group-hover:scale-105 transition" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)', boxShadow: '0 8px 24px rgba(108,99,255,0.25)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <div className="font-display font-semibold text-[16px]">Create a new event</div>
                <div className="text-[13px] text-[#0f0f1a]/55 max-w-[220px]">Upload your design and ship a share link in minutes.</div>
              </Link>
            )
          )}
        </div>
      )}
    </>
  );
}
