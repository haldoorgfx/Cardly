'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAF6EE] grid place-items-center px-6 py-16">
      <div className="text-center max-w-[420px]">
        <div className="text-[11px] tracking-widest text-[#0F1F18]/40 mb-4">ERROR</div>
        <h1 className="font-title font-bold text-[32px] leading-tight text-[#0F1F18]">
          Something went wrong
        </h1>
        <p className="text-[15px] text-[#6B7A72] mt-4 leading-relaxed">
          An unexpected error occurred. Try refreshing the page, or head back to the homepage.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center h-11 px-6 rounded-xl bg-[#1F4D3A] text-white font-medium text-[14px] hover:bg-[#163828] transition"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center h-11 px-6 rounded-xl border border-[#E5E0D4] text-[14px] font-medium text-[#0F1F18] hover:bg-white transition"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
