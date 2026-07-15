'use client';

import { useEffect } from 'react';
import { RefreshCw, Home } from 'lucide-react';

export default function EventsDiscoveryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[events discovery error]', error);
  }, [error]);

  return (
    <div
      style={{ background: '#FAF6EE', minHeight: '100vh' }}
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
    >
      {/* Icon */}
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-6"
        style={{ background: '#E8EFEB' }}
      >
        <span style={{ fontSize: 26 }}>⚡</span>
      </div>

      <h1
        className="font-display font-semibold text-[22px] mb-2"
        style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}
      >
        Couldn’t load events
      </h1>
      <p className="text-[14px] leading-relaxed mb-8 max-w-[320px]" style={{ color: '#6B7A72' }}>
        We hit a snag loading the discovery feed. It might be a temporary issue — try again.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[280px]">
        <button
          onClick={reset}
          className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl font-medium text-[14px] text-white transition-opacity hover:opacity-90"
          style={{ background: '#1F4D3A' }}
        >
          <RefreshCw size={15} />
          Try again
        </button>
        <a
          href="/"
          className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl font-medium text-[14px] transition-colors hover:bg-white"
          style={{ border: '1px solid #E5E0D4', color: '#3A4A42' }}
        >
          <Home size={15} />
          Home
        </a>
      </div>

      {error.digest && (
        <p className="mt-8 text-[11px]" style={{ color: '#6B7A72' }}>
          ref: {error.digest}
        </p>
      )}
    </div>
  );
}
