'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldAlert, RotateCw, ClipboardList, X, Filter } from 'lucide-react';
import { AuditTable } from './AuditTable';
import { AUDIT_ACTIONS, AUDIT_STATUSES, type AuditRow, type AuditFilters, type StaffOption } from './audit-model';
import type { EntitlementType } from '@/components/tickets/EntitlementIcon';

interface EntOption { id: string; name: string; type: EntitlementType }

interface Props {
  eventSlug: string;
  rows: AuditRow[] | null;
  loadError: 'auth' | 'generic' | null;
  entitlements: EntOption[];
  staffOptions: StaffOption[];
  initialRegistrationId: string;
  initialEntitlementId: string;
}

const EMPTY: AuditFilters = { attendee: '', entitlementId: '', performedBy: '', action: '', status: '', from: '', to: '' };
const selCls = 'h-9 px-3 rounded-lg text-[13px] outline-none border bg-white';
const selStyle = { borderColor: '#E5E0D4', color: '#0F1F18' } as const;

export function AuditLogClient({ eventSlug, rows, loadError, entitlements, staffOptions, initialRegistrationId, initialEntitlementId }: Props) {
  const router = useRouter();
  const [filters, setFilters] = useState<AuditFilters>({ ...EMPTY, entitlementId: initialEntitlementId });
  const [registrationId, setRegistrationId] = useState(initialRegistrationId);

  const set = (patch: Partial<AuditFilters>) => setFilters((f) => ({ ...f, ...patch }));

  const chipName = useMemo(() => {
    if (!registrationId) return null;
    const hit = (rows ?? []).find((r) => r.registration_id === registrationId);
    return hit?.attendee_name ?? 'this attendee';
  }, [registrationId, rows]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = filters.attendee.trim().toLowerCase();
    const fromT = filters.from ? new Date(filters.from).getTime() : null;
    const toT = filters.to ? new Date(filters.to).getTime() : null;
    return rows.filter((r) => {
      if (registrationId && r.registration_id !== registrationId) return false;
      if (q) {
        const hay = `${r.attendee_name ?? ''} ${r.attendee_email ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.entitlementId && r.entitlement_id !== filters.entitlementId) return false;
      if (filters.performedBy && r.performed_by !== filters.performedBy) return false;
      if (filters.action && r.action !== filters.action) return false;
      if (filters.status && r.status !== filters.status) return false;
      const t = new Date(r.redeemed_at).getTime();
      if (fromT !== null && t < fromT) return false;
      if (toT !== null && t > toT) return false;
      return true;
    });
  }, [rows, filters, registrationId]);

  const hasActiveFilters = registrationId !== '' || filters.attendee !== '' || filters.entitlementId !== '' ||
    filters.performedBy !== '' || filters.action !== '' || filters.status !== '' || filters.from !== '' || filters.to !== '';

  function clearAll() {
    setFilters(EMPTY);
    setRegistrationId('');
  }

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 pb-24">

        <Link href={`/events/${eventSlug}/analytics/redemption`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-4 transition hover:text-[#1F4D3A]" style={{ color: '#6B7A72' }}>
          <ArrowLeft size={15} strokeWidth={2} /> Back to redemption
        </Link>
        <div className="mb-6">
          <h1 className="font-display font-semibold text-[24px] sm:text-[28px] leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            Entitlement audit log
          </h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
            Every entitlement action — redeem, un-redeem, grant, revoke, transfer, extend — in one append-only trail. Nothing is ever deleted.
          </p>
        </div>

        {loadError ? (
          <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: '#E5E0D4' }}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'rgba(184,66,60,0.10)', color: '#B8423C' }}>
              <ShieldAlert size={22} strokeWidth={1.9} />
            </div>
            <p className="font-display text-[17px] font-semibold" style={{ color: '#0F1F18' }}>
              {loadError === 'auth' ? 'You can’t view this audit log' : 'Couldn’t load the audit log'}
            </p>
            <p className="text-[14px] mt-1.5 mb-5" style={{ color: '#6B7A72' }}>
              {loadError === 'auth' ? 'Only the event owner or its staff can view the entitlement audit log.' : 'Something went wrong fetching the audit trail.'}
            </p>
            {loadError === 'generic' && (
              <button onClick={() => router.refresh()}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[14px] font-medium text-white transition hover:bg-[#163828]" style={{ background: '#1F4D3A' }}>
                <RotateCw size={15} strokeWidth={2} /> Retry
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Filter bar */}
            <div className="bg-white rounded-2xl border p-4 mb-4" style={{ borderColor: '#E5E0D4' }}>
              <div className="flex items-center gap-2 mb-3">
                <Filter size={14} strokeWidth={2} style={{ color: '#6B7A72' }} />
                <span className="text-[12px] font-medium" style={{ color: '#3A4A42' }}>Filters</span>
                {hasActiveFilters && (
                  <button onClick={clearAll} className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: '#1F4D3A' }}>
                    <X size={12} strokeWidth={2} /> Clear all
                  </button>
                )}
              </div>

              {registrationId && (
                <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12.5px] font-medium"
                  style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                  Attendee · {chipName}
                  <button onClick={() => setRegistrationId('')} aria-label="Clear attendee filter"><X size={12} strokeWidth={2.2} /></button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <input value={filters.attendee} onChange={(e) => set({ attendee: e.target.value })}
                  placeholder="Attendee name or email" className={`${selCls} flex-1 min-w-[180px]`} style={selStyle} />

                <select value={filters.entitlementId} onChange={(e) => set({ entitlementId: e.target.value })} className={selCls} style={selStyle}>
                  <option value="">All entitlements</option>
                  {entitlements.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>

                <select value={filters.performedBy} onChange={(e) => set({ performedBy: e.target.value })} className={selCls} style={selStyle}>
                  <option value="">All staff</option>
                  {staffOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                <select value={filters.action} onChange={(e) => set({ action: e.target.value })} className={selCls} style={selStyle}>
                  <option value="">All actions</option>
                  {AUDIT_ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>

                <select value={filters.status} onChange={(e) => set({ status: e.target.value })} className={selCls} style={selStyle}>
                  <option value="">All results</option>
                  {AUDIT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <label className="text-[11px] uppercase tracking-[0.1em]" style={{ color: '#6B7A72' }}>From</label>
                <input type="datetime-local" value={filters.from} onChange={(e) => set({ from: e.target.value })} className={selCls} style={selStyle} />
                <label className="text-[11px] uppercase tracking-[0.1em]" style={{ color: '#6B7A72' }}>To</label>
                <input type="datetime-local" value={filters.to} onChange={(e) => set({ to: e.target.value })} className={selCls} style={selStyle} />
              </div>
            </div>

            {/* Count */}
            <p className="text-[13px] mb-3" style={{ color: '#6B7A72' }}>
              {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}{hasActiveFilters && rows ? ` of ${rows.length}` : ''}
            </p>

            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: '#E5E0D4' }}>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                  <ClipboardList size={22} strokeWidth={1.9} />
                </div>
                <p className="font-display text-[17px] font-semibold" style={{ color: '#0F1F18' }}>
                  {rows && rows.length > 0 ? 'No entries match your filters' : 'No audit activity yet'}
                </p>
                <p className="text-[14px] mt-1.5" style={{ color: '#6B7A72' }}>
                  {rows && rows.length > 0
                    ? 'Try widening the date range or clearing a filter.'
                    : 'Entitlement actions will appear here as they happen — redeems, grants, transfers and more.'}
                </p>
              </div>
            ) : (
              <AuditTable rows={filtered} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
