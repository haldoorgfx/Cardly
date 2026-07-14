import { Ticket, QrCode, Calendar, Check, Radio } from 'lucide-react';

/* Decorative floating product chips for the hero. Realistic little UI bits
   (ticket, live count, check-in, QR, mini card, date) that flank the headline
   and overlap the dashboard mockup's top corners. Anchored to a CENTERED content
   band (not the viewport) so they hug the hero instead of drifting to the screen
   edges on wide displays. Shown only on wide screens (xl+); hidden on
   mobile/tablet. aria-hidden + pointer-events-none. Float = shared floatA/floatB
   (auto-disabled under prefers-reduced-motion by the global rule). */

const card: React.CSSProperties = {
  position: 'absolute',
  background: '#FFFFFF',
  border: '1px solid #E5E0D4',
  borderRadius: 14,
  boxShadow: '0 10px 30px -14px rgba(15,31,24,0.18), 0 1px 2px rgba(15,31,24,0.04)',
  padding: '11px 13px',
};

export function HeroFloaters() {
  return (
    <div aria-hidden className="hidden xl:block absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {/* Centered band — matches the hero content/mockup width so the chips stay
          close to the hero on any screen size instead of hugging the viewport. */}
      <div className="relative mx-auto h-full" style={{ maxWidth: 1240 }}>

        {/* ── LEFT ─────────────────────────────── */}

        {/* Ticket — flanks the headline, upper-left */}
        <div className="floatA" style={{ ...card, top: '15%', left: -8, width: 152, animationDelay: '0s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 32, height: 32, borderRadius: 9, background: '#F6EDDA', color: '#C9A45E', display: 'grid', placeItems: 'center', flex: 'none' }}>
              <Ticket size={16} strokeWidth={1.9} />
            </span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12.5, color: '#0F1F18', letterSpacing: '-0.01em' }}>VIP</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#6B7A72' }}>$80 · 12 left</div>
            </div>
          </div>
        </div>

        {/* Live registrations pill — sits at the dashboard mock's top-left */}
        <div className="floatB" style={{ position: 'absolute', top: '48%', left: 20, animationDelay: '0.6s' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1F4D3A', color: '#FAF6EE', borderRadius: 999, padding: '9px 15px', boxShadow: '0 12px 28px -12px rgba(15,31,24,0.4)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>
            <span style={{ position: 'relative', width: 7, height: 7, borderRadius: '50%', background: '#7FE3A6', flex: 'none' }} />
            847 registered
          </div>
        </div>

        {/* Checked-in chip — overlaps the mock's lower-left */}
        <div className="floatA" style={{ ...card, top: '68%', left: -14, width: 176, animationDelay: '1.1s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 30, height: 30, borderRadius: '50%', background: '#E8EFEB', color: '#1F4D3A', display: 'grid', placeItems: 'center', flex: 'none', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12 }}>FD</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12.5, color: '#0F1F18', letterSpacing: '-0.01em' }}>Fatima Diallo</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600, color: '#2D7A4F' }}>
                <Check size={11} strokeWidth={2.6} /> Checked in
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT ────────────────────────────── */}

        {/* QR tile — flanks the headline, upper-right */}
        <div className="floatB" style={{ ...card, top: '16%', right: -8, width: 124, animationDelay: '0.3s' }}>
          <div style={{ width: '100%', aspectRatio: '1', borderRadius: 9, background: '#FAF6EE', border: '1px solid #E5E0D4', display: 'grid', placeItems: 'center', color: '#1F4D3A', marginBottom: 8 }}>
            <QrCode size={38} strokeWidth={1.5} />
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, color: '#6B7A72', textAlign: 'center' }}>Scan to check in</div>
        </div>

        {/* Mini Eventera Card — sits at the mock's top-right */}
        <div className="floatA" style={{ position: 'absolute', top: '47%', right: 12, width: 158, borderRadius: 14, padding: 14, background: 'linear-gradient(150deg, #163828 0%, #1F4D3A 60%, #2A6A50 100%)', boxShadow: '0 16px 36px -16px rgba(15,31,24,0.45)', animationDelay: '0.9s' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 7.5, letterSpacing: '0.16em', color: 'rgba(232,197,126,0.7)', textAlign: 'right', marginBottom: 8 }}>EVENTERA</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 34, height: 34, borderRadius: '50%', border: '1.5px solid #E8C57E', background: 'rgba(232,197,126,0.14)', color: '#E8C57E', display: 'grid', placeItems: 'center', flex: 'none', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12 }}>KM</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: '#FAF6EE', letterSpacing: '-0.01em' }}>Kofi Mensah</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9.5, color: 'rgba(250,246,238,0.65)' }}>Speaker</div>
            </div>
          </div>
        </div>

        {/* Date chip — overlaps the mock's lower-right */}
        <div className="floatB" style={{ ...card, top: '70%', right: -6, width: 132, animationDelay: '1.4s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 32, height: 32, borderRadius: 9, background: '#E8EFEB', color: '#1F4D3A', display: 'grid', placeItems: 'center', flex: 'none' }}>
              <Calendar size={16} strokeWidth={1.9} />
            </span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12.5, color: '#0F1F18', letterSpacing: '-0.01em' }}>Mar 12</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-sans)', fontSize: 10.5, color: '#C97A2D', fontWeight: 600 }}>
                <Radio size={10} strokeWidth={2.2} /> Live soon
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
