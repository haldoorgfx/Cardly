'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

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
          className="font-display font-semibold text-[22px] bg-[#1F4D3A]/5 border border-[#1F4D3A]/30 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#1F4D3A]/30 min-w-[240px]"
        />
        <button
          onClick={doRename}
          disabled={busy}
          className="text-[13px] font-semibold text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition"
          style={{ background: 'linear-gradient(135deg,#1F4D3A,#2A6A50)' }}
        >
          Save
        </button>
        <button
          onClick={() => { setRenaming(false); setNameVal(eventName); }}
          className="text-[13px] text-[#0F1F18]/60 px-3 py-1.5 rounded-lg hover:bg-[#FAF6EE] border border-[#E5E0D4] transition"
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
          </svg>
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
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
            Rename event
          </DropdownMenu.Item>

          {status === 'published' && (
            <DropdownMenu.Item
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#FAF6EE] cursor-pointer outline-none text-[#0F1F18]/60"
              onSelect={() => doStatus('draft')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M18.36 6.64A9 9 0 1 1 5.64 17.36" /><path d="M2 12h10" />
              </svg>
              Unpublish
            </DropdownMenu.Item>
          )}

          {status === 'draft' && (
            <DropdownMenu.Item
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#FAF6EE] cursor-pointer outline-none text-[#0F1F18]/60"
              onSelect={() => doStatus('archived')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
              </svg>
              Archive
            </DropdownMenu.Item>
          )}

          {status === 'archived' && (
            <DropdownMenu.Item
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#FAF6EE] cursor-pointer outline-none"
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
            Delete event
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
