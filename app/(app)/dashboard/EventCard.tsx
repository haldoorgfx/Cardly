'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { Database, Json } from '@/types/database';

type EventRow = Database['public']['Tables']['events']['Row'];
type Event = EventRow & {
  event_variants?: Array<{ id: string; background_url: string | null; zones: Json; position: number }> | null;
};

interface Props {
  event: Event;
  compact?: boolean;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'published') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
        Live
      </span>
    );
  }
  if (status === 'archived') {
    return <span className="text-[11px] text-[#6B7A72]">Archived</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
      Draft
    </span>
  );
}

export default function EventCard({ event, compact = false }: Props) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [nameVal, setNameVal] = useState(event.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const firstVariant = (event.event_variants ?? []).sort((a, b) => a.position - b.position)[0];
  const zonesCount = Array.isArray(firstVariant?.zones) ? (firstVariant.zones as unknown[]).length : 0;
  const isDraft = event.status === 'draft';
  const isArchived = event.status === 'archived';

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

  const bgStyle = firstVariant?.background_url
    ? { backgroundImage: `url(${firstVariant.background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)' };

  const updatedAgo = (() => {
    const diff = Date.now() - new Date(event.updated_at).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  })();

  // ─── Delete confirmation overlay ───────────────────────────────────────────
  if (confirmDelete) {
    return (
      <article
        className="rounded-2xl bg-white overflow-hidden p-6 flex flex-col items-center justify-center gap-4 text-center"
        style={{ border: '1px solid #fecaca', minHeight: compact ? 72 : 200 }}
      >
        <div className="h-9 w-9 rounded-full bg-red-50 grid place-items-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
          </svg>
        </div>
        <div>
          <div className="font-display font-semibold text-[14px] text-[#0F1F18]">Delete &ldquo;{event.name}&rdquo;?</div>
          <div className="text-[13px] text-[#6B7A72] mt-1">This cannot be undone.</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirmDelete(false)}
            className="px-4 py-1.5 rounded-lg text-[13px] font-medium transition hover:opacity-80"
            style={{ border: '1px solid #E5E0D4', color: '#3A4A42', background: 'white' }}
          >
            Cancel
          </button>
          <button
            onClick={doDelete}
            disabled={busy}
            className="px-4 py-1.5 rounded-lg text-[13px] font-medium text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-60"
          >
            {busy ? 'Deleting…' : 'Delete forever'}
          </button>
        </div>
      </article>
    );
  }

  // ─── Shared dropdown menu ──────────────────────────────────────────────────
  const Menu = (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="h-7 w-7 rounded-lg flex items-center justify-center transition"
          style={{ color: '#6B7A72' }}
          title="More options"
          disabled={busy}
          onMouseEnter={e => (e.currentTarget.style.background = '#F5F5F4')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[180px] bg-white rounded-xl shadow-[0_4px_24px_rgba(15,31,24,0.12)] p-1 text-[13px]"
          style={{ border: '1px solid #E5E0D4' }}
          align="end"
          sideOffset={4}
        >
          <DropdownMenu.Item asChild>
            <Link href={`/events/${event.id}`} className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none transition" style={{ color: '#3A4A42' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FAF6EE')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" /></svg>
              View details
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <Link href={`/events/${event.id}/edit`} className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none transition" style={{ color: '#3A4A42' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FAF6EE')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
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
              <Link href={`/events/${event.id}/publish`} className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none font-medium transition" style={{ color: '#1F4D3A' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#E8EFEB')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                Publish
              </Link>
            </DropdownMenu.Item>
          )}

          {event.status === 'published' && (
            <DropdownMenu.Item
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none transition"
              style={{ color: '#3A4A42' }}
              onSelect={() => navigator.clipboard.writeText(`${window.location.origin}/c/${event.slug}`)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1" />
                <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1" />
              </svg>
              Copy link
            </DropdownMenu.Item>
          )}

          <DropdownMenu.Separator className="my-1 h-px" style={{ background: '#E5E0D4' }} />

          <DropdownMenu.Item
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none transition"
            style={{ color: '#3A4A42' }}
            onSelect={() => setRenaming(true)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
            Rename
          </DropdownMenu.Item>

          {event.status === 'published' && (
            <DropdownMenu.Item
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none transition"
              style={{ color: '#6B7A72' }}
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
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none transition"
              style={{ color: '#6B7A72' }}
              onSelect={() => doStatus('archived')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
              </svg>
              Archive
            </DropdownMenu.Item>
          ) : (
            <DropdownMenu.Item
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none transition"
              style={{ color: '#3A4A42' }}
              onSelect={() => doStatus('draft')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.32" />
              </svg>
              Restore to draft
            </DropdownMenu.Item>
          )}

          <DropdownMenu.Separator className="my-1 h-px" style={{ background: '#E5E0D4' }} />

          <DropdownMenu.Item
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-600 cursor-pointer outline-none transition"
            onSelect={() => setConfirmDelete(true)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
            Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );

  // ─── List / compact view ───────────────────────────────────────────────────
  if (compact) {
    return (
      <article
        className={`group flex items-center gap-4 bg-white rounded-xl transition px-4 py-3 ${isArchived ? 'opacity-70' : ''}`}
        style={{ border: '1px solid #E5E0D4' }}
      >
        {/* Thumbnail */}
        <div
          className={`h-10 w-16 rounded-lg shrink-0 overflow-hidden ${isArchived ? 'grayscale' : ''}`}
          style={bgStyle}
        />

        {/* Name + meta */}
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
              className="w-full text-[14px] font-medium rounded-lg px-2 py-0.5 outline-none"
              style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}
            />
          ) : (
            <Link href={`/events/${event.id}`} className="text-[14px] font-medium text-[#0F1F18] hover:text-[#1F4D3A] truncate block transition">
              {event.name}
            </Link>
          )}
          <div className="text-[12px] text-[#6B7A72] truncate mt-0.5">
            {event.status === 'published' ? `/c/${event.slug}` : isDraft ? `${zonesCount} zone${zonesCount !== 1 ? 's' : ''}` : 'Archived'}
          </div>
        </div>

        {/* Stats */}
        {!isDraft && (
          <div className="hidden sm:flex items-center gap-4 text-[12px] text-[#6B7A72]">
            <span>{event.download_count.toLocaleString()} downloads</span>
            <span>{event.view_count.toLocaleString()} views</span>
          </div>
        )}

        {/* Status */}
        <StatusBadge status={event.status} />

        {/* Updated time */}
        <span className="text-[12px] text-[#6B7A72]/70 w-16 text-right hidden md:block">{updatedAgo}</span>

        {/* Menu */}
        {Menu}
      </article>
    );
  }

  // ─── Grid / card view ──────────────────────────────────────────────────────
  return (
    <article
      className={`group bg-white rounded-2xl overflow-hidden transition ${isArchived ? 'opacity-80' : ''}`}
      style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
    >
      {/* Thumbnail */}
      <div
        className={`relative overflow-hidden ${isArchived ? 'grayscale' : ''}`}
        style={{ aspectRatio: '16/9', ...bgStyle }}
      >
        {event.status === 'published' && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-white bg-black/40 px-1.5 py-0.5 rounded-md">
              <span className="h-1 w-1 rounded-full bg-emerald-400" /> Live
            </span>
          </div>
        )}

        {/* Hover quick actions */}
        <div className="opacity-0 group-hover:opacity-100 transition absolute bottom-2 right-2 flex gap-1">
          {event.status === 'published' && (
            <button
              onClick={e => { e.preventDefault(); navigator.clipboard.writeText(`${window.location.origin}/c/${event.slug}`); }}
              className="h-7 w-7 rounded-lg bg-white/90 hover:bg-white grid place-items-center text-[#3A4A42]"
              title="Copy link"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1" />
                <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1" />
              </svg>
            </button>
          )}
          <Link
            href={`/events/${event.id}/edit`}
            className="h-7 w-7 rounded-lg bg-white/90 hover:bg-white grid place-items-center text-[#3A4A42]"
            title="Edit"
            onClick={e => e.stopPropagation()}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
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
                className="w-full text-[14px] font-semibold rounded-lg px-2 py-0.5 outline-none"
                style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}
              />
            ) : (
              <Link href={`/events/${event.id}`} className="text-[14px] font-semibold truncate block text-[#0F1F18] hover:text-[#1F4D3A] transition">
                {event.name}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <StatusBadge status={event.status} />
            {Menu}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[12px] text-[#6B7A72]">
          {isDraft ? (
            <Link href={`/events/${event.id}/edit`} className="text-[#1F4D3A] font-medium hover:underline text-[12px]">
              {zonesCount === 0 ? 'Set up zones →' : 'Continue setup →'}
            </Link>
          ) : (
            <span>{event.download_count.toLocaleString()} downloads · {event.view_count.toLocaleString()} views</span>
          )}
          <span className="text-[#6B7A72]/60">{updatedAgo}</span>
        </div>
      </div>
    </article>
  );
}
