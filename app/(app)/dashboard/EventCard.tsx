'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
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
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [nameVal, setNameVal] = useState(event.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) inputRef.current?.select();
  }, [renaming]);

  async function doDelete() {
    setBusy(true);
    await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
    router.refresh();
  }

  async function doRename() {
    const trimmed = nameVal.trim();
    if (!trimmed || trimmed === event.name) {
      setRenaming(false);
      setNameVal(event.name);
      return;
    }
    setBusy(true);
    await fetch(`/api/events/${event.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    setBusy(false);
    setRenaming(false);
    router.refresh();
  }

  async function doStatus(status: string) {
    setBusy(true);
    await fetch(`/api/events/${event.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    router.refresh();
  }

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

  if (confirmDelete) {
    return (
      <article className="rounded-2xl bg-white border border-red-200 overflow-hidden p-6 flex flex-col items-center justify-center gap-4 text-center" style={{ minHeight: 220 }}>
        <div className="h-10 w-10 rounded-full bg-red-50 grid place-items-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6M9 6V4h6v2" />
          </svg>
        </div>
        <div>
          <div className="font-display font-semibold text-[15px]">Delete &ldquo;{event.name}&rdquo;?</div>
          <div className="text-[13px] text-[#0f0f1a]/55 mt-1">This cannot be undone.</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirmDelete(false)}
            className="px-4 py-2 rounded-xl text-[13px] font-medium border border-[#e5e5ea] hover:bg-[#fafafa] transition"
          >
            Cancel
          </button>
          <button
            onClick={doDelete}
            disabled={busy}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-60"
          >
            {busy ? 'Deleting…' : 'Delete forever'}
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="group rounded-2xl bg-white border border-[#e5e5ea] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:border-[#d8d6ff]">
      {/* Thumbnail */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '5/3', ...bgStyle }}>
        {event.status === 'published' && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-white bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
            </span>
          </div>
        )}
        {/* Hover quick actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-3 right-3 flex gap-1.5">
          {event.status === 'published' && (
            <button
              onClick={(e) => {
                e.preventDefault();
                navigator.clipboard.writeText(`${window.location.origin}/c/${event.slug}`);
              }}
              className="h-8 w-8 rounded-lg bg-white/95 hover:bg-white grid place-items-center text-[#0f0f1a] shadow-soft"
              title="Copy attendee link"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1" />
                <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1" />
              </svg>
            </button>
          )}
          <Link
            href={`/events/${event.id}/edit`}
            className="h-8 w-8 rounded-lg bg-white/95 hover:bg-white grid place-items-center text-[#0f0f1a] shadow-soft"
            title="Edit zones"
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Card body */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {renaming ? (
              <input
                ref={inputRef}
                value={nameVal}
                onChange={e => setNameVal(e.target.value)}
                onBlur={doRename}
                onKeyDown={e => {
                  if (e.key === 'Enter') doRename();
                  if (e.key === 'Escape') { setRenaming(false); setNameVal(event.name); }
                }}
                className="w-full font-display font-semibold text-[16px] bg-[#6c63ff]/5 border border-[#6c63ff]/30 rounded-lg px-2 py-0.5 outline-none focus:ring-2 focus:ring-[#6c63ff]/30"
              />
            ) : (
              <Link href={`/events/${event.id}`} className="block">
                <div className="font-display font-semibold text-[16px] truncate">{event.name}</div>
                {event.status === 'published' && (
                  <div className="text-[12px] font-mono text-[#0f0f1a]/50 mt-0.5 truncate">/c/{event.slug}</div>
                )}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            <StatusBadge status={event.status} />

            {/* Three-dot menu */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-[#0f0f1a]/40 hover:text-[#0f0f1a] hover:bg-[#f4f4f6] transition"
                  title="More options"
                  disabled={busy}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="19" r="1.5" />
                  </svg>
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 min-w-[188px] bg-white rounded-xl border border-[#e5e5ea] shadow-lift p-1 text-[13px]"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenu.Item asChild>
                    <Link
                      href={`/events/${event.id}`}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#fafafa] cursor-pointer outline-none"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="12" cy="12" r="3" /><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" />
                      </svg>
                      View details
                    </Link>
                  </DropdownMenu.Item>

                  <DropdownMenu.Item asChild>
                    <Link
                      href={`/events/${event.id}/edit`}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#fafafa] cursor-pointer outline-none"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit zones
                    </Link>
                  </DropdownMenu.Item>

                  {event.status !== 'published' && (
                    <DropdownMenu.Item asChild>
                      <Link
                        href={`/events/${event.id}/publish`}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#fafafa] cursor-pointer outline-none text-[#6c63ff] font-medium"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                        Publish
                      </Link>
                    </DropdownMenu.Item>
                  )}

                  {event.status === 'published' && (
                    <DropdownMenu.Item
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#fafafa] cursor-pointer outline-none"
                      onSelect={() => navigator.clipboard.writeText(`${window.location.origin}/c/${event.slug}`)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1" />
                        <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1" />
                      </svg>
                      Copy link
                    </DropdownMenu.Item>
                  )}

                  <DropdownMenu.Separator className="my-1 h-px bg-[#f0f0f0]" />

                  <DropdownMenu.Item
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#fafafa] cursor-pointer outline-none"
                    onSelect={() => setRenaming(true)}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                    Rename
                  </DropdownMenu.Item>

                  {event.status === 'published' && (
                    <DropdownMenu.Item
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#fafafa] cursor-pointer outline-none text-[#0f0f1a]/60"
                      onSelect={() => doStatus('draft')}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M18.36 6.64A9 9 0 1 1 5.64 17.36" /><path d="M2 12h10" />
                      </svg>
                      Unpublish
                    </DropdownMenu.Item>
                  )}

                  {event.status !== 'archived' ? (
                    <DropdownMenu.Item
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#fafafa] cursor-pointer outline-none text-[#0f0f1a]/60"
                      onSelect={() => doStatus('archived')}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
                      </svg>
                      Archive
                    </DropdownMenu.Item>
                  ) : (
                    <DropdownMenu.Item
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#fafafa] cursor-pointer outline-none"
                      onSelect={() => doStatus('draft')}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.32" />
                      </svg>
                      Restore to draft
                    </DropdownMenu.Item>
                  )}

                  <DropdownMenu.Separator className="my-1 h-px bg-[#f0f0f0]" />

                  <DropdownMenu.Item
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer outline-none"
                    onSelect={() => setConfirmDelete(true)}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
                    </svg>
                    Delete
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>

        {/* Stats row */}
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
      </div>
    </article>
  );
}
