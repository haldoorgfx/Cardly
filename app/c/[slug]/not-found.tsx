import Link from 'next/link';
import { CalendarX2 } from 'lucide-react';

export default function AttendeeNotFound() {
  return (
    <div className="min-h-screen bg-[#FAF6EE] grid place-items-center px-6">
      <div className="text-center max-w-[400px]">
        {/* Brand mark — solid forest tile, no gradient */}
        <div className="inline-grid h-14 w-14 rounded-2xl place-items-center mb-6"
          style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
          <CalendarX2 size={24} strokeWidth={1.8} aria-hidden />
        </div>

        <div className="text-[11px] tracking-widest text-[#0F1F18]/40 mb-3" style={{ letterSpacing: '0.16em' }}>
          EVENT NOT FOUND
        </div>
        <h1 className="text-[28px] font-bold text-[#0F1F18] leading-tight tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          This link has expired<br />or doesn&apos;t exist.
        </h1>
        <p className="text-[14px] text-[#0F1F18]/55 mt-3 leading-relaxed">
          The event may have been unpublished or the link is incorrect.
          Ask the organiser for the latest link.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center h-10 px-5 rounded-xl text-[13.5px] font-medium text-white transition hover:opacity-90"
            style={{ background: '#1F4D3A' }}
          >
            Eventera home
          </Link>
        </div>

        <p className="mt-6 text-[12px] text-[#0F1F18]/30">
          Made with Eventera · {(process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/^https?:\/\//, '')}
        </p>
      </div>
    </div>
  );
}
