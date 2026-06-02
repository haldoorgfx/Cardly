'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreVertical, Pencil, ChevronRight, Link as LinkIcon, RotateCcw, Archive, Trash2, ScanLine, ExternalLink, ArrowRight } from 'lucide-react';
import type { Database } from '@/types/database';

type EventRowType = Database['public']['Tables']['events']['Row'];
type Event = Pick<EventRowType, 'id' | 'name' | 'slug' | 'status' | 'view_count' | 'download_count' | 'updated_at'> & {
  event_pages?: Array<{ starts_at: string | null; venue_name: string | null }> | null;
};

interface Props {
  event:    Event;
  regCount: number;
  revenue:  number;
}

function StatusPill({ status }: { status: string }) {
  if (status === 'published') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: 'rgba(45,122,79,0.1)', color: '#2D7A4F' }}>
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
    </span>
  );
  if (status === 'archived') return (
    <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: '#F5F5F4', color: '#6B7A72' }}>Archived</span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: 'rgba(201,122,45,0.1)', color: '#C97A2D' }}>
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Draft
    </span>
  );
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EventRow({ event, regCount, revenue }: Props) {
  const router = useRouter();
  const [renaming,      setRenaming]      = useState(false);
  const [nameVal,       setNameVal]       = useState(event.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy,          setBusy]          = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLive     = event.status === 'published';
  const isDraft    = event.status === 'draft';
  const isArchived = event.status === 'archived';

  useEffect(() => { if (renaming) inputRef.current?.select(); }, [renaming]);

  async function doDelete() {
    setBusy(true);
    await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
    router.refresh();
  }

  async function doRename() {
    const trimmed = nameVal.trim();
    if (!trimmed || trimmed === event.name) { setRenaming(false); setNameVal(event.name); return; }
    setBusy(true);
    await fetch(`/api/events/${event.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: trimmed }) });
    setBusy(false); setRenaming(false); router.refresh();
  }

  async function doStatus(status: string) {
    setBusy(true);
    await fetch(`/api/events/${event.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    setBusy(false); router.refresh();
  }

  const eventDate = formatDate(event.event_pages?.[0]?.starts_at);


  // ─── Delete confirm ────────────────────────────────────────────────────────
  if (confirmDelete) {
    return (
      <div className="px-5 py-4 flex items-center justify-between gap-4 bg-red-50/40">
        <span className="text-[13px] text-[#0F1F18]">Delete <strong>{event.name}</strong>? This cannot be undone.</span>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setConfirmDelete(false)} className="h-7 px-3 rounded-lg text-[12px] font-medium border text-[#3A4A42]" style={{ borderColor: '#E5E0D4', background: 'white' }}>Cancel</button>
          <button onClick={doDelete} disabled={busy} className="h-7 px-3 rounded-lg text-[12px] font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-60">{busy ? 'Deleting…' : 'Delete forever'}</button>
        </div>
      </div>
    );
  }

  // ─── Dropdown menu ─────────────────────────────────────────────────────────
  const Menu = (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="h-7 w-7 rounded-lg flex items-center justify-center transition" style={{ color: '#6B7A72' }} disabled={busy}
          onMouseEnter={e => (e.currentTarget.style.background = '#F5F5F4')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <MoreVertical size={14} strokeWidth={1.8} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="z-50 min-w-[176px] bg-white rounded-xl shadow-[0_4px_24px_rgba(15,31,24,0.12)] p-1 text-[13px]" style={{ border: '1px solid #E5E0D4' }} align="end" sideOffset={4}>
          <DropdownMenu.Item className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none transition" style={{ color: '#3A4A42' }} onSelect={() => setRenaming(true)}
            onMouseEnter={e => (e.currentTarget.style.background = '#FAF6EE')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <Pencil size={13} strokeWidth={1.8} /> Rename
          </DropdownMenu.Item>

          {!isLive && (
            <DropdownMenu.Item asChild>
              <Link href={`/events/${event.id}/publish`} className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none font-medium transition" style={{ color: '#1F4D3A' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#E8EFEB')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <ChevronRight size={13} strokeWidth={1.8} /> Publish
              </Link>
            </DropdownMenu.Item>
          )}

          {isLive && (
            <DropdownMenu.Item className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none transition" style={{ color: '#3A4A42' }}
              onSelect={() => navigator.clipboard.writeText(`${window.location.origin}/c/${event.slug}`)}
              onMouseEnter={e => (e.currentTarget.style.background = '#FAF6EE')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <LinkIcon size={13} strokeWidth={1.8} /> Copy link
            </DropdownMenu.Item>
          )}

          <DropdownMenu.Separator className="my-1 h-px" style={{ background: '#E5E0D4' }} />

          {isLive && (
            <DropdownMenu.Item className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none transition" style={{ color: '#6B7A72' }} onSelect={() => doStatus('draft')}
              onMouseEnter={e => (e.currentTarget.style.background = '#FAF6EE')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <RotateCcw size={13} strokeWidth={1.8} /> Unpublish
            </DropdownMenu.Item>
          )}

          {!isArchived ? (
            <DropdownMenu.Item className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none transition" style={{ color: '#6B7A72' }} onSelect={() => doStatus('archived')}
              onMouseEnter={e => (e.currentTarget.style.background = '#FAF6EE')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <Archive size={13} strokeWidth={1.8} /> Archive
            </DropdownMenu.Item>
          ) : (
            <DropdownMenu.Item className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none transition" style={{ color: '#3A4A42' }} onSelect={() => doStatus('draft')}
              onMouseEnter={e => (e.currentTarget.style.background = '#FAF6EE')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <RotateCcw size={13} strokeWidth={1.8} /> Restore to draft
            </DropdownMenu.Item>
          )}

          <DropdownMenu.Separator className="my-1 h-px" style={{ background: '#E5E0D4' }} />

          <DropdownMenu.Item className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-600 cursor-pointer outline-none transition" onSelect={() => setConfirmDelete(true)}
            onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <Trash2 size={13} strokeWidth={1.8} /> Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );

  // ─── Table row ─────────────────────────────────────────────────────────────
  return (
    <div className={`group px-5 py-3.5 hover:bg-[#FAFAF9] transition ${isArchived ? 'opacity-60' : ''}`}>

      {/* Desktop: grid columns matching header */}
      <div className="hidden md:grid items-center gap-3" style={{ gridTemplateColumns: '1fr 90px 110px 70px 80px 160px' }}>

        {/* Event name */}
        <div className="min-w-0">
          {renaming ? (
            <input ref={inputRef} value={nameVal} onChange={e => setNameVal(e.target.value)}
              onBlur={doRename} onKeyDown={e => { if (e.key === 'Enter') doRename(); if (e.key === 'Escape') { setRenaming(false); setNameVal(event.name); } }}
              className="w-full text-[13.5px] font-semibold rounded-lg px-2 py-0.5 outline-none" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }} />
          ) : (
            <Link href={`/events/${event.id}`} className="text-[13.5px] font-semibold text-[#0F1F18] hover:text-[#1F4D3A] truncate block transition">
              {event.name}
            </Link>
          )}
        </div>

        {/* Status */}
        <div><StatusPill status={event.status} /></div>

        {/* Date */}
        <div className="text-[12px] text-[#6B7A72] truncate">{eventDate ?? <span className="text-[#C9C3B1]">—</span>}</div>

        {/* Registrations */}
        <div className="font-mono text-[13px]" style={{ color: regCount > 0 ? '#0F1F18' : '#C9C3B1' }}>
          {regCount > 0 ? regCount.toLocaleString() : '—'}
        </div>

        {/* Revenue */}
        <div className="font-mono text-[13px]" style={{ color: revenue > 0 ? '#2D7A4F' : '#C9C3B1' }}>
          {revenue > 0 ? '$' + revenue.toLocaleString() : '—'}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 justify-end">
          {isDraft ? (
            <Link href={`/events/${event.id}`}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11.5px] font-medium text-white transition hover:opacity-90"
              style={{ background: '#1F4D3A' }}>
              Continue setup <ArrowRight size={10} strokeWidth={2.2} />
            </Link>
          ) : (
            <Link href={`/events/${event.id}`}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11.5px] font-medium text-white transition hover:opacity-90"
              style={{ background: '#1F4D3A' }}>
              Manage <ArrowRight size={10} strokeWidth={2.2} />
            </Link>
          )}

          {isLive && (
            <>
              <Link href={`/c/${event.slug}`} target="_blank"
                className="h-7 w-7 rounded-lg grid place-items-center border transition hover:bg-[#FAF6EE]"
                style={{ borderColor: '#E5E0D4', color: '#6B7A72' }} title="View public page">
                <ExternalLink size={12} strokeWidth={1.8} />
              </Link>
              <Link href={`/events/${event.id}/check-in`}
                className="h-7 w-7 rounded-lg grid place-items-center border transition hover:bg-[#FAF6EE]"
                style={{ borderColor: '#E5E0D4', color: '#6B7A72' }} title="Check-in scanner">
                <ScanLine size={12} strokeWidth={1.8} />
              </Link>
            </>
          )}

          {Menu}
        </div>
      </div>

      {/* Mobile: stacked */}
      <div className="md:hidden flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {renaming ? (
            <input ref={inputRef} value={nameVal} onChange={e => setNameVal(e.target.value)}
              onBlur={doRename} onKeyDown={e => { if (e.key === 'Enter') doRename(); if (e.key === 'Escape') { setRenaming(false); setNameVal(event.name); } }}
              className="w-full text-[13.5px] font-semibold rounded-lg px-2 py-0.5 outline-none" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }} />
          ) : (
            <Link href={`/events/${event.id}`} className="text-[13.5px] font-semibold text-[#0F1F18] hover:text-[#1F4D3A] block truncate transition">
              {event.name}
            </Link>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StatusPill status={event.status} />
            {eventDate && <span className="text-[11px] text-[#6B7A72]">{eventDate}</span>}
            {regCount > 0 && <span className="text-[11px] font-mono text-[#3A4A42]">{regCount} reg</span>}
            {revenue > 0 && <span className="text-[11px] font-mono text-[#2D7A4F]">${revenue.toLocaleString()}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Link href={`/events/${event.id}`}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11.5px] font-medium text-white"
            style={{ background: '#1F4D3A' }}>
            {isDraft ? 'Setup' : 'Manage'}
          </Link>
          {Menu}
        </div>
      </div>

    </div>
  );
}
