'use client';

import { useTransition } from 'react';
import { toast } from '@/hooks/use-toast';

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
      try {
        const res = await fetch('/api/billing/create-portal', { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (data.url) { window.location.href = data.url; return; }
        // No silent dead button — say what's actually wrong.
        toast({
          title: 'Billing isn’t available yet',
          description: data.error ?? 'Could not open the billing portal. Please try again.',
          variant: 'destructive',
        });
      } catch {
        toast({
          title: 'Couldn’t reach billing',
          description: 'Check your connection and try again.',
          variant: 'destructive',
        });
      }
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
