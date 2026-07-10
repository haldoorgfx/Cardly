import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 — Page not found',
};

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-6" style={{ background: '#FAF6EE' }}>
      <div className="text-center max-w-[440px]">
        <div
          className="inline-grid h-16 w-16 rounded-2xl place-items-center text-white text-[28px] font-display font-bold mb-6"
          style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }}
        >
          E
        </div>
        <div className="text-[11px] tracking-widest mb-4" style={{ color: 'rgba(15,31,24,0.4)', fontFamily: 'Inter, sans-serif' }}>404</div>
        <h1 className="font-display font-bold text-[36px] leading-tight" style={{ color: '#0F1F18' }}>
          Page not found.
        </h1>
        <p className="text-[15px] mt-3 leading-relaxed" style={{ color: 'rgba(15,31,24,0.6)' }}>
          This page doesn&apos;t exist or was moved. If you&apos;re looking for an event, double-check the link with the organiser.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-white font-medium text-[14px] transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)', boxShadow: '0 4px 12px rgba(31,77,58,0.18)' }}
          >
            Go home
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl border text-[14px] font-medium transition-colors hover:bg-white"
            style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
