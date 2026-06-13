'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 grid place-items-center px-6 py-16">
      <div className="text-center max-w-[400px]">
        <div className="text-[11px] tracking-widest text-[#0F1F18]/40 mb-4">ERROR</div>
        <h2 className="font-display font-bold text-[28px] leading-tight">Something went wrong.</h2>
        <p className="text-[14px] text-[#0F1F18]/60 mt-3 leading-relaxed">
          An unexpected error occurred. Try refreshing, or go back to the dashboard.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl grad-bg text-white font-medium text-[13.5px] hover:opacity-95 transition shadow-soft"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl border border-[#E5E0D4] text-[13.5px] font-medium hover:bg-white transition"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
