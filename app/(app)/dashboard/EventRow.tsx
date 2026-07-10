'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  MoreHorizontal, Pencil, ChevronRight, Link as LinkIcon,
  RotateCcw, Archive, Trash2, ScanLine, ExternalLink,
} from 'lucide-react';
import type { Database } from '@/types/database';

type EventRowType = Database['public']['Tables']['events']['Row'];
export type EventRowData = Pick<EventRowType, 'id' | 'name' | 'slug' | 'status' | 'view_count' | 'download_count' | 'updated_at'> & {
  event_pages?: Array<{ starts_at: string | null; venue_name: string | null }> | null;
  event_variants?: Array<{ id: string; background_url: string | null; position: number }> | null;
};

interface Props {
  event:    EventRowData;
  index:    number;
  regCount: number;
  revenue:  number;
  currency?: string | null;
}

const GRADS = [
  'linear-gradient(135deg, #163828 0%, #1F4D3A 55%, #2A6A50 100%)',
  'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 45%, #C9A45E 120%)',
  'linear-gradient(150deg, #122e21 0%, #1F4D3A 70%, #2A6A50 100%)',
  'linear-gradient(160deg, #1F4D3A 0%, #3E7E5E 100%)',
];

const STATUS_STYLE = {
  published: { label: 'Live',     dot: '#2D7A4F', cls: 'text-emerald-700', pulse: true },
  draft:     { label: 'Draft',    dot: '#C9A45E', cls: 'text-amber-700',   pulse: false },
  archived:  { label: 'Archived', dot: '#6B7A72', cls: 'text-[#6B7A72]',   pulse: false },
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  return {
    day:  d.toLocaleDateString(undefined, { day: 'numeric' }),
    mon:  d.toLocaleDateString(undefined, { month: 'short' }),
    year: d.toLocaleDateString(undefined, { year: 'numeric' }),
  };
}

