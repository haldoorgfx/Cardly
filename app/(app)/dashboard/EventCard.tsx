'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreVertical, Pencil, ChevronRight, Link as LinkIcon, RotateCcw, Archive, Trash2, ScanLine, ExternalLink, ArrowRight } from 'lucide-react';
import type { Database, Json } from '@/types/database';

type EventRow = Database['public']['Tables']['events']['Row'];
type Event = Pick<EventRow, 'id' | 'name' | 'slug' | 'status' | 'view_count' | 'download_count' | 'updated_at' | 'starts_at' | 'venue_name'> & {
  event_variants?: Array<{ id: string; background_url: string | null; zones: Json; position: number }> | null;
};

interface Props {
  event: Event;
  compact?: boolean;
  regCount?: number;
  revenue?: number;
}

function StatusPill({ status }: { status: string }) {
  if (status === 'published') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(45,122,79,0.1)', color: '#2D7A4F' }}>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
        Live
      </span>
    );
  }
  if (status === 'archived') {
    return (
      <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: '#F5F5F4', color: '#6B7A72' }}>
        Archived
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,122,45,0.1)', color: '#C97A2D' }}>
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
      Draft
    </span>
  );
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EventCard({ event, compact = false, regCount = 0, revenue = 0 }: Props) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [nameVal, setNameVal] = useState(event.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const firstVariant = (event.event_variants ?? []).sort((a, b) => a.position - b.position)[0];
  const isDraft = event.status === 'draft';
  const isArchived = event.status === 'archived';
  const isLive = event.status === 'published';

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

  const eventDate = formatDate(event.starts_at);
  const venue = event.venue_name;

  // ─── Delete confirmation overlay ───────────────────────────────────────────
  if (confirmDelete) {
    return (
      <article
        className="rounded-xl bg-white overflow-hidden p-5 flex flex-col items-center justify-center gap-4 text-center"
        style={{ border: '1px solid #fecaca', minHeight: 88 }}
      >
        <div className="h-8 w-8 rounded-full bg-red-50 grid place-items-center">
          <Trash2 size={14} strokeWidth={2} color="#ef4444" />
        </div>
        <div>
          <div className="font-display font-semibold text-[14px] text-[#0F1F18]">Delete &ldquo;{event.name}&rdquo;?</div>
          <div className="text-[12px] text-[#6B7A72] mt-0.5">This cannot be undone.</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirmDelete(false)}
            className="px-4 py-1.5 rounded-lg text-[12px] font-medium transition hover:opacity-80"
            style={{ border: '1px solid #E5E0D4', color: '#3A4A42', background: 'white' }}
          >Cancel</button>
          <button
            onClick={doDelete}
            disabled={busy}
            className="px-4 py-1.5 rounded-lg text-[12px] font-medium text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-60"
          >{busy ? 'Deleting…' : 'Delete forever'}</button>
        </div>
      </article>
    );
  }

  // ─── Shared dropdown menu ──────────────────────────────────────────────────
  const Menu = (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="h-7 w-7 rounded-lg flex items-center justify-center transition shrink-0"
          style={{ color: '#6B7A72' }}
          title="More options"
          disabled={busy}
          onMouseEnter={e => (e.currentTarget.style.background = '#F5F5F4')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <MoreVertical size={14} strokeWidth={1.8} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[180px] bg-white rounded-xl shadow-[0_4px_24px_rgba(15,31,24,0.12)] p-1 text-[13px]"
          style={{ border: '1px solid #E5E0D4' }}
          align="end"
          sideOffset={4}
        >
          <DropdownMenu.Item
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none transition"
            style={{ color: '#3A4A42' }}
            onSelect={() => setRenaming(true)}
          >
            <Pencil size={13} strokeWidth={1.8} /> Rename
          </DropdownMenu.Item>

          {event.status !== 'published' && (
            <DropdownMenu.Item asChild>
              <Link href={`/events/${event.id}/publish`} className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none font-medium transition" style={{ color: '#1F4D3A' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#E8EFEB')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <ChevronRight size={13} strokeWidth={1.8} /> Publish
              </Link>
            </DropdownMenu.Item>
          )}

          {event.status === 'published' && (
            <DropdownMenu.Item
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none transition"
              style={{ color: '#3A4A42' }}
              onSelect={() => navigator.clipboard.writeText(`${window.location.origin}/c/${event.slug}`)}
            >
              <LinkIcon size={13} strokeWidth={1.8} /> Copy link
            </DropdownMenu.Item>
          )}

          <DropdownMenu.Separator className="my-1 h-px" style={{ background: '#E5E0D4' }} />

          {event.status === 'published' && (
            <DropdownMenu.Item
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none transition"
              style={{ color: '#6B7A72' }}
              onSelect={() => doStatus('draft')}
            >
              <RotateCcw size={13} strokeWidth={1.8} /> Unpublish
            </DropdownMenu.Item>
          )}

          {event.status !== 'archived' ? (
            <DropdownMenu.Item
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none transition"
              style={{ color: '#6B7A72' }}
              onSelect={() => doStatus('archived')}
            >
              <Archive size={13} strokeWidth={1.8} /> Archive
            </DropdownMenu.Item>
          ) : (
            <DropdownMenu.Item
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none transition"
              style={{ color: '#3A4A42' }}
              onSelect={() => doStatus('draft')}
            >
              <RotateCcw size={13} strokeWidth={1.8} /> Restore to draft
            </DropdownMenu.Item>
          )}

          <DropdownMenu.Separator className="my-1 h-px" style={{ background: '#E5E0D4' }} />

          <DropdownMenu.Item
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-600 cursor-pointer outline-none transition"
            onSelect={() => setConfirmDelete(true)}
          >
            <Trash2 size={13} strokeWidth={1.8} /> Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );

  // ─── Shared: renaming input ────────────────────────────────────────────────
  const NameField = renaming ? (
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
    <Link href={`/events/${event.id}`} className="text-[14px] font-semibold text-[#0F1F18] hover:text-[#1F4D3A] truncate block transition">
      {event.name}
    </Link>
  );

  // ─── Compact list row (unchanged structure, updated copy) ──────────────────
  if (compact) {
    return (
      <article
        className={`group flex items-center gap-3 bg-white rounded-xl transition px-4 py-3 ${isArchived ? 'opacity-70' : ''}`}
        style={{ border: '1px solid #E5E0D4' }}
      >
        {/* Thumbnail */}
        <div
          className={`h-9 w-14 rounded-lg shrink-0 overflow-hidden ${isArchived ? 'grayscale' : ''}`}
          style={bgStyle}
        />

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          {NameField}
          <div className="text-[11px] text-[#6B7A72] truncate mt-0.5 flex items-center gap-1.5">
            {eventDate && <span>{eventDate}</span>}
            {eventDate && venue && <span>·</span>}
            {venue && <span>{venue}</span>}
            {!eventDate && !venue && (isLive ? `/c/${event.slug}` : isDraft ? 'Draft' : 'Archived')}
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4 text-[12px] shrink-0" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          <span style={{ color: '#3A4A42' }}>{regCount > 0 ? `${regCount} reg` : '—'}</span>
          {revenue > 0 && <span style={{ color: '#2D7A4F' }}>${revenue.toLocaleString()}</span>}
        </div>

        {/* Status */}
        <StatusPill status={event.status} />

        {/* Updated */}
        <span className="text-[11px] text-[#6B7A72]/60 w-14 text-right hidden md:block">{updatedAgo}</span>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isLive && (
            <Link href={`/events/${event.id}/check-in`}
              className="hidden sm:flex items-center gap-1 h-7 px-2 rounded-lg text-[11px] font-medium transition hover:opacity-80"
              style={{ background: 'rgba(31,77,58,0.07)', color: '#1F4D3A' }}
            >
              <ScanLine size={11} strokeWidth={2} /> Check-in
            </Link>
          )}
          {Menu}
        </div>
      </article>
    );
  }

  // ─── Management card (no hero thumbnail — horizontal layout) ───────────────
  return (
    <article
      className={`group bg-white rounded-xl overflow-hidden transition ${isArchived ? 'opacity-70' : ''}`}
      style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Small accent thumbnail */}
        <div
          className={`h-12 w-12 rounded-lg shrink-0 ${isArchived ? 'grayscale' : ''}`}
          style={bgStyle}
        />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {NameField}
              <div className="text-[11px] text-[#6B7A72] mt-0.5 flex flex-wrap items-center gap-1.5">
                <StatusPill status={event.status} />
                {eventDate && <><span>·</span><span>{eventDate}</span></>}
                {venue && <><span>·</span><span className="truncate">{venue}</span></>}
              </div>
            </div>
            {Menu}
          </div>

          {/* Stats row */}
          <div className="mt-3 flex items-center gap-4 text-[12px]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            <div>
              <span className="text-[20px] font-bold leading-none" style={{ color: '#0F1F18', fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.02em' }}>
                {regCount}
              </span>
              <span className="text-[11px] text-[#6B7A72] ml-1.5">registered</span>
            </div>
            {revenue > 0 && (
              <div>
                <span className="text-[20px] font-bold leading-none" style={{ color: '#2D7A4F', fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.02em' }}>
                  ${revenue.toLocaleString()}
                </span>
                <span className="text-[11px] text-[#6B7A72] ml-1.5">revenue</span>
              </div>
            )}
            <span className="ml-auto text-[11px] text-[#6B7A72]/60">{updatedAgo}</span>
          </div>

          {/* Action buttons */}
          <div className="mt-3 pt-3 flex items-center gap-2 flex-wrap" style={{ borderTop: '1px solid #F0EDE7' }}>
            {isDraft ? (
              <Link href={`/events/${event.id}`}
                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-[12px] font-medium text-white transition hover:opacity-90"
                style={{ background: '#1F4D3A' }}
              >
                Continue setup <ArrowRight size={11} strokeWidth={2.2} />
              </Link>
            ) : (
              <Link href={`/events/${event.id}`}
                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-[12px] font-medium text-white transition hover:opacity-90"
                style={{ background: '#1F4D3A' }}
              >
                Manage <ArrowRight size={11} strokeWidth={2.2} />
              </Link>
            )}

            {isLive && (
              <>
                <Link href={`/c/${event.slug}`} target="_blank"
                  className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-[12px] font-medium transition"
                  style={{ border: '1px solid #E5E0D4', color: '#3A4A42', background: 'white' }}
                >
                  <ExternalLink size={11} strokeWidth={1.8} /> View public
                </Link>
                <Link href={`/events/${event.id}/check-in`}
                  className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-[12px] font-medium transition"
                  style={{ border: '1px solid #E5E0D4', color: '#3A4A42', background: 'white' }}
                >
                  <ScanLine size={11} strokeWidth={1.8} /> Check-in
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
