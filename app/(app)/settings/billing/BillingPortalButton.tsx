'use client';

import { useTransition } from 'react';

export function BillingPortalButton({
  label,
  fullWidth,
}: {
  label: string;
  fullWidth?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function open() {
    startTransition(async () => {
      const res = await fetch('/api/billing/create-portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    });
  }

  return (
    <button
      onClick={open}
      disabled={isPending}
      className={`text-[13px] font-medium text-[#3A4A42] border border-border rounded-lg h-8 px-3 hover:bg-cream transition disabled:opacity-50 ${fullWidth ? 'w-full' : ''}`}
    >
      {isPending ? 'Loading…' : label}
    </button>
  );
}
