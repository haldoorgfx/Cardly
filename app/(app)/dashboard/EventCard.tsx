'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreVertical, Pencil, ChevronRight, Link as LinkIcon, RotateCcw, Archive, Trash2, ScanLine, ExternalLink, ArrowRight, Calendar, MapPin } from 'lucide-react';
import type { Database } from '@/types/database';

type EventRowType = Database['public']['Tables']['events']['Row'];
type Event = Pick<EventRowType, 'id' | 'name' | 'slug' | 'status' | 'view_count' | 'download_count' | 'updated_at'> & {
  event_pages?: Array<{ starts_at: string | null; venue_name: string | null }> | null;
  event_variants?: Array<{ id: string; background_url: string | null; position: number }> | null;
};

interface Props {
  event:      Event;
  index:      number;
  regCount:   number;
  revenue:    number;
  currency?:  string | null;
  checkinPct?: number;
}

const STATUS_STYLE = {
  published: { label: 'Live',     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: '#2D7A4F', pulse: true },
  draft:     { label: 'Draft',    cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: '#C9A45E', pulse: false },
  archived:  { label: 'Archived', cls: 'bg-[#FAF6EE] text-[#6B7A72] border-[#E5E0D4]',     dot: '#6B7A72', pulse: false },
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtRevenue(amount: number, currency: string | null | undefined): string {
  if (!currency || amount === 0) return '';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export default function EventCard({ event, regCount, revenue, currency, checkinPct = 0 }: Props) {
  const router = useRouter();
  const [renaming,      setRenaming]      = useState(false);
  const [nameVal,       setNameVal]       = useState(event.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy,          setBusy]          = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLive     = event.status === 'published';
  const isDraft    = event.status === 'draft';
  const isArchived = event.status === 'archived';

  const st = STATUS_STYLE[event.status as keyof typeof STATUS_STYLE] ?? STATUS_STYLE.draft;
  const coverImg  = (event.event_variants ?? []).sort((a, b) => a.position - b.position)[0]?.background_url;
  const initial   = (event.name?.trim()?.[0] ?? '?').toUpperCase();
  const eventDate = formatDate(event.event_pages?.[0]?.starts_at);
  const venue     = event.event_pages?.[0]?.venue_name;

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

  if (confirmDelete) {
    return (
      <div className="bg-white rounded-2xl border p-6 flex flex-col items-center gap-4 text-center" style={{ borderColor: '#fecaca' }}>
        <div className="h-8 w-8 rounded-full bg-red-50 grid place-items-center">
          <Trash2 size={14} strokeWidth={2} color="#ef4444" />
        </div>
        <div>
          <div className="font-display font-semibold text-[14px] text-[#0F1F18]">Delete &ldquo;{event.name}&rdquo;?</div>
          <div className="text-[12px] text-[#6B7A72] mt-0.5">This cannot be undone.</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setConfirmDelete(false)} className="px-4 py-1.5 rounded-lg text-[12px] font-medium border" style={{ borderColor: '#E5E0D4', color: '#3A4A42', background: 'white' }}>Cancel</button>
          <button onClick={doDelete} disabled={busy} className="px-4 py-1.5 rounded-lg text-[12px] font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-60">{busy ? 'Deleting…' : 'Delete forever'}</button>
        </div>
      </div>
    );
  }

  const Menu = (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="h-7 w-7 rounded-full flex items-center justify-center transition shadow-[0_1px_3px_rgba(15,31,24,0.12)]" style={{ background: 'rgba(255,255,255,0.92)', color: '#3A4A42' }} disabled={busy}
          onMouseEnter={e => (e.currentTarget.style.background = '#FFFFFF')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.92)')}>
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
              <Link href={`/events/${event.slug}/publish`} className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none font-medium transition" style={{ color: '#1F4D3A' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#E8EFEB')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <ChevronRight size={13} strokeWidth={1.8} /> Publish
              </Link>
            </DropdownMenu.Item>
          )}
          {isLive && (
            <DropdownMenu.Item className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none transition" style={{ color: '#3A4A42' }}
              onSelect={() => navigator.clipboard.writeText(`${window.location.origin}/e/${event.slug}`)}
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

  return (
    <div className={`group bg-white border rounded-2xl overflow-hidden transition-colors hover:border-[#1F4D3A]/40 flex flex-col ${isArchived ? 'opacity-70' : ''}`}
      style={{ borderColor: '#E5E0D4' }}>

      {/* ── Cover ── */}
      <div className="relative h-[88px] overflow-hidden"
        style={coverImg
          ? { backgroundImage: `url(${coverImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: '#E8EFEB' }}>
        {!coverImg && (
          <span aria-hidden className="absolute -bottom-3 right-3 font-display font-semibold leading-none select-none"
            style={{ fontSize: 92, color: '#1F4D3A', opacity: 0.12, letterSpacing: '-0.04em' }}>
            {initial}
          </span>
        )}

        {/* Status pill */}
        <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 text-[9.5px] tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border ${st.cls} bg-cream/95`}
          style={{ background: 'rgba(250,246,238,0.95)' }}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.pulse ? 'animate-pulse' : ''}`} style={{ background: st.dot }} />
          {st.label}
        </span>

        {/* Overflow menu — top right on cover */}
        <div className="absolute top-2 right-2">{Menu}</div>
      </div>

      {/* ── Body ── */}
      <div className="p-4 flex-1 flex flex-col">

        {/* Name */}
        {renaming ? (
          <input ref={inputRef} value={nameVal} onChange={e => setNameVal(e.target.value)}
            onBlur={doRename} onKeyDown={e => { if (e.key === 'Enter') doRename(); if (e.key === 'Escape') { setRenaming(false); setNameVal(event.name); } }}
            className="w-full text-[15px] font-semibold rounded-lg px-2 py-0.5 outline-none mb-1"
            style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }} />
        ) : (
          <Link href={`/events/${event.slug}`}
            className="font-display text-[15px] font-semibold text-[#0F1F18] tracking-tight leading-snug line-clamp-1 hover:text-[#1F4D3A] transition-colors">
            {event.name}
          </Link>
        )}

        {/* Date + venue */}
        {(eventDate || venue) && (
          <div className="flex items-center gap-2 mt-1  text-[12px] text-[#6B7A72] flex-wrap">
            {eventDate && <span className="inline-flex items-center gap-1"><Calendar size={12} strokeWidth={1.8} />{eventDate}</span>}
            {eventDate && venue && <span className="text-[#E5E0D4]">·</span>}
            {venue && <span className="inline-flex items-center gap-1"><MapPin size={12} strokeWidth={1.8} />{venue}</span>}
          </div>
        )}

        {/* Stats */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1  text-[12px] text-[#6B7A72]">
          <span><span className="text-[#1F4D3A] font-semibold">{regCount}</span> registered</span>
          {!isDraft && revenue > 0 && currency && (
            <><span className="text-[#E5E0D4]">·</span>
            <span><span className="text-[#1F4D3A] font-semibold">{fmtRevenue(revenue, currency)}</span></span></>
          )}
          {checkinPct > 0 && (
            <><span className="text-[#E5E0D4]">·</span>
            <span><span className="text-[#1F4D3A] font-semibold">{checkinPct}%</span> check-in</span></>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 pt-3 border-t flex items-center gap-2" style={{ borderColor: 'rgba(229,224,212,0.7)' }}>
          <Link href={`/events/${event.slug}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[12.5px] font-medium transition hover:bg-[#163828]"
            style={{ background: '#1F4D3A' }}>
            {isDraft ? 'Continue setup' : 'Manage'} <ArrowRight size={13} strokeWidth={2} />
          </Link>

          {isLive && (
            <Link href={`/e/${event.slug}`} target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12.5px] transition hover:border-[#1F4D3A]/40 hover:text-[#1F4D3A]"
              style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>
              <ExternalLink size={12} strokeWidth={1.8} /> View public
            </Link>
          )}

          {isLive && (
            <Link href={`/events/${event.slug}/check-in`}
              className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12.5px] transition hover:bg-[#E8EFEB]"
              style={{ color: '#1F4D3A' }}
              title="Check-in scanner">
              <ScanLine size={15} strokeWidth={1.8} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
