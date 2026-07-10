'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, RotateCw, Banknote, ShieldAlert, Wallet } from 'lucide-react';

export interface StaffCash {
  staff_user_id: string;
  staff_name: string;
  transactions: number;
  collected: number;
  open_shifts: number;
  reconciled_shifts: number;
  counted_total: number;
}

interface Props {
  eventSlug: string;
  currency: string;
  grandTotal: number;
  staff: StaffCash[] | null;
  loadError: 'auth' | 'generic' | null;
}

/** Money formatter — renders in Inter, never mono. */
function fmtMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

/** A staff row is "settled" only when it has reconciled shifts and none still open. */
function settlementOf(s: StaffCash): 'not_counted' | 'in_progress' | 'settled' {
  if (s.reconciled_shifts === 0) return 'not_counted';
  if (s.open_shifts > 0) return 'in_progress';
  return 'settled';
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function buildCsv(staff: StaffCash[], grandTotal: number): string {
  const rows: string[] = ['Staff,Transactions,Collected,Open shifts,Reconciled shifts,Counted total,Variance'];
  staff.forEach((s) => {
    const settlement = settlementOf(s);
    const variance = settlement === 'settled' ? String(s.counted_total - s.collected) : '';
    rows.push([
      csvCell(s.staff_name), csvCell(s.transactions), csvCell(s.collected),
      csvCell(s.open_shifts), csvCell(s.reconciled_shifts), csvCell(s.counted_total), csvCell(variance),
    ].join(','));
  });
  rows.push([csvCell('Grand total'), '', csvCell(grandTotal), '', '', '', ''].join(','));
  return rows.join('\n');
}

export function CashReconciliationClient({ eventSlug, currency, grandTotal, staff, loadError }: Props) {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);

  const hasCash = !!staff && staff.length > 0;
  const holdingCash = (staff ?? []).filter((s) => s.open_shifts > 0);
  const openShiftCount = holdingCash.reduce((n, s) => n + s.open_shifts, 0);

  function handleExport() {
    if (!staff || staff.length === 0) return;
    setExporting(true);
    try {
      const blob = new Blob([buildCsv(staff, grandTotal)], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cash-${eventSlug}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-8 pb-24">

        <Link href={`/events/${eventSlug}`} className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-4 transition hover:text-[#1F4D3A]" style={{ color: '#6B7A72' }}>
          <ArrowLeft size={15} strokeWidth={2} /> Back to event
        </Link>

        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-semibold text-[24px] sm:text-[28px] leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
              Cash overview
            </h1>
            <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
              Every cash sale taken at the door, rolled up per staff member. Counted totals and variance appear once a staff member hands over and reconciles their shift.
            </p>
          </div>
          {hasCash && (
            <button onClick={handleExport} disabled={exporting} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#163828] disabled:opacity-60 shrink-0" style={{ background: '#1F4D3A' }}>
              <Download size={15} strokeWidth={2} /> Export CSV
            </button>
          )}
        </div>

        {loadError ? (
          <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: '#E5E0D4' }}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: loadError === 'auth' ? 'rgba(184,66,60,0.10)' : '#E8EFEB', color: loadError === 'auth' ? '#B8423C' : '#1F4D3A' }}>
              <ShieldAlert size={22} strokeWidth={1.9} />
            </div>
            <p className="font-display text-[17px] font-semibold" style={{ color: '#0F1F18' }}>
              {loadError === 'auth' ? 'You can’t manage this event' : 'Couldn’t load cash overview'}
            </p>
            <p className="text-[14px] mt-1.5 mb-5" style={{ color: '#6B7A72' }}>
              {loadError === 'auth' ? 'Only the event owner or its staff can see cash takings.' : 'Something went wrong fetching the reconciliation.'}
            </p>
            {loadError === 'generic' && (
              <button onClick={() => router.refresh()} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[14px] font-medium text-white transition hover:bg-[#163828]" style={{ background: '#1F4D3A' }}>
                <RotateCw size={15} strokeWidth={2} /> Retry
              </button>
            )}
          </div>
        ) : !hasCash ? (
          <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: '#E5E0D4' }}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
              <Banknote size={22} strokeWidth={1.9} />
            </div>
            <p className="font-display text-[18px] font-semibold" style={{ color: '#0F1F18' }}>No cash taken</p>
            <p className="text-[14px] mt-1.5" style={{ color: '#6B7A72' }}>
              When staff register walk-ins and take cash at the door, their takings show up here per person, with a running grand total.
            </p>
          </div>
        ) : (
          <>
            {/* Grand total */}
            <div className="rounded-2xl border p-6 mb-4" style={{ background: 'white', borderColor: '#E5E0D4' }}>
              <div className="text-[12px] font-semibold tracking-[0.08em] uppercase" style={{ color: '#6B7A72' }}>Total cash collected</div>
              <div className="font-display font-bold text-[40px] leading-none mt-2" style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}>
                {fmtMoney(grandTotal, currency)}
              </div>
            </div>

            {/* Open-shift indicator — who still holds cash */}
            {openShiftCount > 0 && (
              <div className="rounded-xl border px-4 py-3 mb-4 flex items-start gap-2.5" style={{ background: '#FDF6EC', borderColor: 'rgba(201,122,45,0.35)' }}>
                <Wallet size={16} strokeWidth={2} className="mt-0.5 shrink-0" style={{ color: '#C97A2D' }} />
                <p className="text-[13px]" style={{ color: '#3A4A42' }}>
                  <span className="font-semibold" style={{ color: '#C97A2D' }}>{openShiftCount} shift{openShiftCount === 1 ? '' : 's'} still open.</span>{' '}
                  {holdingCash.map((s) => s.staff_name).join(', ')} {holdingCash.length === 1 ? 'is' : 'are'} still holding cash — variance is final only after they hand over.
                </p>
              </div>
            )}

            {/* Per-staff table */}
            <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E0D4' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ borderCollapse: 'collapse', minWidth: 640 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E0D4' }}>
                      {['Staff', 'Txns', 'Collected', 'Shifts', 'Counted', 'Variance'].map((h, i) => (
                        <th key={h} className={`px-4 py-3 text-[11px] font-semibold tracking-[0.06em] uppercase ${i === 0 ? 'text-left' : 'text-right'}`} style={{ color: '#6B7A72', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {staff!.map((s) => {
                      const settlement = settlementOf(s);
                      const variance = s.counted_total - s.collected;
                      const isShortfall = settlement === 'settled' && variance < 0;
                      const varColor = isShortfall ? '#B8423C' : variance > 0 ? '#0F1F18' : '#6B7A72';
                      return (
                        <tr key={s.staff_user_id} style={{ borderBottom: '1px solid #F0EBDF' }}>
                          <td className="px-4 py-3.5" style={{ whiteSpace: 'nowrap' }}>
                            <div className="text-[14px] font-semibold" style={{ color: '#0F1F18' }}>{s.staff_name}</div>
                            {s.open_shifts > 0 && (
                              <span className="inline-block mt-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FDF6EC', color: '#C97A2D', border: '1px solid rgba(201,122,45,0.3)' }}>
                                {s.open_shifts} open
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right text-[14px]" style={{ color: '#3A4A42', whiteSpace: 'nowrap' }}>{s.transactions}</td>
                          <td className="px-4 py-3.5 text-right text-[14px] font-semibold" style={{ color: '#0F1F18', whiteSpace: 'nowrap' }}>{fmtMoney(s.collected, currency)}</td>
                          <td className="px-4 py-3.5 text-right text-[13px]" style={{ color: '#6B7A72', whiteSpace: 'nowrap' }}>
                            {s.reconciled_shifts} reconciled{s.open_shifts > 0 ? ` · ${s.open_shifts} open` : ''}
                          </td>
                          <td className="px-4 py-3.5 text-right text-[14px]" style={{ color: settlement === 'not_counted' ? '#6B7A72' : '#0F1F18', whiteSpace: 'nowrap' }}>
                            {settlement === 'not_counted' ? '—' : fmtMoney(s.counted_total, currency)}
                          </td>
                          <td className="px-4 py-3.5 text-right text-[14px] font-semibold" style={{ color: settlement === 'settled' ? varColor : '#6B7A72', whiteSpace: 'nowrap' }}>
                            {settlement === 'not_counted' ? '—'
                              : settlement === 'in_progress' ? 'In progress'
                              : `${variance > 0 ? '+' : ''}${fmtMoney(variance, currency)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-[12px] mt-3" style={{ color: '#6B7A72' }}>
              Variance is counted cash minus what was collected, shown once a staff member has reconciled every shift. A shortfall is flagged; anything over is neutral.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
