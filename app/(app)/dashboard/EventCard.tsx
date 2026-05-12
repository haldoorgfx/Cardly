'use client';

import Link from 'next/link';
import type { Database } from '@/types/database';

type Event = Database['public']['Tables']['events']['Row'];

function StatusBadge({ status }: { status: string }) {
  if (status === 'published') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
      </span>
    );
  }
  if (status === 'archived') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#0f0f1a]/50 bg-[#fafafa] border border-[#e5e5ea] px-2 py-1 rounded-full">
        Archived
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Draft
    </span>
  );
}

export default function EventCard({ event }: { event: Event }) {
  const bgStyle = event.background_url
    ? { backgroundImage: `url(${event.background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' };

  const updatedAgo = (() => {
    const diff = Date.now() - new Date(event.updated_at).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  })();

  return (
    <article className="group rounded-2xl bg-white border border-[#e5e5ea] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:border-[#d8d6ff]">
      <div className="relative overflow-hidden" style={{ aspectRatio: '5/3', ...bgStyle }}>
        {event.status === 'published' && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-white bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
            </span>
          </div>
        )}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-3 right-3 flex gap-1.5">
          {event.status === 'published' && (
            <button
              onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(`${window.location.origin}/c/${event.slug}`); }}
              className="h-8 w-8 rounded-lg bg-white/95 hover:bg-white grid place-items-center text-[#0f0f1a] shadow-soft"
              title="Copy link"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1" />
                <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1" />
              </svg>
            </button>
          )}
          <Link
            href={`/events/${event.id}/edit`}
            className="h-8 w-8 rounded-lg bg-white/95 hover:bg-white grid place-items-center text-[#0f0f1a] shadow-soft"
            title="Edit"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Link>
        </div>
      </div>
      <Link href={`/events/${event.id}`} className="block p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-display font-semibold text-[16px]">{event.name}</div>
            {event.status === 'published' && (
              <div className="text-[12px] font-mono text-[#0f0f1a]/50 mt-0.5">cardly.app/c/{event.slug}</div>
            )}
          </div>
          <StatusBadge status={event.status} />
        </div>
        <div className="mt-4 flex items-center justify-between text-[12.5px]">
          <div className="flex items-center gap-4 text-[#0f0f1a]/60">
            <span className="flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" />
              </svg>
              <strong className="text-[#0f0f1a]">{event.download_count.toLocaleString()}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" /><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" />
              </svg>
              <strong className="text-[#0f0f1a]">{event.view_count.toLocaleString()}</strong>
            </span>
          </div>
          <span className="text-[#0f0f1a]/40 font-mono text-[11px]">Updated {updatedAgo}</span>
        </div>
      </Link>
    </article>
  );
}
