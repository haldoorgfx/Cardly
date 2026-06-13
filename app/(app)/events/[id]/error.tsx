'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { RefreshCw, ArrowLeft } from 'lucide-react';

export default function EventDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[event detail error]', error);
  }, [error]);

  return (
    <div className="flex-1 grid place-items-center px-6 py-16">
      <div className="text-center max-w-[400px]">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: '#E8EFEB' }}
        >
          <span style={{ fontSize: 22 }}>⚡</span>
        </div>
        <h2
          className="font-display font-bold text-[26px] leading-tight mb-3"
          style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}
        >
          Failed to load event
        </h2>
        <p className="text-[14px] leading-relaxed mb-7" style={{ color: '#6B7A72' }}>
          Something went wrong loading this event. Your data is safe — try refreshing.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-white font-medium text-[13.5px] transition-opacity hover:opacity-90"
            style={{ background: '#1F4D3A' }}
          >
            <RefreshCw size={14} />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl border text-[13.5px] font-medium transition-colors hover:bg-white"
            style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}
          >
            <ArrowLeft size={14} />
            Dashboard
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-[11px]" style={{ color: '#9CA3AF' }}>
            ref: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
