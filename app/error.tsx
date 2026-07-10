'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[global error]', error);
  }, [error]);

  return (
    <div className="min-h-screen grid place-items-center px-6" style={{ background: '#FAF6EE' }}>
      <div className="text-center max-w-[440px]">
        <div
          className="inline-grid h-16 w-16 rounded-2xl place-items-center text-white text-[28px] font-display font-bold mb-6"
          style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }}
        >
          K
        </div>
        <div className="text-[11px] tracking-widest mb-4" style={{ color: 'rgba(15,31,24,0.4)' }}>500</div>
        <h1 className="font-display font-bold text-[34px] leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.025em' }}>
          Something went wrong.
        </h1>
        <p className="text-[15px] mt-3 leading-relaxed" style={{ color: 'rgba(15,31,24,0.6)' }}>
          An unexpected error occurred. The team has been notified. You can try again or go back to the dashboard.
        </p>
        {error.digest && (
          <p className="text-[11px] mt-3" style={{ color: 'rgba(15,31,24,0.3)' }}>
            Error ID: {error.digest}
          </p>
        )}
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-white font-medium text-[14px] transition-opacity hover:opacity-90"
            style={{ background: '#1F4D3A', boxShadow: '0 4px 12px rgba(31,77,58,0.18)' }}
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl border text-[14px] font-medium transition-colors hover:bg-white"
            style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
