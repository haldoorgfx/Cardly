'use client';

import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { EntitlementIcon, entitlementTypeLabel } from '@/components/tickets/EntitlementIcon';
import type { AttendeeEntitlement, ActionResult } from './attendee-model';

interface Props {
  candidates: AttendeeEntitlement[];
  grant: (entitlementId: string) => Promise<ActionResult>;
  onChanged: () => void;
  onError: (msg: string) => void;
}

/**
 * "+ Grant entitlement" — shows only entitlements this attendee does NOT
 * currently hold. Granting writes a 'granted' ledger row (nothing is deleted).
 */
export function GrantPicker({ candidates, grant, onChanged, onError }: Props) {
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function doGrant(entId: string) {
    setPendingId(entId);
    onError('');
    const res = await grant(entId);
    setPendingId(null);
    if ('error' in res) { onError(res.error); return; }
    setOpen(false);
    onChanged();
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-[13.5px] font-medium border transition hover:border-[#1F4D3A]/40 hover:text-[#1F4D3A]"
        style={{ borderColor: '#E5E0D4', color: '#3A4A42', background: '#FFFFFF' }}>
        <Plus size={15} strokeWidth={2.2} /> Grant entitlement
      </button>

      {open && (
        <Modal open onClose={() => setOpen(false)} title="Grant an entitlement" subtitle="Only entitlements this attendee doesn't already hold" maxWidth={460}>
          {candidates.length === 0 ? (
            <p className="text-[13.5px] py-6 text-center" style={{ color: '#6B7A72' }}>
              This attendee already holds every entitlement for this event.
            </p>
          ) : (
            <div className="space-y-1.5">
              {candidates.map((c) => (
                <button key={c.id} type="button" disabled={pendingId !== null} onClick={() => doGrant(c.id)}
                  className="w-full text-left flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[#FAF6EE] border disabled:opacity-60"
                  style={{ borderColor: '#E5E0D4', background: '#FFFFFF' }}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                    <EntitlementIcon type={c.type} size={17} strokeWidth={1.9} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium truncate" style={{ color: '#0F1F18' }}>{c.name}</p>
                    <p className="text-[12px]" style={{ color: '#6B7A72' }}>{entitlementTypeLabel(c.type)}</p>
                  </div>
                  {pendingId === c.id
                    ? <span className="text-[12.5px]" style={{ color: '#1F4D3A' }}>Granting…</span>
                    : <Check size={15} strokeWidth={2} style={{ color: '#6B7A72' }} />}
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
