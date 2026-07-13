import { QrCode, Check, Wallet, Share2 } from 'lucide-react';

/* Calm phone mockup for the mobile-app marketing surfaces.
   Shows the attendee wallet + Eventera Card — light theme, one gold moment.
   Secondary content is #E7E2D6 skeleton bars (no fake paragraphs). */
export function AppPhone({ className = '' }: { className?: string }) {
  const bar = (w: number | string, h = 8) => (
    <span style={{ display: 'block', width: w, height: h, borderRadius: 999, background: '#E7E2D6' }} />
  );
  return (
    <div
      className={className}
      style={{
        width: 288,
        borderRadius: 40,
        background: '#0C1813',
        padding: 9,
        border: '1.5px solid rgba(232,197,126,0.45)',
        boxShadow: '0 24px 60px rgba(15,31,24,0.28)',
      }}
    >
      <div style={{ position: 'relative', background: '#FAF6EE', borderRadius: 32, overflow: 'hidden', paddingBottom: 16 }}>
        {/* Notch */}
        <div style={{ position: 'absolute', top: 9, left: '50%', transform: 'translateX(-50%)', width: 92, height: 24, background: '#0C1813', borderRadius: 999 }} />
        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 0', fontSize: 11, color: '#6B7A72', fontFamily: 'Inter, sans-serif' }}>
          <span style={{ fontWeight: 600, color: '#0F1F18' }}>9:41</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Wallet size={12} strokeWidth={2} /> Wallet</span>
        </div>

        <div style={{ padding: '14px 16px 0' }}>
          <div style={{ fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em', color: '#0F1F18' }}>My tickets</div>

          {/* Eventera Card */}
          <div style={{ marginTop: 12, borderRadius: 18, background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 62%, #2A6A50 100%)', padding: 16, position: 'relative' }}>
            <span style={{ position: 'absolute', top: 12, right: 14, fontSize: 8.5, letterSpacing: '0.16em', color: 'rgba(232,197,126,0.85)', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>EVENTERA</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{ width: 46, height: 46, borderRadius: 999, background: 'rgba(232,197,126,0.16)', border: '1.5px solid rgba(232,197,126,0.5)', display: 'grid', placeItems: 'center', fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontWeight: 800, fontSize: 17, color: '#E8C57E' }}>AY</div>
              <div>
                <div style={{ color: '#FAF6EE', fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>Amara Yusuf</div>
                <div style={{ color: 'rgba(250,246,238,0.7)', fontSize: 11.5, fontFamily: 'Inter, sans-serif', marginTop: 2 }}>Policy Lead · African Union</div>
              </div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, background: '#E8C57E', color: '#163828', borderRadius: 10, padding: '9px 12px', width: 'fit-content', fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontWeight: 700, fontSize: 12.5 }}>
              <Share2 size={13} strokeWidth={2.2} /> Share card
            </div>
          </div>

          {/* Ticket row with QR */}
          <div style={{ marginTop: 12, borderRadius: 14, background: '#FFFFFF', border: '1px solid #E5E0D4', padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: 10, background: '#FAF6EE', border: '1px solid #E5E0D4', display: 'grid', placeItems: 'center', color: '#1F4D3A' }}>
              <QrCode size={30} strokeWidth={1.6} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontWeight: 700, fontSize: 13.5, color: '#0F1F18', letterSpacing: '-0.01em' }}>Pan-African Climate Summit</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>{bar(58)}{bar(34)}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 11, color: '#2D7A4F', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                <Check size={12} strokeWidth={2.4} /> Checked in
              </div>
            </div>
          </div>
        </div>

        {/* Home indicator */}
        <div style={{ margin: '16px auto 0', width: 108, height: 5, borderRadius: 999, background: '#E7E2D6' }} />
      </div>
    </div>
  );
}
