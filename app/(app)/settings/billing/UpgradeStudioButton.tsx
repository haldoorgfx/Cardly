'use client';

import { useTransition, useState } from 'react';

/**
 * "+ Upgrade to Studio" for users who already have a paid plan.
 * Existing subscribers change plans through the Stripe billing portal
 * (same path the page copy points at), so this opens the real portal
 * instead of the old dead /settings/billing/upgrade link (404).
 */
export function UpgradeStudioButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function upgrade() {
    setError('');
    startTransition(async () => {
      try {
        const res = await fetch('/api/billing/create-portal', { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (data.url) { window.location.href = data.url; return; }
        setError(data.error ?? 'Could not open billing. Please try again.');
      } catch {
        setError('Could not open billing. Please check your connection.');
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1 shrink-0 mt-1">
      <button
        onClick={upgrade}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 h-10 px-5 rounded-lg text-[13.5px] font-semibold text-[#0F1F18] transition hover:opacity-90 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4D3A]"
        style={{ background: '#E8C57E' }}
      >
        {isPending ? 'Opening…' : '+ Upgrade to Studio'}
      </button>
      {error && <span role="alert" className="text-[12.5px]" style={{ color: '#B8423C' }}>{error}</span>}
    </div>
  );
}
