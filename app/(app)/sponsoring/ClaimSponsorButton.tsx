'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Check } from 'lucide-react';

/**
 * "Claim sponsor access" — for a logged-in user whose account isn't yet linked
 * to any sponsor row. Calls the self-only claim route, which matches sponsor
 * rows by the account's verified email and grants the 'sponsor' role, then
 * refreshes so the newly-lit section renders.
 */
export function ClaimSponsorButton() {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'loading' | 'none' | 'error'>('idle');

  async function claim() {
    setState('loading');
    try {
      const res = await fetch('/api/sponsors/claim', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.claimed ?? 0) > 0) {
        router.refresh();
        return;
      }
      setState(res.ok ? 'none' : 'error');
    } catch {
      setState('error');
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={claim}
        disabled={state === 'loading'}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: '#1F4D3A' }}
      >
        {state === 'loading' ? (
          <RefreshCw size={15} strokeWidth={2} className="animate-spin" />
        ) : (
          <Check size={15} strokeWidth={2} />
        )}
        {state === 'loading' ? 'Checking…' : 'Claim sponsor access'}
      </button>
      {state === 'none' && (
        <p className="text-[12.5px]" style={{ color: '#6B7A72' }}>
          No sponsorships found for your account email yet.
        </p>
      )}
      {state === 'error' && (
        <p className="text-[12.5px]" style={{ color: '#B8423C' }}>
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}
