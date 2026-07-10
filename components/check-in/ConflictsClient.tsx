'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RotateCw, ShieldAlert, CheckCircle2, GitMerge } from 'lucide-react';
import { ConflictCard } from './ConflictCard';
import { conflictKey, type Conflict, type ResolveActionFn } from './conflict-types';

interface Props {
  eventSlug: string;
  conflicts: Conflict[] | null;
  lastSync: string | null;
  loadError: 'auth' | 'generic' | null;
  resolveConflictAction: ResolveActionFn;
}

function fmtLastSync(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

export function ConflictsClient({ eventSlug, conflicts, lastSync, loadError, resolveConflictAction }: Props) {
  const router = useRouter();
  const [active, setActive] = useState<Conflict[]>(conflicts ?? []);
  const [resolved, setResolved] = useState<{ key: string; summary: string }[]>([]);

  function handleResolved(key: string, summary: string) {
    setActive((prev) => prev.filter((c) => conflictKey(c) !== key));
    setResolved((prev) => [{ key, summary }, ...prev]);
  }

  const lastSyncLabel = fmtLastSync(lastSync);

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8 pb-24">

        {/* Header */}
        <Link
          href={`/events/${eventSlug}/check-in`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-4 transition hover:text-[#1F4D3A]"
          style={{ color: '#6B7A72' }}
        >
          <ArrowLeft size={15} strokeWidth={2} /> Back to check-in
        </Link>
        <div className="mb-6">
          <h1 className="font-display font-semibold text-[24px] sm:text-[28px] leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            Sync conflicts
          </h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
            When two devices scan the same attendee offline, both scans replay on reconnect. Pick which one counts — nothing is ever deleted, superseded scans stay in the audit log.
          </p>
        </div>

        {/* Error state */}
        {loadError ? (
          <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: '#E5E0D4' }}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(184,66,60,0.10)', color: '#B8423C' }}>
              <ShieldAlert size={22} strokeWidth={1.9} />
            </div>
            <p className="font-display text-[17px] font-semibold" style={{ color: '#0F1F18' }}>
              {loadError === 'auth' ? 'You can’t manage this event' : 'Couldn’t load conflicts'}
            </p>
            <p className="text-[14px] mt-1.5 mb-5" style={{ color: '#6B7A72' }}>
              {loadError === 'auth'
                ? 'Only the event owner or its staff can resolve sync conflicts.'
                : 'Something went wrong fetching the sync conflicts.'}
            </p>
            {loadError === 'generic' && (
              <button
                onClick={() => router.refresh()}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[14px] font-medium text-white transition hover:bg-[#163828]"
                style={{ background: '#1F4D3A' }}
              >
                <RotateCw size={15} strokeWidth={2} /> Retry
              </button>
            )}
          </div>
        ) : active.length === 0 ? (
          /* All-synced success state */
          <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: '#E5E0D4' }}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: '#E8EFEB', color: '#2D7A4F' }}>
              <CheckCircle2 size={24} strokeWidth={1.9} />
            </div>
            <p className="font-display text-[18px] font-semibold" style={{ color: '#0F1F18' }}>
              {resolved.length > 0 ? 'All conflicts resolved' : 'Everything’s in sync'}
            </p>
            <p className="text-[14px] mt-1.5" style={{ color: '#6B7A72' }}>
              {resolved.length > 0
                ? 'No conflicts left to review — every scan for this event is reconciled.'
                : 'No offline scan conflicts for this event. Every device is reconciled.'}
            </p>
            {lastSyncLabel && (
              <p className="text-[12.5px] mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1"
                style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#6B7A72' }}>
                Last offline sync · {lastSyncLabel}
              </p>
            )}
            {resolved.length > 0 && (
              <div className="mt-6 text-left space-y-2">
                {resolved.map((r) => (
                  <div key={r.key} className="flex items-start gap-2.5 rounded-xl px-4 py-3"
                    style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
                    <GitMerge size={15} strokeWidth={2} className="mt-0.5 shrink-0" style={{ color: '#2D7A4F' }} />
                    <span className="text-[13px]" style={{ color: '#3A4A42' }}>{r.summary}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Count + recently resolved */}
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <p className="text-[13px] font-medium" style={{ color: '#3A4A42' }}>
                {active.length} unresolved {active.length === 1 ? 'conflict' : 'conflicts'}
                {lastSyncLabel ? <span style={{ color: '#6B7A72', fontWeight: 400 }}> · last sync {lastSyncLabel}</span> : null}
              </p>
            </div>

            {resolved.length > 0 && (
              <div className="mb-4 space-y-2">
                {resolved.map((r) => (
                  <div key={r.key} className="flex items-start gap-2.5 rounded-xl px-4 py-3"
                    style={{ background: '#E8EFEB', border: '1px solid rgba(45,122,79,0.28)' }}>
                    <CheckCircle2 size={15} strokeWidth={2} className="mt-0.5 shrink-0" style={{ color: '#2D7A4F' }} />
                    <span className="text-[13px]" style={{ color: '#1F4D3A' }}>{r.summary}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              {active.map((c) => {
                const key = conflictKey(c);
                return (
                  <ConflictCard
                    key={key}
                    conflict={c}
                    resolveAction={resolveConflictAction}
                    onResolved={(summary) => handleResolved(key, summary)}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
