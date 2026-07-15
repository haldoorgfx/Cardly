'use client';

import { useState, useTransition } from 'react';
import { X, Ticket, DoorOpen, ArrowRight, Sparkles } from 'lucide-react';

interface Props {
  eventsCount: number;
  ticketTypesCount: number;
  /** Server action that flips profiles.seen_entitlements_migration → true. */
  onDismiss: () => Promise<{ ok?: boolean; error?: string }>;
}

/**
 * G01 — one-time, dismissible reassurance card for organizers who already had
 * events when the entitlements engine went live. Calm, not alarming: a
 * before → after ticket visual and the organizer's REAL numbers (computed on the
 * server from live data, never hardcoded). Dismissal persists per-user.
 */
export function MigrationNotice({ eventsCount, ticketTypesCount, onDismiss }: Props) {
  const [hidden, setHidden] = useState(false);
  const [pending, startTransition] = useTransition();

  if (hidden) return null;

  function dismiss() {
    setHidden(true); // optimistic — the card feels instant
    startTransition(async () => {
      const res = await onDismiss();
      if (res?.error) setHidden(false); // roll back so it can be tried again
    });
  }

  const nEvents = eventsCount.toLocaleString();
  const nTickets = ticketTypesCount.toLocaleString();

  return (
    <div
      className="relative rounded-2xl border overflow-hidden mb-5"
      style={{ borderColor: '#E5E0D4', background: '#FFFFFF', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
    >
      {/* Calm forest band */}
      <div className="flex items-start gap-3 px-5 sm:px-6 pt-5 pb-4"
        style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 70%, #E8C57E 150%)' }}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'rgba(255,255,255,0.16)', color: '#FFFFFF' }}>
          <Sparkles size={18} strokeWidth={1.9} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-[16px] leading-tight" style={{ color: '#FFFFFF' }}>
            Your events now support entitlements
          </p>
          <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.82)' }}>
            Nothing changed for your attendees — every existing ticket keeps working. You can now scan entry,
            meals, sessions and more, each on its own.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          disabled={pending}
          aria-label="Dismiss"
          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg transition disabled:opacity-60"
          style={{ background: 'rgba(255,255,255,0.14)', color: '#FFFFFF' }}
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="px-5 sm:px-6 py-5">
        {/* before → after ticket visual */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {/* before */}
          <div className="rounded-xl border px-4 py-3 flex items-center gap-2.5" style={{ borderColor: '#E5E0D4', background: '#FAF6EE' }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', color: '#65736B' }}>
              <Ticket size={16} strokeWidth={1.9} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: '#65736B' }}>Before</p>
              <p className="text-[13px] font-medium" style={{ color: '#3A4A42' }}>One ticket = one scan</p>
            </div>
          </div>

          <ArrowRight size={18} strokeWidth={2} style={{ color: '#65736B' }} className="shrink-0" />

          {/* after */}
          <div className="rounded-xl border px-4 py-3 flex items-center gap-2.5" style={{ borderColor: 'rgba(31,77,58,0.28)', background: '#E8EFEB' }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: '#1F4D3A', color: '#FFFFFF' }}>
              <Ticket size={16} strokeWidth={1.9} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: '#1F4D3A' }}>After</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ background: '#FFFFFF', border: '1px solid rgba(31,77,58,0.24)', color: '#1F4D3A' }}>
                  <DoorOpen size={11} strokeWidth={2} /> Entry
                </span>
                <span className="text-[12px]" style={{ color: '#3A4A42' }}>+ add meals, sessions…</span>
              </div>
            </div>
          </div>
        </div>

        {/* real numbers */}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl px-4 py-3"
          style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-bold text-[18px]" style={{ color: '#1F4D3A' }}>{nEvents}</span>
            <span className="text-[13px]" style={{ color: '#65736B' }}>{eventsCount === 1 ? 'event' : 'events'} ready</span>
          </div>
          <span className="hidden sm:inline" style={{ color: '#E5E0D4' }}>·</span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-bold text-[18px]" style={{ color: '#1F4D3A' }}>{nTickets}</span>
            <span className="text-[13px]" style={{ color: '#65736B' }}>{ticketTypesCount === 1 ? 'ticket type' : 'ticket types'}</span>
          </div>
          <span className="hidden sm:inline" style={{ color: '#E5E0D4' }}>·</span>
          <span className="text-[13px]" style={{ color: '#65736B' }}>Entry entitlement ready on each</span>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={dismiss}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#163828] disabled:opacity-60"
            style={{ background: '#1F4D3A' }}
          >
            {pending ? 'Got it…' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
}
