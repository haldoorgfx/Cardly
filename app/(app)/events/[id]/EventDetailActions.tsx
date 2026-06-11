'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreHorizontal, Pencil, RotateCcw, Archive, Trash2, Copy } from 'lucide-react';

interface Props {
  eventId: string;
  eventName: string;
  status: string;
}

export default function EventDetailActions({ eventId, eventName, status }: Props) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [nameVal, setNameVal] = useState(eventName);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) inputRef.current?.select();
  }, [renaming]);

  async function doDelete() {
    setBusy(true);
    await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
    router.push('/dashboard');
    router.refresh();
  }

  async function doRename() {
    const trimmed = nameVal.trim();
    if (!trimmed || trimmed === eventName) { setRenaming(false); setNameVal(eventName); return; }
    setBusy(true);
    await fetch(`/api/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    setBusy(false);
    setRenaming(false);
    router.refresh();
  }

  async function doDuplicate() {
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${eventId}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.id) {
        router.push(`/events/${data.id}`);
      }
    } finally {
      setBusy(false);
    }
  }

  async function doStatus(newStatus: string) {
    setBusy(true);
    await fetch(`/api/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setBusy(false);
    router.refresh();
  }

  if (confirmDelete) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
        <span className="text-[13px] text-red-700 font-medium">Delete &ldquo;{eventName}&rdquo;?</span>
        <button
          onClick={() => setConfirmDelete(false)}
          className="text-[13px] text-[#0F1F18]/60 hover:text-[#0F1F18] px-2 py-1 rounded-lg hover:bg-white/60 transition"
        >
          Cancel
        </button>
        <button
          onClick={doDelete}
          disabled={busy}
          className="text-[13px] font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition disabled:opacity-60"
        >
          {busy ? 'Deleting…' : 'Delete forever'}
        </button>
      </div>
    );
  }

  if (renaming) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={nameVal}
          onChange={e => setNameVal(e.target.value)}
          onBlur={doRename}
          onKeyDown={e => {
            if (e.key === 'Enter') doRename();
            if (e.key === 'Escape') { setRenaming(false); setNameVal(eventName); }
          }}
          className="font-display font-semibold text-[22px] text-[#FAF6EE] placeholder-[#FAF6EE]/50 bg-white/10 border border-white/30 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-white/30 min-w-[240px]"
        />
        <button
          onClick={doRename}
          disabled={busy}
          className="text-[13px] font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition"
          style={{ background: '#1F4D3A', color: '#FAF6EE', border: '1px solid rgba(250,246,238,0.2)' }}
        >
          Save
        </button>
        <button
          onClick={() => { setRenaming(false); setNameVal(eventName); }}
          className="text-[13px] px-3 py-1.5 rounded-lg transition"
          style={{ color: 'rgba(250,246,238,0.7)', border: '1px solid rgba(250,246,238,0.2)', background: 'transparent' }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="inline-flex items-center gap-2 text-[13px] text-[#0F1F18]/70 bg-white border border-[#E5E0D4] px-3 py-2 rounded-xl hover:bg-[#FAF6EE] transition disabled:opacity-50"
          disabled={busy}
          title="More actions"
        >
          <MoreHorizontal size={14} strokeWidth={1.8} />
          More
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[192px] bg-white rounded-xl border border-[#E5E0D4] shadow-lift p-1 text-[13px]"
          align="end"
          sideOffset={4}
        >
          <DropdownMenu.Item
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#FAF6EE] cursor-pointer outline-none"
            onSelect={() => setRenaming(true)}
          >
            <Pencil size={13} strokeWidth={1.8} />
            Rename event
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#FAF6EE] cursor-pointer outline-none"
            onSelect={doDuplicate}
          >
            <Copy size={13} strokeWidth={1.8} />
            Duplicate event
          </DropdownMenu.Item>

          {status === 'published' && (
            <DropdownMenu.Item
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#FAF6EE] cursor-pointer outline-none text-[#0F1F18]/60"
              onSelect={() => doStatus('draft')}
            >
              <RotateCcw size={13} strokeWidth={1.8} />
              Unpublish
            </DropdownMenu.Item>
          )}

          {status === 'draft' && (
            <DropdownMenu.Item
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#FAF6EE] cursor-pointer outline-none text-[#0F1F18]/60"
              onSelect={() => doStatus('archived')}
            >
              <Archive size={13} strokeWidth={1.8} />
              Archive
            </DropdownMenu.Item>
          )}

          {status === 'archived' && (
            <DropdownMenu.Item
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#FAF6EE] cursor-pointer outline-none"
              onSelect={() => doStatus('draft')}
            >
              <RotateCcw size={13} strokeWidth={1.8} />
              Restore to draft
            </DropdownMenu.Item>
          )}

          <DropdownMenu.Separator className="my-1 h-px bg-[#f0f0f0]" />

          <DropdownMenu.Item
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer outline-none"
            onSelect={() => setConfirmDelete(true)}
          >
            <Trash2 size={13} strokeWidth={1.8} />
            Delete event
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
