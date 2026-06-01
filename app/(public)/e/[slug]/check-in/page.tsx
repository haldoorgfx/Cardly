export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

// Phase 1.8 — QR scanner (mobile-optimized, dark canvas) built here
export default function CheckInPage({ params }: Props) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#0A0F0C' }}
    >
      <div className="text-center px-5">
        <div className="font-mono text-[11px] tracking-widest uppercase mb-2" style={{ color: 'rgba(232,197,126,0.6)' }}>
          Phase 1.8 · /e/{params.slug}/check-in
        </div>
        <div className="text-[15px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
          QR camera scanner — dark canvas, mobile-first
        </div>
      </div>
    </div>
  );
}
