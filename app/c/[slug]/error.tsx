'use client';

import { useEffect } from 'react';

export default function AttendeeError({
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
    <div className="min-h-screen bg-[#FAF6EE] grid place-items-center px-6">
      <div className="text-center max-w-[400px]">
        <div className="inline-grid h-14 w-14 rounded-2xl place-items-center mb-6"
          style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }}>
          <span className="text-white text-[22px] font-bold" style={{ fontFamily: 'DM Sans, sans-serif' }}>C</span>
        </div>

        <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/40 mb-3">
          SOMETHING WENT WRONG
        </div>
        <h1 className="text-[28px] font-bold text-[#0F1F18] leading-tight tracking-tight" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          Couldn&apos;t load this page.
        </h1>
        <p className="text-[14px] text-[#0F1F18]/55 mt-3 leading-relaxed">
          There was a problem loading this event card. Try refreshing — if it keeps happening, ask the organiser for the latest link.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={reset}
            className="inline-flex items-center h-10 px-5 rounded-xl text-[13.5px] font-medium text-white transition hover:opacity-90"
            style={{ background: '#1F4D3A' }}
          >
            Try again
          </button>
        </div>

        <p className="mt-6 text-[12px] text-[#0F1F18]/30">
          Made with Cardly · cardly.app
        </p>
      </div>
    </div>
  );
}
