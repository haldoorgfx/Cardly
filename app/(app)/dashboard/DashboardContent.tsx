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
  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'draft', label: 'Draft' },
    { key: 'archived', label: 'Archived' },
  ];

  return (
    <>
      {/* Filter + sort bar */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        {/* Pill tabs — C2 style */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: 'white', border: '1px solid #E5E0D4' }}
          role="tablist"
        >
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="text-[13px] font-medium px-3.5 py-1.5 rounded-lg transition"
              style={filter === f.key
                ? { background: '#E8EFEB', color: '#0F1F18' }
                : { color: '#6B7A72' }
              }
            >
              {f.label}
              <span
                className="ml-1.5 text-[11px] font-mono"
                style={{ color: filter === f.key ? '#3A4A42' : '#6B7A72' }}
              >
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Sort + view toggle */}
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="h-8 text-[12px] rounded-lg px-2.5 cursor-pointer outline-none transition"
            style={{ background: 'white', border: '1px solid #E5E0D4', color: '#3A4A42' }}
          >
            <option value="recent">Most recent</option>
            <option value="downloads">Downloads</option>
            <option value="views">Views</option>
          </select>

          {/* Grid / list toggle */}
          <div className="flex items-center rounded-xl overflow-hidden" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
            <button
              onClick={() => setView('grid')}
              className="h-8 w-8 grid place-items-center transition"
              style={view === 'grid' ? { background: '#E8EFEB', color: '#0F1F18' } : { color: '#6B7A72' }}
              title="Grid view"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              onClick={() => setView('list')}
              className="h-8 w-8 grid place-items-center transition border-l"
              style={view === 'list' ? { background: '#E8EFEB', color: '#0F1F18', borderColor: '#E5E0D4' } : { color: '#6B7A72', borderColor: '#E5E0D4' }}
              title="List view"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
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
        <div
          className="rounded-2xl border border-dashed p-12 text-center"
          style={{ borderColor: '#E5E0D4', background: 'white' }}
        >
          <div className="mx-auto h-11 w-11 rounded-xl grid place-items-center mb-4" style={{ background: '#E8EFEB' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
            </svg>
          </div>
          <div className="font-display font-semibold text-[15px] text-[#0F1F18]">No events match that filter.</div>
          <p className="text-[13px] text-[#6B7A72] mt-1">Switch the filter or clear your search.</p>
        </div>
      ) : (
        <div className={
          view === 'grid'
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
                className="flex items-center gap-3 rounded-xl border border-dashed px-4 py-3 text-[13px] font-medium transition hover:opacity-80"
                style={{ borderColor: 'rgba(31,77,58,0.3)', color: '#1F4D3A', background: 'rgba(31,77,58,0.02)' }}
              >
                <div
                  className="h-7 w-7 rounded-lg grid place-items-center shrink-0"
                  style={{ background: '#1F4D3A' }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                New event
              </Link>
            ) : (
              <Link
                href="/events/new"
                className="group rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 text-center p-6 transition hover:border-opacity-60"
                style={{ minHeight: 220, borderColor: 'rgba(31,77,58,0.25)', background: 'rgba(31,77,58,0.015)' }}
              >
                <div
                  className="h-14 w-14 rounded-2xl grid place-items-center text-white group-hover:scale-105 transition-transform"
                  style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)', boxShadow: '0 8px 20px rgba(31,77,58,0.3)' }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <div>
                  <div className="font-display font-semibold text-[15px] text-[#0F1F18]">Create a new event</div>
                  <div className="text-[13px] text-[#6B7A72] mt-1 max-w-[200px] leading-snug">
                    Upload your design and ship a share link in under five minutes.
                  </div>
                </div>
                <div className="text-[11px] font-mono text-[#1F4D3A]">⌘ N to start</div>
              </Link>
            )
          )}
        </div>
      )}
    </>
  );
}
