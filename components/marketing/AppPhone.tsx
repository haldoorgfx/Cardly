import { QrCode, Check, Wallet, Share2, CalendarDays } from 'lucide-react';

/* Realistic phone mockup for the mobile-app marketing surfaces — the attendee
   "My tickets" screen: the Eventera Card + two ticket rows. Titanium frame,
   Dynamic Island, home indicator. Light theme, one gold accent. */
export function AppPhone({ className = '' }: { className?: string }) {
  const QR = (
    <div style={{ width: 50, height: 50, borderRadius: 10, background: '#FFFFFF', border: '1px solid #E5E0D4', display: 'grid', placeItems: 'center', color: '#0F1F18', flex: 'none' }}>
      <QrCode size={30} strokeWidth={1.6} />
    </div>
  );

  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        width: 300,
        borderRadius: 46,
        background: '#0b0b0d',
        padding: 11,
        boxShadow: 'inset 0 0 0 2px #2c2c30, 0 50px 90px -34px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ position: 'relative', background: '#FAF6EE', borderRadius: 36, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 588 }}>
        {/* Dynamic Island */}
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 94, height: 27, background: '#000', borderRadius: 999, zIndex: 6 }} />

        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px 0', fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontWeight: 600, fontSize: 14, color: '#0F1F18' }}>
          <span>9:41</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 500, color: '#3A4A42', fontSize: 12.5, fontFamily: 'Inter, sans-serif' }}><Wallet size={14} strokeWidth={1.8} /> Wallet</span>
        </div>

        <div style={{ flex: 1, padding: '12px 16px 0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em', color: '#0F1F18', margin: '8px 4px 16px' }}>My tickets</div>

          {/* Eventera Card */}
          <div style={{ borderRadius: 18, background: 'linear-gradient(150deg, #163828 0%, #1F4D3A 60%, #2A6A50 100%)', padding: 18, position: 'relative', overflow: 'hidden', marginBottom: 12 }}>
            <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.5, background: 'repeating-linear-gradient(115deg, rgba(232,197,126,0.05) 0 2px, transparent 2px 9px)' }} />
            <span style={{ position: 'absolute', top: 15, right: 16, fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontWeight: 600, fontSize: 8, letterSpacing: '0.16em', color: 'rgba(232,197,126,0.6)' }}>EVENTERA</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, position: 'relative' }}>
              <div style={{ width: 50, height: 50, borderRadius: 999, border: '1.5px solid #E8C57E', background: 'rgba(232,197,126,0.14)', display: 'grid', placeItems: 'center', fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontWeight: 700, fontSize: 17, color: '#E8C57E', flex: 'none' }}>TN</div>
              <div>
                <div style={{ color: '#FAF6EE', fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>Thabo Nkosi</div>
                <div style={{ color: 'rgba(250,246,238,0.66)', fontSize: 12, fontFamily: 'Inter, sans-serif', marginTop: 2 }}>Founder · Kesho Labs</div>
              </div>
            </div>
            <div style={{ position: 'relative', marginTop: 15, height: 42, borderRadius: 12, background: '#E8C57E', color: '#0F1F18', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontWeight: 600, fontSize: 13.5 }}>
              <Share2 size={15} strokeWidth={2} /> Share card
            </div>
          </div>

          {/* Ticket row — checked in */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 16, padding: 14, marginBottom: 12 }}>
            {QR}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontWeight: 700, fontSize: 14, color: '#0F1F18', lineHeight: 1.25 }}>Pan-African Climate Summit</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 7, fontSize: 12, fontWeight: 600, color: '#2D7A4F' }}>
                <Check size={13} strokeWidth={2.4} /> Checked in
              </div>
            </div>
          </div>

          {/* Ticket row — upcoming */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 16, padding: 14 }}>
            {QR}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontWeight: 700, fontSize: 14, color: '#0F1F18', lineHeight: 1.25 }}>Nairobi Founders Summit</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 7, fontSize: 12, fontWeight: 600, color: '#6B7A72' }}>
                <CalendarDays size={13} strokeWidth={2} /> Apr 3 · Upcoming
              </div>
            </div>
          </div>
        </div>

        {/* Home indicator */}
        <div style={{ height: 26, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 122, height: 5, borderRadius: 999, background: 'rgba(15,31,24,0.24)' }} />
        </div>
      </div>
    </div>
  );
}
