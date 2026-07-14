'use client';

import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import Link from 'next/link';
import EventCard from './EventCard';
import { type EventRowData } from './EventRow';

type Filter  = 'all' | 'active' | 'draft' | 'archived';
type SortKey = 'recent' | 'registrations' | 'revenue';

interface Props {
  events:      EventRowData[];
  atLimit:     boolean;
  regsByEvent: Record<string, { count: number; revenue: number; checkedIn: number; currencies?: Set<string> }>;
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
  const [query,  setQuery]  = useState('');

  const counts = {
    all:      events.length,
    active:   events.filter(e => e.status === 'published').length,
    draft:    events.filter(e => e.status === 'draft').length,
    archived: events.filter(e => e.status === 'archived').length,
  };

  const q = query.trim().toLowerCase();
  const filtered = events
    .filter(e => !q || (e.name ?? '').toLowerCase().includes(q))
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-4">
        <div className="overflow-x-auto pb-0.5">
          <div className="flex items-center gap-0.5 p-1 rounded-xl w-max"
            style={{ background: 'white', border: '1px solid #E5E0D4' }}
            role="tablist">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                role="tab"
                aria-selected={filter === f.key}
                className="h-7 px-3 rounded-lg text-[12.5px] font-medium transition whitespace-nowrap"
                style={filter === f.key
                  ? { background: '#E8EFEB', color: '#0F1F18' }
                  : { color: '#6B7A72' }}
              >
                {f.label}
                <span className="ml-1.5  text-[12.5px]"
                  style={{ color: filter === f.key ? '#3A4A42' : '#6B7A72' }}>
                  {counts[f.key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Search events by name */}
          <div className="flex items-center gap-2 h-8 px-2.5 rounded-lg bg-white" style={{ border: '1px solid #E5E0D4' }}>
            <Search size={13} strokeWidth={2} className="text-[#6B7A72] shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search events…"
              aria-label="Search events"
              className="outline-none bg-transparent text-[12.5px] w-[110px] sm:w-[150px] placeholder-[#6B7A72]/60 text-[#0F1F18]"
            />
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
      </div>

      {/* Empty filter state */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center" style={{ borderColor: '#E5E0D4' }}>
          <div className="mx-auto h-10 w-10 rounded-xl grid place-items-center mb-3" style={{ background: '#E8EFEB' }}>
            <Search size={16} strokeWidth={1.8} color="#1F4D3A" />
          </div>
          <div className="font-display font-semibold text-[14px] text-[#0F1F18]">
            {q ? `No events match “${query.trim()}”` : 'No events match this filter'}
          </div>
          <p className="text-[13px] text-[#6B7A72] mt-1">{q ? 'Try a different search or clear it.' : 'Switch the filter above.'}</p>
        </div>
      ) : (
        <>
          {/* Card grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((event, i) => {
              const regs       = regsByEvent[event.id];
              const regCount   = regs?.count     ?? 0;
              const revenue    = regs?.revenue   ?? 0;
              const checkedIn  = regs?.checkedIn ?? 0;
              const checkinPct = regCount > 0 ? Math.round((checkedIn / regCount) * 100) : 0;
              // Platform currency is USD — always display in USD
              const currency   = revenue > 0 ? 'USD' : null;
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  index={i}
                  regCount={regCount}
                  revenue={revenue}
                  currency={currency}
                  checkinPct={checkinPct}
                />
              );
            })}
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