function MenuItem({ children, color, onSel }: {
  children: React.ReactNode; color?: string; onSel?: () => void;
}) {
  return (
    <DropdownMenu.Item
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none transition text-[13px]"
      style={{ color: color ?? '#3A4A42' }}
      onSelect={onSel}
      onMouseEnter={e => (e.currentTarget.style.background = color === '#1F4D3A' ? '#E8EFEB' : color?.startsWith('#ef') || color?.startsWith('rgb') ? '#FEF2F2' : '#FAF6EE')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </DropdownMenu.Item>
  );
}

function MenuItemLink({ children, href, color, external }: {
  children: React.ReactNode; href: string; color?: string; external?: boolean;
}) {
  const inner = (
    <span className="flex items-center gap-2.5 w-full">{children}</span>
  );
  return (
    <DropdownMenu.Item asChild>
      {external
        ? <a href={href} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none transition text-[13px]"
            style={{ color: color ?? '#3A4A42' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FAF6EE')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            {inner}
          </a>
        : <Link href={href}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer outline-none transition text-[13px]"
            style={{ color: color ?? '#3A4A42' }}
            onMouseEnter={e => (e.currentTarget.style.background = color === '#1F4D3A' ? '#E8EFEB' : '#FAF6EE')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            {inner}
          </Link>
      }
    </DropdownMenu.Item>
  );
}

export default function EventRow({ event, index, regCount, revenue, currency }: Props) {
  const router = useRouter();
  const [renaming,      setRenaming]      = useState(false);
  const [nameVal,       setNameVal]       = useState(event.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy,          setBusy]          = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLive     = event.status === 'published';
  const isDraft    = event.status === 'draft';
  const isArchived = event.status === 'archived';
  const st       = STATUS_STYLE[event.status as keyof typeof STATUS_STYLE] ?? STATUS_STYLE.draft;
  const coverImg  = (event.event_variants ?? []).sort((a, b) => a.position - b.position)[0]?.background_url;
  const coverGrad = GRADS[index % GRADS.length];
  const dateInfo  = formatDate(event.event_pages?.[0]?.starts_at);
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
      <tr style={{ borderBottom: '1px solid #E5E0D4' }}>
        <td colSpan={6} className="px-5 py-3.5">
          <div className="flex items-center gap-4">
            <div className="h-7 w-7 rounded-full grid place-items-center shrink-0" style={{ background: '#FEF2F2', border: '1px solid #fecaca' }}>
              <Trash2 size={12} strokeWidth={2} color="#ef4444" />
            </div>
            <div className="flex-1 text-[13px] text-[#0F1F18]">
              Delete <strong>&ldquo;{event.name}&rdquo;</strong>? This cannot be undone.
            </div>
            <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition hover:bg-[#F5F3EE]"
              style={{ border: '1px solid #E5E0D4', color: '#3A4A42', background: 'white' }}>
              Cancel
            </button>
            <button onClick={doDelete} disabled={busy}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 transition">
              {busy ? 'Deleting…' : 'Delete forever'}
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`group transition-colors ${isArchived ? 'opacity-60' : ''}`}
      style={{ borderBottom: '1px solid #E5E0D4' }}
      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#FAFAF9'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
    >
      {/* NAME */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg shrink-0 overflow-hidden"
            style={coverImg
              ? { backgroundImage: `url(${coverImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: coverGrad }}>
          </div>
          <div className="min-w-0">
            {renaming ? (
              <input ref={inputRef} value={nameVal} onChange={e => setNameVal(e.target.value)}
                onBlur={doRename}
                onKeyDown={e => {
                  if (e.key === 'Enter') doRename();
                  if (e.key === 'Escape') { setRenaming(false); setNameVal(event.name); }
                }}
                className="text-[14px] font-semibold rounded px-1.5 py-0.5 outline-none w-full"
                style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }} />
            ) : (
              <Link href={`/events/${event.slug}`}
                className="block font-display text-[14px] font-semibold text-[#0F1F18] hover:text-[#1F4D3A] transition-colors truncate leading-snug"
                style={{ maxWidth: '240px' }}>
                {event.name}
              </Link>
            )}
            {venue && (
              <div className="text-[12px] text-[#6B7A72] truncate mt-0.5" style={{ maxWidth: '240px' }}>
                {venue}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* DATE */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        {dateInfo ? (
          <div className=" text-[12px] leading-tight">
            <div className="text-[#0F1F18]">{dateInfo.day} {dateInfo.mon}</div>
            <div className="text-[#6B7A72]">{dateInfo.year}</div>
          </div>
        ) : (
          <span className="text-[12px] text-[#6B7A72]">—</span>
        )}
      </td>

      {/* TICKETS (registration count) */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className=" text-[13px] text-[#0F1F18] font-medium">
          {regCount.toLocaleString()}
        </span>
      </td>

      {/* REVENUE */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className=" text-[13px] text-[#0F1F18]">
          {revenue > 0 && currency ? (() => {
            try { return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 0 }).format(revenue); }
            catch { return `${currency} ${revenue.toLocaleString()}`; }
          })() : <span className="text-[#6B7A72]">—</span>}
        </span>
      </td>

      {/* STATUS */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-medium ${st.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.pulse ? 'animate-pulse' : ''}`}
            style={{ background: st.dot }} />
          {st.label}
        </span>
      </td>

      {/* ACTIONS */}
      <td className="px-5 py-3.5 text-right">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="h-7 w-7 rounded-lg border flex items-center justify-center transition opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              style={{ borderColor: '#E5E0D4', background: 'white', color: '#6B7A72' }}
              disabled={busy}
              aria-label="Event actions"
            >
              <MoreHorizontal size={14} strokeWidth={1.8} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[188px] bg-white rounded-xl p-1"
              style={{ border: '1px solid #E5E0D4', boxShadow: '0 4px 24px rgba(15,31,24,0.12)' }}
              align="end"
              sideOffset={4}
            >
              <MenuItem onSel={() => setRenaming(true)}>
                <Pencil size={13} strokeWidth={1.8} /> Rename
              </MenuItem>
              <MenuItemLink href={`/events/${event.slug}`}>
                <ChevronRight size={13} strokeWidth={1.8} /> {isDraft ? 'Continue setup' : 'Manage'}
              </MenuItemLink>
              {!isLive && (
                <MenuItemLink href={`/events/${event.slug}/publish`} color="#1F4D3A">
                  <ChevronRight size={13} strokeWidth={1.8} /> Publish
                </MenuItemLink>
              )}
              {isLive && (
                <>
                  <MenuItem onSel={() => navigator.clipboard.writeText(`${window.location.origin}/e/${event.slug}`)}>
                    <LinkIcon size={13} strokeWidth={1.8} /> Copy link
                  </MenuItem>
                  <MenuItemLink href={`/e/${event.slug}`} external>
                    <ExternalLink size={13} strokeWidth={1.8} /> View public page
                  </MenuItemLink>
                  <MenuItemLink href={`/events/${event.slug}/check-in`}>
                    <ScanLine size={13} strokeWidth={1.8} /> Check-in scanner
                  </MenuItemLink>
                </>
              )}
              <DropdownMenu.Separator className="my-1 h-px" style={{ background: '#E5E0D4' }} />
              {isLive && (
                <MenuItem onSel={() => doStatus('draft')}>
                  <RotateCcw size={13} strokeWidth={1.8} /> Unpublish
                </MenuItem>
              )}
              {!isArchived ? (
                <MenuItem onSel={() => doStatus('archived')}>
                  <Archive size={13} strokeWidth={1.8} /> Archive
                </MenuItem>
              ) : (
                <MenuItem onSel={() => doStatus('draft')}>
                  <RotateCcw size={13} strokeWidth={1.8} /> Restore to draft
                </MenuItem>
              )}
              <DropdownMenu.Separator className="my-1 h-px" style={{ background: '#E5E0D4' }} />
              <MenuItem color="#ef4444" onSel={() => setConfirmDelete(true)}>
                <Trash2 size={13} strokeWidth={1.8} /> Delete
              </MenuItem>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </td>
    </tr>
  );
}
