'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, Smartphone, RotateCcw, CalendarClock, ArrowLeftRight, Ban } from 'lucide-react';
import { EntitlementIcon, entitlementTypeLabel } from '@/components/tickets/EntitlementIcon';
import type { AttendeeEntitlement, ActionResult } from './attendee-model';
import { fmtDateTime, shortDevice } from './format';

interface Props {
  ent: AttendeeEntitlement;
  revoke: (entitlementId: string, reason: string) => Promise<ActionResult>;
  onUnredeem: (ent: AttendeeEntitlement) => void;
  onExtend: (ent: AttendeeEntitlement) => void;
  onTransfer: (ent: AttendeeEntitlement) => void;
  onChanged: () => void;
  onError: (msg: string) => void;
}

const STATE_META = {
  held:     { label: 'Held',     bg: '#E8EFEB', color: '#1F4D3A' },
  redeemed: { label: 'Redeemed', bg: 'rgba(45,122,79,0.10)', color: '#2D7A4F' },
  expired:  { label: 'Expired',  bg: 'rgba(201,122,45,0.10)', color: '#C97A2D' },
} as const;

export function AttendeeEntitlementRow({ ent, revoke, onUnredeem, onExtend, onTransfer, onChanged, onError }: Props) {
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [reason, setReason] = useState('');
  const [pending, setPending] = useState(false);

  const meta = STATE_META[ent.state];

  async function doRevoke() {
    setPending(true);
    onError('');
    const res = await revoke(ent.id, reason.trim());
    setPending(false);
    if ('error' in res) { onError(res.error); return; }
    setConfirmRevoke(false);
    setReason('');
    onChanged();
  }

  return (
    <div className="bg-white rounded-2xl border p-4 sm:p-5" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: '#F0EDE6', color: '#6B7A72' }}>
          <EntitlementIcon type={ent.type} size={19} strokeWidth={1.9} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-semibold text-[15.5px] leading-tight" style={{ color: '#0F1F18' }}>{ent.name}</p>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: meta.bg, color: meta.color }}>
              {meta.label}
            </span>
          </div>
          <p className="text-[12.5px] mt-0.5" style={{ color: '#6B7A72' }}>{entitlementTypeLabel(ent.type)}</p>

          {ent.state === 'redeemed' && (
            <div className="mt-2 flex items-center gap-x-3 gap-y-1 flex-wrap text-[12px]" style={{ color: '#3A4A42' }}>
              <span className="inline-flex items-center gap-1"><Clock size={12} strokeWidth={2} style={{ color: '#2D7A4F' }} /> {fmtDateTime(ent.redeemedAt)}</span>
              {ent.redeemedByName && <span className="inline-flex items-center gap-1"><CheckCircle2 size={12} strokeWidth={2} style={{ color: '#6B7A72' }} /> {ent.redeemedByName}</span>}
              <span className="inline-flex items-center gap-1"><Smartphone size={12} strokeWidth={1.9} style={{ color: '#6B7A72' }} /> {shortDevice(ent.deviceId)}</span>
            </div>
          )}
          {ent.state === 'expired' && ent.valid_until && (
            <p className="mt-2 text-[12px]" style={{ color: '#C97A2D' }}>Validity ended {fmtDateTime(ent.valid_until)}</p>
          )}
          {ent.state === 'held' && ent.valid_until && (
            <p className="mt-2 text-[12px]" style={{ color: '#6B7A72' }}>Valid until {fmtDateTime(ent.valid_until)}</p>
          )}
        </div>
      </div>

      {confirmRevoke ? (
        <div className="mt-4 rounded-xl p-3.5" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
          <p className="text-[12.5px] mb-2" style={{ color: '#3A4A42' }}>
            Revoke <span className="font-medium" style={{ color: '#0F1F18' }}>{ent.name}</span> from this attendee? They&apos;ll no longer hold it. Nothing is deleted — this is written to the audit log.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            rows={2}
            className="w-full rounded-lg px-3 py-2 text-[13px] outline-none border resize-none mb-3"
            style={{ borderColor: '#E5E0D4', background: '#FFFFFF', color: '#0F1F18' }}
          />
          <div className="flex items-center gap-2">
            <button type="button" disabled={pending} onClick={doRevoke}
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ background: '#B8423C' }}>
              {pending ? 'Revoking…' : <><Ban size={14} strokeWidth={2} /> Revoke</>}
            </button>
            <button type="button" disabled={pending} onClick={() => { setConfirmRevoke(false); setReason(''); }}
              className="rounded-lg px-3.5 py-2 text-[13px] font-medium border transition disabled:opacity-60"
              style={{ borderColor: '#E5E0D4', color: '#6B7A72', background: '#FFFFFF' }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {ent.state === 'redeemed' && ent.latestRedemptionId && (
            <button type="button" onClick={() => onUnredeem(ent)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium border transition hover:border-[#1F4D3A]/40"
              style={{ borderColor: '#E5E0D4', color: '#3A4A42', background: '#FFFFFF' }}>
              <RotateCcw size={13} strokeWidth={2} /> Un-redeem
            </button>
          )}
          {ent.transferable && (
            <button type="button" onClick={() => onTransfer(ent)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium border transition hover:border-[#1F4D3A]/40"
              style={{ borderColor: '#E5E0D4', color: '#3A4A42', background: '#FFFFFF' }}>
              <ArrowLeftRight size={13} strokeWidth={2} /> Transfer
            </button>
          )}
          <button type="button" onClick={() => onExtend(ent)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium border transition hover:border-[#1F4D3A]/40"
            style={{ borderColor: '#E5E0D4', color: '#3A4A42', background: '#FFFFFF' }}>
            <CalendarClock size={13} strokeWidth={2} /> Extend validity
          </button>
          <button type="button" onClick={() => setConfirmRevoke(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium border transition hover:border-[#B8423C]/40"
            style={{ borderColor: '#E5E0D4', color: '#B8423C', background: '#FFFFFF' }}>
            <Ban size={13} strokeWidth={2} /> Revoke
          </button>
        </div>
      )}
    </div>
  );
}
