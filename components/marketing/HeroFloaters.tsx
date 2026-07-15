import { Ticket, QrCode, CalendarClock } from 'lucide-react';

/* Decorative floating product chips for the hero. Three — and only three —
   realistic UI bits, each previewing a DISTINCT product pillar the dashboard
   mockup doesn't already surface: ticketing (Ticket), check-in (QR) and the
   schedule (Agenda). Deliberately kept few and calm — motion that adds meaning,
   not noise. Anchored to a centered 1200px band (matches the mockup width) so
   they hug the hero and never fling to the viewport edges or clip. Shown only on
   wide screens (xl+); hidden on mobile/tablet. aria-hidden + pointer-events-none.
   Float = shared floatA/floatB (auto-disabled under prefers-reduced-motion). */

const card: React.CSSProperties = {
  position: 'absolute',
  background: '#FFFFFF',
  border: '1px solid #E5E0D4',
  borderRadius: 16,
  boxShadow:
    '0 1px 2px rgba(15,31,24,0.05), 0 14px 34px -18px rgba(15,31,24,0.22)',
  padding: '12px 14px',
};

const title: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  fontSize: 13,
  color: '#0F1F18',
  letterSpacing: '-0.01em',
  lineHeight: 1.15,
};

const sub: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 11,
  color: '#65736B',
  marginTop: 2,
};

export function HeroFloaters() {
  return (
    <div
      aria-hidden
      className="hidden xl:block absolute inset-0 pointer-events-none"
      style={{ zIndex: 2 }}
    >
      {/* Centered band — matches the hero mockup width so chips stay close to
          the hero on any screen and never drift to the viewport edges. */}
      <div className="relative mx-auto h-full" style={{ maxWidth: 1200 }}>

        {/* ── Ticketing · upper-left, flanks the headline ── */}
        <div className="floatA" style={{ ...card, top: '17%', left: 0, width: 168, animationDelay: '0s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: '#F6EDDA', color: '#C9A45E', display: 'grid', placeItems: 'center', flex: 'none' }}>
              <Ticket size={17} strokeWidth={1.9} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={title}>VIP Access</div>
              <div style={sub}>$80 · 12 left</div>
            </div>
          </div>
        </div>

        {/* ── Schedule · lower-left, overlaps the mockup corner ── */}
        <div className="floatB" style={{ ...card, top: '62%', left: 0, width: 190, paddingLeft: 15, animationDelay: '1s' }}>
          {/* gold agenda rail */}
          <span aria-hidden style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, borderRadius: 3, background: '#E8C57E' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: '#E8EFEB', color: '#1F4D3A', display: 'grid', placeItems: 'center', flex: 'none' }}>
              <CalendarClock size={17} strokeWidth={1.9} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={title}>Opening Keynote</div>
              <div style={sub}>09:30 · Main Stage</div>
            </div>
          </div>
        </div>

        {/* ── Check-in · upper-right, flanks the headline ── */}
        <div className="floatB" style={{ ...card, top: '15%', right: 0, width: 128, animationDelay: '0.5s' }}>
          <div style={{ width: '100%', aspectRatio: '1', borderRadius: 10, background: '#FAF6EE', border: '1px solid #E5E0D4', display: 'grid', placeItems: 'center', color: '#1F4D3A', marginBottom: 9 }}>
            <QrCode size={40} strokeWidth={1.5} />
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500, color: '#3A4A42', textAlign: 'center' }}>Scan to check in</div>
        </div>

      </div>
    </div>
  );
}
