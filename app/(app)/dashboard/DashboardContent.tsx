'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LayoutGrid, List, Plus, Clock, ArrowRight } from 'lucide-react';
import EventCard from './EventCard';
import type { Database } from '@/types/database';

type EventRow = Database['public']['Tables']['events']['Row'];
type Event = Pick<EventRow, 'id' | 'name' | 'slug' | 'status' | 'view_count' | 'download_count' | 'updated_at'> & {
  event_variants?: Array<{ id: string; background_url: string | null; zones: import('@/types/database').Json; position: number }> | null;
};
type Filter = 'all' | 'active' | 'draft' | 'archived';
type SortKey = 'recent' | 'registrations' | 'revenue';

type RegEntry = { count: number; revenue: number; checkins: number };
type AttentionEvent = { id: string; name: string; slug: string; reasons: string[] };

interface Props {
  events: Event[];
  atLimit: boolean;
  regsByEvent: Record<string, RegEntry>;
  attentionEvents: AttentionEvent[];
}

export default function DashboardContent({ events, atLimit, regsByEvent, attentionEvents }: Props) {
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
      if (sort === 'registrations') return (regsByEvent[b.id]?.count ?? 0) - (regsByEvent[a.id]?.count ?? 0);
      if (sort === 'revenue') return (regsByEvent[b.id]?.revenue ?? 0) - (regsByEvent[a.id]?.revenue ?? 0);
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
      {/* ── Attention strip ── */}
      {attentionEvents.length > 0 && filter !== 'active' && filter !== 'archived' && (
        <div className="mb-7">
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] uppercase mb-3"
            style={{ color: 'rgba(201,122,45,0.9)' }}>
            <Clock size={13} strokeWidth={1.8} /> Needs attention
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {attentionEvents.map(e => (
              <Link key={e.id} href={`/events/${e.id}`}
                className="flex items-center gap-3 rounded-xl px-4 py-3 border transition"
                style={{ background: 'rgba(201,122,45,0.06)', borderColor: 'rgba(201,122,45,0.25)', textDecoration: 'none' }}>
                <div className="w-9 h-9 rounded-lg shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 100%)' }} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium truncate" style={{ color: '#0F1F18' }}>{e.name}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: '#C97A2D' }}>
                    {e.reasons.join(' · ')}
                  </div>
                </div>
                <ArrowRight size={15} strokeWidth={1.8} style={{ color: '#B45309', flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Filter + sort bar ── */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto"
          style={{ background: 'white', border: '1px solid #E5E0D4', scrollbarWidth: 'none' }}
          role="tablist">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="shrink-0 text-[13px] font-medium px-3 py-1.5 rounded-lg transition"
              style={filter === f.key ? { background: '#E8EFEB', color: '#0F1F18' } : { color: '#6B7A72' }}>
              {f.label}
              <span className="ml-1.5 text-[11px] font-mono"
                style={{ color: filter === f.key ? '#3A4A42' : '#6B7A72' }}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
            className="h-8 text-[12px] rounded-lg px-2.5 cursor-pointer outline-none"
            style={{ background: 'white', border: '1px solid #E5E0D4', color: '#3A4A42' }}>
            <option value="recent">Most recent</option>
            <option value="registrations">Registrations</option>
            <option value="revenue">Revenue</option>
          </select>

          <div className="flex items-center rounded-xl overflow-hidden" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
            <button onClick={() => setView('grid')} title="Grid view"
              className="h-8 w-8 grid place-items-center transition"
              style={view === 'grid' ? { background: '#E8EFEB', color: '#0F1F18' } : { color: '#6B7A72' }}>
              <LayoutGrid size={13} strokeWidth={1.8} />
            </button>
            <button onClick={() => setView('list')} title="List view"
              className="h-8 w-8 grid place-items-center transition border-l"
              style={view === 'list'
                ? { background: '#E8EFEB', color: '#0F1F18', borderColor: '#E5E0D4' }
                : { color: '#6B7A72', borderColor: '#E5E0D4' }}>
              <List size={13} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>

      {/* ── YOUR EVENTS label ── */}
      <div className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: '#6B7A72' }}>
        Your events
      </div>

      {/* ── Empty filter state ── */}
      {filtered.length === 0 && !showNewTile ? (
        <div className="rounded-2xl border border-dashed p-12 text-center"
          style={{ borderColor: '#E5E0D4', background: 'white' }}>
          <div className="font-display font-semibold text-[15px]" style={{ color: '#0F1F18' }}>No events match that filter.</div>
          <p className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>Switch the filter or clear your search.</p>
        </div>
      ) : (
        <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4' : 'flex flex-col gap-2'}>
          {filtered.map(event => (
            <EventCard
              key={event.id}
              event={event}
              compact={view === 'list'}
              regCount={regsByEvent[event.id]?.count ?? 0}
              revenue={regsByEvent[event.id]?.revenue ?? 0}
              checkIns={regsByEvent[event.id]?.checkins ?? 0}
            />
          ))}

          {showNewTile && (
            view === 'list' ? (
              <Link href="/events/new"
                className="flex items-center gap-3 rounded-xl border border-dashed px-4 py-3 text-[13px] font-medium transition"
                style={{ borderColor: 'rgba(31,77,58,0.3)', color: '#1F4D3A', background: 'rgba(31,77,58,0.02)', textDecoration: 'none' }}>
                <div className="h-7 w-7 rounded-lg grid place-items-center shrink-0 text-white" style={{ background: '#1F4D3A' }}>
                  <Plus size={11} strokeWidth={2.8} />
                </div>
                New event
              </Link>
            ) : (
              <Link href="/events/new"
                className="group rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 text-center p-6 transition"
                style={{ minHeight: 210, borderColor: 'rgba(31,77,58,0.25)', background: 'rgba(31,77,58,0.015)', textDecoration: 'none' }}>
                <div className="h-14 w-14 rounded-2xl grid place-items-center text-white group-hover:scale-105 transition-transform"
                  style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)', boxShadow: '0 8px 20px rgba(31,77,58,0.3)' }}>
                  <Plus size={22} strokeWidth={2.4} />
                </div>
                <div>
                  <div className="font-display font-semibold text-[15px]" style={{ color: '#0F1F18' }}>Create a new event</div>
                  <div className="text-[13px] mt-1 max-w-[200px] leading-snug" style={{ color: '#6B7A72' }}>
                    Set up tickets, agenda, speakers and more in minutes.
                  </div>
                </div>
              </Link>
            )
          )}
        </div>
      )}
    </>
  );
}
