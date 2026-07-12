'use client';

import { EntitlementIcon } from '@/components/tickets/EntitlementIcon';
import type { AuditRow } from './audit-model';
import { actionLabel, actionColors, statusLabel, statusColors } from './audit-model';
import { fmtDateTime, shortDevice } from './format';

/**
 * The audit table body. Renders inside a horizontally scrollable wrapper so it
 * stays readable on narrow screens. No monospace anywhere — timestamps, device
 * ids and ledger data all use the normal UI font.
 */
export function AuditTable({ rows }: { rows: AuditRow[] }) {
  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr style={{ background: '#FAF6EE' }}>
              {['Time', 'Attendee', 'Entitlement', 'Action', 'By', 'Device', 'Result'].map((h) => (
                <th key={h} className="text-left text-[10px] uppercase tracking-[0.1em] font-medium px-4 py-3 whitespace-nowrap"
                  style={{ color: '#6B7A72', borderBottom: '1px solid #E5E0D4' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const ac = actionColors(r.action);
              const sc = statusColors(r.status);
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid #F0EEE7' }}>
                  <td className="px-4 py-3 text-[12.5px] whitespace-nowrap" style={{ color: '#3A4A42' }}>{fmtDateTime(r.redeemed_at)}</td>
                  <td className="px-4 py-3">
                    {r.attendee_name ? (
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium truncate max-w-[180px]" style={{ color: '#0F1F18' }}>{r.attendee_name}</p>
                        {r.attendee_email && <p className="text-[11.5px] truncate max-w-[180px]" style={{ color: '#6B7A72' }}>{r.attendee_email}</p>}
                      </div>
                    ) : (
                      <span className="text-[12.5px]" style={{ color: '#9BA8A1' }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {r.entitlement_type && (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                          <EntitlementIcon type={r.entitlement_type} size={13} strokeWidth={1.9} />
                        </span>
                      )}
                      <span className="text-[13px] truncate max-w-[160px]" style={{ color: '#0F1F18' }}>{r.entitlement_name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-medium" style={{ background: ac.bg, color: ac.color }}>
                      {actionLabel(r.action)}
                    </span>
                    {r.reason && <p className="text-[11px] mt-1 max-w-[160px] truncate" style={{ color: '#6B7A72' }}>{r.reason}</p>}
                  </td>
                  <td className="px-4 py-3 text-[12.5px] whitespace-nowrap" style={{ color: '#3A4A42' }}>{r.performedByName ?? '—'}</td>
                  <td className="px-4 py-3 text-[12.5px] whitespace-nowrap" style={{ color: '#3A4A42' }}>
                    {shortDevice(r.device_id)}
                    {r.source === 'offline' && <span className="ml-1.5 text-[11px]" style={{ color: '#C97A2D' }}>offline</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-medium" style={{ background: sc.bg, color: sc.color }}>
                      {statusLabel(r.status)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
