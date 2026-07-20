'use client';

import { useState } from 'react';

export default function UnsubscribeForm({ token, email }: { token: string; email: string }) {
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'error'>('idle');

  async function submit() {
    setState('working');
    try {
      const res = await fetch(`/api/unsubscribe?token=${encodeURIComponent(token)}`, {
        method: 'POST',
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div>
        <h1
          className="text-[22px] sm:text-[26px] font-bold mb-3"
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", letterSpacing: '-0.02em', color: '#0F1F18' }}
        >
          You&apos;re unsubscribed
        </h1>
        <p className="text-[15px] leading-relaxed" style={{ color: '#3A4A42' }}>
          We won&apos;t send <strong style={{ color: '#0F1F18' }}>{email}</strong> any more event
          updates from organizers.
        </p>
        <p className="text-[13px] leading-relaxed mt-4" style={{ color: '#65736B' }}>
          You&apos;ll still get essential emails about tickets you already hold — confirmations,
          changes to an event you registered for, and receipts.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1
        className="text-[22px] sm:text-[26px] font-bold mb-3"
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", letterSpacing: '-0.02em', color: '#0F1F18' }}
      >
        Unsubscribe from event updates?
      </h1>
      <p className="text-[15px] leading-relaxed mb-2" style={{ color: '#3A4A42' }}>
        This stops organizer updates to <strong style={{ color: '#0F1F18' }}>{email}</strong>.
      </p>
      <p className="text-[13px] leading-relaxed mb-6" style={{ color: '#65736B' }}>
        You&apos;ll still get essential emails about tickets you already hold.
      </p>

      <button
        onClick={submit}
        disabled={state === 'working'}
        className="w-full sm:w-auto min-h-[44px] px-6 rounded-xl text-[15px] font-semibold transition disabled:opacity-50"
        style={{ background: '#1F4D3A', color: '#FFFFFF' }}
      >
        {state === 'working' ? 'Unsubscribing…' : 'Yes, unsubscribe'}
      </button>

      {state === 'error' && (
        <p className="text-[13px] mt-4" style={{ color: '#B8423C' }}>
          We couldn&apos;t complete that just now. Please try again, or reply to the email you
          received and we&apos;ll remove you manually.
        </p>
      )}
    </div>
  );
}
