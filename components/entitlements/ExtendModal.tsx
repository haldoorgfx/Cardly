'use client';

import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { toLocalInput } from '@/components/tickets/entitlement-model';
import type { AttendeeEntitlement, ActionResult } from './attendee-model';
import { fmtDateTime } from './format';

interface Props {
  ent: AttendeeEntitlement;
  extend: (entitlementId: string, validUntilIso: string) => Promise<ActionResult>;
  onClose: () => void;
  onDone: () => void;
}

/**
 * Extend an entitlement's validity window (push out valid_until). This is an
 * entitlement-level change — it applies to everyone who holds it, not just this
 * attendee — so the copy says so. Writes an 'extended' row to the audit ledger.
 */
export function ExtendModal({ ent, extend, onClose, onDone }: Props) {
  const [value, setValue] = useState(toLocalInput(ent.valid_until));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!value) { setError('Pick a new end date and time.'); return; }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) { setError('That date and time is not valid.'); return; }
    setPending(true);
    setError('');
    const res = await extend(ent.id, d.toISOString());
    setPending(false);
    if ('error' in res) { setError(res.error); return; }
    onDone();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Extend validity"
      subtitle={ent.name}
      maxWidth={440}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={pending}
            className="rounded-lg px-4 py-2 text-[13px] font-medium border transition disabled:opacity-60"
            style={{ borderColor: '#E5E0D4', color: '#65736B', background: '#FFFFFF' }}>
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ background: '#1F4D3A' }}>
            {pending ? 'Saving…' : <><CalendarClock size={14} strokeWidth={2} /> Extend</>}
          </button>
        </>
      }
    >
      <p className="text-[13px] mb-4" style={{ color: '#3A4A42' }}>
        This changes the entitlement&apos;s validity for <span className="font-medium" style={{ color: '#0F1F18' }}>everyone</span> who holds it, not just this attendee.
        {ent.valid_until ? <> Currently valid until <span className="font-medium" style={{ color: '#0F1F18' }}>{fmtDateTime(ent.valid_until)}</span>.</> : ' It has no end date yet.'}
      </p>
      <label className="block text-[11px] uppercase tracking-[0.1em] mb-1.5" style={{ color: '#65736B' }}>New valid-until</label>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full h-10 px-3 rounded-lg text-[14px] outline-none border"
        style={{ borderColor: '#E5E0D4', background: '#FFFFFF', color: '#0F1F18' }}
      />
      {error && (
        <div className="mt-3 px-3.5 py-2.5 rounded-xl text-[12.5px]"
          style={{ background: 'rgba(184,66,60,0.08)', color: '#B8423C', border: '1px solid rgba(184,66,60,0.24)' }}>
          {error}
        </div>
      )}
    </Modal>
  );
}
