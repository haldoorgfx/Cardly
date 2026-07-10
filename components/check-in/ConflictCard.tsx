'use client';

import { useState } from 'react';
import { Clock, Smartphone, Check, AlertTriangle } from 'lucide-react';
import { EntitlementIcon } from '@/components/tickets/EntitlementIcon';
import type { Conflict, ResolveAction, ResolveResult, ResolveActionFn } from './conflict-types';

function fmtClock(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}

function syncDelta(scanned: string | null, synced: string | null): string | null {
  if (!scanned || !synced) return null;
  const a = new Date(scanned).getTime();
  const b = new Date(synced).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  const s = Math.round((b - a) / 1000);
  if (s < 60) return `synced ${s}s later`;
  const m = Math.floor(s / 60);
  if (m < 60) return `synced ${m}m later`;
  const h = Math.floor(m / 60);
  if (h < 24) return `synced ${h}h later`;
  return `synced ${Math.floor(h / 24)}d later`;
}

function shortDevice(id: string | null): string {
  if (!id) return 'Unknown device';
  return id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

export function summarizeResolution(conflict: Conflict, r: ResolveResult): string {
  if (r.action === 'keep_both') return 'Kept both scans — recorded as a legitimate double redemption.';
  const kept = conflict.rows.find((x) => x.redemption_id === r.kept_redemption_id);
  const time = kept ? fmtClock(kept.scanned_at) : '';
  const dev = kept ? shortDevice(kept.device_id) : 'a device';
  const n = r.superseded_ids.length;
  return `Kept the ${time} scan from ${dev} · ${n} superseded`;
}

interface Props {
  conflict: Conflict;
  resolveAction: ResolveActionFn;
  onResolved: (summary: string) => void;
}

export function ConflictCard({ conflict, resolveAction, onResolved }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ResolveAction | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: ResolveAction, keepRedemptionId?: string | null) {
    setPending(true);
    setError(null);
    const res = await resolveAction({
      registrationId: conflict.registration_id,
      entitlementId: conflict.entitlement_id,
      dayIndex: conflict.day_index,
      action,
      keepRedemptionId: keepRedemptionId ?? null,
    });
    setPending(false);
    if ('error' in res) { setError(res.error); return; }
    onResolved(summarizeResolution(conflict, res.result));
  }

  const confirmCopy = confirm === 'keep_first'
    ? 'Keep the earliest scan and supersede the rest? The other scans stay in the audit log.'
    : 'Keep the selected scan and supersede the rest? The other scans stay in the audit log.';

  return (
    <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E5E0D4' }}>
      {/* Header: attendee + entitlement + day */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
          <EntitlementIcon type={conflict.entitlement_type} size={19} strokeWidth={1.9} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-[16px] leading-tight truncate" style={{ color: '#0F1F18' }}>
            {conflict.attendee_name ?? 'Unknown attendee'}
          </p>
          <p className="text-[12.5px] mt-0.5 truncate" style={{ color: '#6B7A72' }}>
            {conflict.entitlement_name}
            {conflict.day_index != null ? ` · Day ${conflict.day_index + 1}` : ''}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ background: 'rgba(201,122,45,0.10)', color: '#C97A2D', border: '1px solid rgba(201,122,45,0.28)' }}>
          <AlertTriangle size={11} strokeWidth={2} /> {conflict.rows.length} scans
        </span>
      </div>

      {/* Competing scans */}
      <div className="space-y-2 mb-4">
        {conflict.rows.map((row, i) => {
          const isSel = selected === row.redemption_id;
          const delta = syncDelta(row.scanned_at, row.synced_at);
          return (
            <button
              key={row.redemption_id}
              type="button"
              onClick={() => setSelected(isSel ? null : row.redemption_id)}
              disabled={pending}
              className="w-full text-left flex items-center gap-3 rounded-xl px-3.5 py-3 transition-colors disabled:opacity-60"
              style={{
                background: isSel ? '#E8EFEB' : '#FAF6EE',
                border: `1px solid ${isSel ? '#1F4D3A' : '#E5E0D4'}`,
              }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: isSel ? '#1F4D3A' : '#FFFFFF', color: isSel ? '#FFFFFF' : '#6B7A72', border: isSel ? 'none' : '1px solid #E5E0D4' }}>
                {isSel ? <Check size={15} strokeWidth={2.5} /> : <Smartphone size={14} strokeWidth={1.8} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[13.5px] font-medium" style={{ color: '#0F1F18' }}>
                  <Clock size={12.5} strokeWidth={2} style={{ color: '#1F4D3A' }} />
                  {fmtClock(row.scanned_at)}
                  <span className="text-[12px] font-normal" style={{ color: '#6B7A72' }}>
                    · {shortDevice(row.device_id)}
                  </span>
                </div>
                <div className="text-[11.5px] mt-0.5" style={{ color: '#6B7A72' }}>
                  {row.synced_at
                    ? `Reached server ${fmtClock(row.synced_at)}${delta ? ` · ${delta}` : ''}`
                    : 'Not yet synced'}
                </div>
              </div>
              {i === 0 && (
                <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em]"
                  style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                  Earliest
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="px-3.5 py-2.5 rounded-xl text-[12.5px] mb-3"
          style={{ background: 'rgba(184,66,60,0.08)', color: '#B8423C', border: '1px solid rgba(184,66,60,0.24)' }}>
          {error}
        </div>
      )}

      {/* Actions / confirm */}
      {confirm ? (
        <div className="rounded-xl p-3.5" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
          <p className="text-[12.5px] mb-3" style={{ color: '#3A4A42' }}>{confirmCopy}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(confirm, confirm === 'manual' ? selected : null)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              style={{ background: '#1F4D3A' }}
            >
              {pending ? 'Resolving…' : <><Check size={14} strokeWidth={2.5} /> Confirm</>}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirm(null)}
              className="rounded-lg px-3.5 py-2 text-[13px] font-medium border transition disabled:opacity-60"
              style={{ borderColor: '#E5E0D4', color: '#6B7A72', background: '#FFFFFF' }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirm('keep_first')}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-[#163828] disabled:opacity-60"
            style={{ background: '#1F4D3A' }}
          >
            Keep first
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run('keep_both')}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium border transition hover:border-[#1F4D3A]/40 disabled:opacity-60"
            style={{ borderColor: '#E5E0D4', color: '#3A4A42', background: '#FFFFFF' }}
          >
            Keep both
          </button>
          <button
            type="button"
            disabled={pending || !selected}
            onClick={() => setConfirm('manual')}
            title={selected ? 'Keep the selected scan' : 'Select a scan above first'}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium border transition disabled:opacity-45"
            style={{ borderColor: selected ? '#1F4D3A' : '#E5E0D4', color: selected ? '#1F4D3A' : '#9BA8A1', background: '#FFFFFF' }}
          >
            Choose selected
          </button>
        </div>
      )}
    </div>
  );
}
