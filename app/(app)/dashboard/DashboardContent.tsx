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
  const [view, setView] = useState<'grid' | 'list'>('list');

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
      <div className="flex items-center gap-0 border-b border-neutral-200 mb-5">
        {(['all', 'active', 'draft', 'archived'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 text-[13px] transition border-b-2 -mb-px ${
              filter === f
                ? 'border-neutral-900 text-neutral-900 font-medium'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {f === 'all' ? 'All' : f === 'active' ? 'Active' : f === 'draft' ? 'Draft' : 'Archived'}
            <span className="ml-1.5 text-neutral-400 text-[12px]">{counts[f]}</span>
          </button>
        ))}

        {/* Sort + view toggle */}
        <div className="ml-auto flex items-center gap-2 mb-1">
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="h-7 text-[12px] bg-white border border-neutral-200 rounded-md px-2 text-neutral-600 outline-none cursor-pointer"
          >
            <option value="recent">Most recent</option>
            <option value="downloads">Downloads</option>
            <option value="views">Views</option>
          </select>

          <div className="flex items-center border border-neutral-200 rounded-md overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={`h-7 w-7 grid place-items-center transition ${
                view === 'list' ? 'bg-neutral-100 text-neutral-900' : 'bg-white text-neutral-400 hover:text-neutral-600'
              }`}
              title="List view"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
            <button
              onClick={() => setView('grid')}
              className={`h-7 w-7 grid place-items-center transition border-l border-neutral-200 ${
                view === 'grid' ? 'bg-neutral-100 text-neutral-900' : 'bg-white text-neutral-400 hover:text-neutral-600'
              }`}
              title="Grid view"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Empty filter state */}
      {filtered.length === 0 && !showNewTile ? (
        <p className="text-[13px] text-neutral-500 py-6">No events match that filter.</p>
      ) : (
        <div className={view === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4'
          : 'flex flex-col gap-2'
        }>
          {filtered.map(event => (
            <EventCard key={event.id} event={event} compact={view === 'list'} />
          ))}

          {/* New event tile */}
          {showNewTile && (
            view === 'list' ? (
              <Link
                href="/events/new"
                className="flex items-center gap-3 rounded-md border border-dashed border-neutral-200 hover:border-neutral-400 px-4 py-3 text-[13px] text-neutral-400 hover:text-neutral-600 transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New event
              </Link>
            ) : (
              <Link
                href="/events/new"
                className="rounded-lg border-2 border-dashed border-neutral-200 hover:border-neutral-400 transition flex flex-col items-center justify-center gap-2 text-neutral-400 hover:text-neutral-600"
                style={{ minHeight: 220 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="text-[13px]">New event</span>
              </Link>
            )
          )}
        </div>
      )}
    </>
  );
}
