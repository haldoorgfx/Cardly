'use client';

import { useState } from 'react';
import { Clock, Smartphone, User, RotateCcw } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import type { AttendeeEntitlement, ActionResult } from './attendee-model';
import { fmtDateTime, shortDevice } from './format';

interface Props {
  ent: AttendeeEntitlement;
  unredeem: (redemptionId: string, reason: string) => Promise<ActionResult>;
  onClose: () => void;
  onDone: () => void;
}

const PRESET_REASONS = [
  { value: 'Scanned by mistake', label: 'Scanned by mistake' },
  { value: 'Duplicate scan', label: 'Duplicate scan' },
  { value: 'Other', label: 'Other' },
];

/**
 * G03 — focused un-redeem confirmation. Surfaces the original scan (time, staff,
 * device) and forces a reason before undoing. A reason is REQUIRED: submit is
 * blocked in the client until one is chosen (and, for "Other", typed). The
 * unredeem_entitlement RPC ALSO enforces this server-side — it returns
 * { status:'error', message:'A reason is required to un-redeem' } for a blank
 * reason — so the gate holds even if the client is bypassed.
 */
export function UnredeemModal({ ent, unredeem, onClose, onDone }: Props) {
  const [choice, setChoice] = useState('');
  const [otherText, setOtherText] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const effectiveReason = choice === 'Other' ? otherText.trim() : choice;
  // Required-reason gate: no choice, or "Other" with empty text → cannot submit.
  const canSubmit = choice !== '' && !(choice === 'Other' && otherText.trim() === '');

  async function submit() {
    if (!canSubmit || !ent.latestRedemptionId) return;
    setPending(true);
    setError('');
    const res = await unredeem(ent.latestRedemptionId, effectiveReason);
    setPending(false);
    if ('error' in res) { setError(res.error); return; }
    onDone();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Un-redeem this scan"
      subtitle={ent.name}
      maxWidth={460}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={pending}
            className="rounded-lg px-4 py-2 text-[13px] font-medium border transition disabled:opacity-60"
            style={{ borderColor: '#E5E0D4', color: '#6B7A72', background: '#FFFFFF' }}>
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={!canSubmit || pending}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: '#1F4D3A' }}>
            {pending ? 'Un-redeeming…' : <><RotateCcw size={14} strokeWidth={2} /> Un-redeem</>}
          </button>
        </>
      }
    >
      {/* Original scan */}
      <div className="rounded-xl p-3.5 mb-4" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
        <p className="text-[11px] uppercase tracking-[0.1em] mb-2" style={{ color: '#6B7A72' }}>Original scan</p>
        <div className="space-y-1.5 text-[13px]" style={{ color: '#3A4A42' }}>
          <p className="flex items-center gap-2"><Clock size={13} strokeWidth={2} style={{ color: '#1F4D3A' }} /> {fmtDateTime(ent.redeemedAt)}</p>
          <p className="flex items-center gap-2"><User size={13} strokeWidth={2} style={{ color: '#6B7A72' }} /> {ent.redeemedByName ?? 'Unknown staff'}</p>
          <p className="flex items-center gap-2"><Smartphone size={13} strokeWidth={1.9} style={{ color: '#6B7A72' }} /> {shortDevice(ent.deviceId)}</p>
        </div>
      </div>

      {/* Required reason */}
      <p className="text-[13px] font-medium mb-2" style={{ color: '#0F1F18' }}>Why are you un-redeeming this? <span style={{ color: '#B8423C' }}>*</span></p>
      <div className="space-y-2">
        {PRESET_REASONS.map((r) => {
          const active = choice === r.value;
          return (
            <button key={r.value} type="button" onClick={() => setChoice(r.value)}
              className="w-full text-left flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-colors"
              style={{ background: active ? '#E8EFEB' : '#FFFFFF', border: `1px solid ${active ? '#1F4D3A' : '#E5E0D4'}` }}>
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
                style={{ borderColor: active ? '#1F4D3A' : '#E5E0D4', background: active ? '#1F4D3A' : '#FFFFFF' }}>
                {active && <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#FFFFFF' }} />}
              </span>
              <span className="text-[13.5px]" style={{ color: '#0F1F18' }}>{r.label}</span>
            </button>
          );
        })}
      </div>

      {choice === 'Other' && (
        <textarea
          value={otherText}
          onChange={(e) => setOtherText(e.target.value)}
          placeholder="Describe the reason"
          rows={2}
          className="mt-2 w-full rounded-lg px-3 py-2 text-[13px] outline-none border resize-none"
          style={{ borderColor: '#E5E0D4', background: '#FFFFFF', color: '#0F1F18' }}
        />
      )}

      {error && (
        <div className="mt-3 px-3.5 py-2.5 rounded-xl text-[12.5px]"
          style={{ background: 'rgba(184,66,60,0.08)', color: '#B8423C', border: '1px solid rgba(184,66,60,0.24)' }}>
          {error}
        </div>
      )}
    </Modal>
  );
}
