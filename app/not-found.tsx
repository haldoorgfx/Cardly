import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAF6EE] grid place-items-center px-6">
      <div className="text-center max-w-[440px]">
        <div className="inline-flex h-16 w-16 rounded-2xl grad-bg grid place-items-center text-white text-[28px] font-display font-bold mb-6">
          C
        </div>
        <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/40 mb-4">404</div>
        <h1 className="font-display font-bold text-[36px] leading-tight">Page not found.</h1>
        <p className="text-[15px] text-[#0F1F18]/60 mt-3 leading-relaxed">
          This page doesn&apos;t exist or was moved. If you&apos;re looking for an event card, double-check the link with the organiser.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl grad-bg text-white font-medium text-[14px] hover:opacity-95 transition shadow-soft"
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl border border-[#E5E0D4] text-[14px] font-medium hover:bg-white transition"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
