'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardList, Ticket, Mail, AlertTriangle } from 'lucide-react';
import type { AttendeeEntitlement, AttendeeHeader, AttendeeActions } from './attendee-model';
import { AttendeeEntitlementRow } from './AttendeeEntitlementRow';
import { GrantPicker } from './GrantPicker';
import { UnredeemModal } from './UnredeemModal';
import { ExtendModal } from './ExtendModal';
import { TransferModal } from './TransferModal';
import { initials } from './format';

interface Props {
  eventSlug: string;
  eventName: string;
  header: AttendeeHeader;
  entitlements: AttendeeEntitlement[];
  actions: AttendeeActions;
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  confirmed:  { bg: '#E8EFEB', color: '#1F4D3A', label: 'Confirmed' },
  checked_in: { bg: 'rgba(45,122,79,0.12)', color: '#2D7A4F', label: 'Checked in' },
  pending:    { bg: 'rgba(201,122,45,0.12)', color: '#C97A2D', label: 'Pending' },
  cancelled:  { bg: 'rgba(184,66,60,0.10)', color: '#B8423C', label: 'Cancelled' },
  refunded:   { bg: 'rgba(58,107,140,0.10)', color: '#3A6B8C', label: 'Refunded' },
};

export function AttendeeEntitlementsClient({ eventSlug, header, entitlements, actions }: Props) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [unredeemTarget, setUnredeemTarget] = useState<AttendeeEntitlement | null>(null);
  const [extendTarget, setExtendTarget] = useState<AttendeeEntitlement | null>(null);
  const [transferTarget, setTransferTarget] = useState<AttendeeEntitlement | null>(null);

  const held = entitlements.filter((e) => e.held);
  const grantable = entitlements.filter((e) => !e.held);
  const status = STATUS_STYLE[header.status] ?? { bg: '#F0EEE7', color: '#6B7A72', label: header.status };

  const onChanged = () => router.refresh();
  const closeAndRefresh = (close: () => void) => { close(); router.refresh(); };

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8 pb-24">

        <Link href={`/events/${eventSlug}/registrations/${header.registrationId}`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-4 transition hover:text-[#1F4D3A]"
          style={{ color: '#6B7A72' }}>
          <ArrowLeft size={15} strokeWidth={2} /> Back to attendee
        </Link>

        {/* Attendee header */}
        <div className="bg-white rounded-2xl border p-5 mb-5" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white font-display text-[18px] font-semibold"
              style={{ background: 'linear-gradient(135deg,#1F4D3A,#2A6A50)' }}>
              {initials(header.name)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display font-semibold text-[22px] leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
                {header.name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap mt-2">
                {header.ticketName && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                    <Ticket size={11} strokeWidth={2} /> {header.ticketName}
                  </span>
                )}
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium" style={{ background: status.bg, color: status.color }}>
                  {status.label}
                </span>
              </div>
              {header.email && (
                <p className="flex items-center gap-1.5 text-[12.5px] mt-2" style={{ color: '#6B7A72' }}>
                  <Mail size={12} strokeWidth={1.9} /> {header.email}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <GrantPicker candidates={grantable} grant={actions.grant} onChanged={onChanged} onError={setError} />
          <Link href={`/events/${eventSlug}/analytics/audit?registration=${header.registrationId}`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium transition hover:text-[#163828]"
            style={{ color: '#1F4D3A' }}>
            <ClipboardList size={14} strokeWidth={2} /> View audit log
          </Link>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
            style={{ background: 'rgba(184,66,60,0.08)', border: '1px solid rgba(184,66,60,0.24)' }}>
            <AlertTriangle size={15} strokeWidth={2} className="mt-0.5 shrink-0" style={{ color: '#B8423C' }} />
            <p className="text-[12.5px]" style={{ color: '#B8423C' }}>{error}</p>
          </div>
        )}

        {/* Held entitlements */}
        {held.length === 0 ? (
          <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: '#E5E0D4' }}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
              <Ticket size={22} strokeWidth={1.9} />
            </div>
            <p className="font-display text-[17px] font-semibold" style={{ color: '#0F1F18' }}>No entitlements held</p>
            <p className="text-[14px] mt-1.5" style={{ color: '#6B7A72' }}>
              This attendee doesn&apos;t hold any entitlements yet. Use &ldquo;Grant entitlement&rdquo; to add one.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {held.map((e) => (
              <AttendeeEntitlementRow
                key={e.id}
                ent={e}
                revoke={actions.revoke}
                onUnredeem={setUnredeemTarget}
                onExtend={setExtendTarget}
                onTransfer={setTransferTarget}
                onChanged={onChanged}
                onError={setError}
              />
            ))}
          </div>
        )}
      </div>

      {unredeemTarget && (
        <UnredeemModal
          ent={unredeemTarget}
          unredeem={actions.unredeem}
          onClose={() => setUnredeemTarget(null)}
          onDone={() => closeAndRefresh(() => setUnredeemTarget(null))}
        />
      )}
      {extendTarget && (
        <ExtendModal
          ent={extendTarget}
          extend={actions.extend}
          onClose={() => setExtendTarget(null)}
          onDone={() => closeAndRefresh(() => setExtendTarget(null))}
        />
      )}
      {transferTarget && (
        <TransferModal
          ent={transferTarget}
          fromName={header.name}
          searchTargets={actions.searchTargets}
          lookupByEmail={actions.lookupByEmail}
          transfer={actions.transfer}
          onClose={() => setTransferTarget(null)}
          onDone={() => closeAndRefresh(() => setTransferTarget(null))}
        />
      )}
    </div>
  );
}
