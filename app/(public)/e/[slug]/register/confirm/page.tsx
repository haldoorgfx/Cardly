export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
  searchParams: {
    reg?: string;
    payment_intent?: string;
    payment_intent_client_secret?: string;
    tx_ref?: string;
    status?: string;
  };
}

// Phase 1.5 / 1.6 — confirmation page with QR + Karta Card reveal built here
export default function RegisterConfirmPage({ params, searchParams }: Props) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-5"
      style={{ background: '#0F1F18' }}
    >
      <div className="text-center">
        <div className="font-mono text-[11px] tracking-widest uppercase mb-2" style={{ color: 'rgba(232,197,126,0.6)' }}>
          Phase 1.5 · /e/{params.slug}/register/confirm
        </div>
        <div className="text-[15px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Card reveal, QR code, and social sharing
        </div>
      </div>
    </div>
  );
}
