import Link from 'next/link';

export default function AttendeeNotFound() {
  return (
    <div className="min-h-screen bg-[#FAF6EE] grid place-items-center px-6">
      <div className="text-center max-w-[400px]">
        {/* Logo mark */}
        <div className="inline-grid h-14 w-14 rounded-2xl place-items-center mb-6"
          style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }}>
          <span className="text-white text-[22px] font-bold" style={{ fontFamily: 'DM Sans, sans-serif' }}>K</span>
        </div>

        <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/40 mb-3">
          EVENT NOT FOUND
        </div>
        <h1 className="text-[28px] font-bold text-[#0F1F18] leading-tight tracking-tight" style={{ fontFamily: 'DM Sans, sans-serif' }}>
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
            Karta home
          </Link>
        </div>

        <p className="mt-6 text-[12px] text-[#0F1F18]/30">
          Made with Karta · karta.cre8so.com
        </p>
      </div>
    </div>
  );
}
