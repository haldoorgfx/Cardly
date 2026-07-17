'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Check } from 'lucide-react';
import { describeError } from '@/components/ui/status-state';

/**
 * "Claim sponsor access" — for a logged-in user whose account isn't yet linked
 * to any sponsor row. Calls the self-only claim route, which matches sponsor
 * rows by the account's verified email and grants the 'sponsor' role, then
 * refreshes so the newly-lit section renders.
 */
export function ClaimSponsorButton() {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'loading' | 'none' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function claim() {
    setState('loading');
    try {
      const res = await fetch('/api/sponsors/claim', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.claimed ?? 0) > 0) {
        router.refresh();
        return;
      }
      if (!res.ok) {
        setErrorMessage(describeError(data.error ?? `Request failed (${res.status})`, 'sponsor access'));
        setState('error');
        return;
      }
      setState('none');
    } catch (e) {
      setErrorMessage(describeError(e, 'sponsor access'));
      setState('error');
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={claim}
        disabled={state === 'loading'}
        className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2.5 rounded-lg text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D3A]/40 focus-visible:ring-offset-2"
        style={{ background: '#1F4D3A' }}
      >
        {state === 'loading' ? (
          <RefreshCw size={15} strokeWidth={2} className="animate-spin" />
        ) : (
          <Check size={15} strokeWidth={2} />
        )}
        {state === 'loading' ? 'Checking…' : 'Claim sponsor access'}
      </button>
      <div aria-live="polite" className="min-h-0">
        {state === 'none' && (
          <p className="text-[12.5px]" style={{ color: '#3A4A42' }}>
            No sponsorships found for your account email yet.
          </p>
        )}
        {state === 'error' && (
          <p className="text-[12.5px]" style={{ color: '#B8423C' }} role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
