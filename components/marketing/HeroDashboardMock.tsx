'use client';

import { useRef, useEffect } from 'react';

export default function HeroDashboardMock() {
  const compRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const laptopRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  // Scale composition to fill wrapper width
  useEffect(() => {
    function fit() {
      if (!wrapRef.current || !compRef.current) return;
      const s = wrapRef.current.offsetWidth / 1120;
      compRef.current.style.transform = `scale(${s})`;
    }
    fit();
    const ro = new ResizeObserver(fit);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // Mouse parallax — phone reads closer so moves more
  useEffect(() => {
    function onMove(e: MouseEvent) {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      if (laptopRef.current) laptopRef.current.style.translate = `${(x * 7).toFixed(1)}px ${(y * 7).toFixed(1)}px`;
      if (phoneRef.current)  phoneRef.current.style.translate  = `${(x * 18).toFixed(1)}px ${(y * 18).toFixed(1)}px`;
    }
    function onLeave() {
      if (laptopRef.current) laptopRef.current.style.translate = '0 0';
      if (phoneRef.current)  phoneRef.current.style.translate  = '0 0';
    }
    document.body.addEventListener('mousemove', onMove);
    document.body.addEventListener('mouseleave', onLeave);
    return () => {
      document.body.removeEventListener('mousemove', onMove);
      document.body.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .hero-laptop { animation: heroFloatLaptop 7s ease-in-out infinite; }
          .hero-phone  { animation: heroFloatPhone  5.5s ease-in-out infinite; }
        }
        @keyframes heroFloatLaptop {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes heroFloatPhone {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%       { transform: translateY(-16px) rotate(-1.2deg); }
        }
        .hero-laptop, .hero-phone { transition: translate 0.4s ease-out; }
      `}</style>

      {/* Wrapper — aspect ratio 1120:680 */}
      <div ref={wrapRef} style={{ position: 'relative', width: '100%', paddingTop: '60.714%' }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>

          {/* Fixed-size 1120×680 composition, scaled to fit */}
          <div
            ref={compRef}
            style={{ position: 'absolute', top: 0, left: 0, width: 1120, height: 680, transformOrigin: 'top left' }}
          >

            {/* ── Browser / laptop ── */}
            <div
              ref={laptopRef}
              className="hero-laptop"
              style={{
                position: 'absolute', left: 28, top: 12,
                width: 960, height: 612,
                background: 'var(--cream-surface, #FFFFFF)',
                border: '1px solid #E5E0D4',
                borderRadius: 14, overflow: 'hidden',
                boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset, 0 60px 100px -54px rgba(15,31,24,0.34), 0 28px 56px -40px rgba(15,31,24,0.22)',
              }}
            >
              {/* Chrome bar */}
              <div style={{
                height: 48, background: '#F0EDE8',
                borderBottom: '1px solid #E5E0D4',
                display: 'flex', alignItems: 'center', gap: 16, padding: '0 18px',
              }}>
                {/* Traffic lights */}
                <div style={{ display: 'flex', gap: 9 }}>
                  {['#EC6A5E', '#F4BF4F', '#61C554'].map((c) => (
                    <span key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c, display: 'block' }} />
                  ))}
                </div>
                {/* URL bar */}
                <div style={{
                  flex: 1, height: 28, borderRadius: 8,
                  background: '#FFFFFF', border: '1px solid #E5E0D4',
                  display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
                  fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#6B7A72',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7A72" strokeWidth="2">
                    <rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>
                  </svg>
                  <span><span style={{ color: '#3A4A42', fontWeight: 500 }}>app.eventera.co</span>/events/pan-african-climate-summit</span>
                </div>
                {/* New tab */}
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  border: '1px solid #E5E0D4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#6B7A72', fontSize: 15,
                }}>+</div>
              </div>

              {/* App grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '204px 1fr', height: 'calc(100% - 48px)' }}>

                {/* Sidebar */}
                <aside style={{
                  background: '#FBFAF6', borderRight: '1px solid #E5E0D4',
                  padding: '18px 12px', display: 'flex', flexDirection: 'column',
                }}>
                  {/* Logo */}
                  <div style={{ padding: '2px 10px 16px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/eventera-logo.png" alt="Eventera" style={{ height: 22, width: 'auto', display: 'block' }} />
                  </div>

                  {/* Nav */}
                  <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Active item */}
                    <div style={{
                      height: 36, display: 'flex', alignItems: 'center', gap: 11,
                      padding: '0 11px', borderRadius: 7,
                      background: '#E8EFEB', color: '#1F4D3A', fontWeight: 500,
                      borderLeft: '2px solid #1F4D3A',
                      fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13.5,
                    }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                        <rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>
                      </svg>
                      Events
                    </div>

                    {/* Skeleton rows */}
                    {[['64%', '18px'], ['50%', '18px'], ['72%', '18px']].map(([w, sq], i) => (
                      <div key={i} style={{ height: 36, display: 'flex', alignItems: 'center', gap: 11, padding: '0 11px' }}>
                        <span style={{ width: sq, height: sq, borderRadius: 5, background: '#E7E2D6', flexShrink: 0 }} />
                        <span style={{ width: w, height: 8, borderRadius: 999, background: '#E7E2D6', display: 'inline-block' }} />
                      </div>
                    ))}

                    {/* Section divider */}
                    <span style={{ width: '34%', height: 7, borderRadius: 999, background: '#E7E2D6', display: 'inline-block', margin: '16px 11px 8px' }} />

                    {[['46%', '18px'], ['58%', '18px']].map(([w, sq], i) => (
                      <div key={i} style={{ height: 36, display: 'flex', alignItems: 'center', gap: 11, padding: '0 11px' }}>
                        <span style={{ width: sq, height: sq, borderRadius: 5, background: '#E7E2D6', flexShrink: 0 }} />
                        <span style={{ width: w, height: 8, borderRadius: 999, background: '#E7E2D6', display: 'inline-block' }} />
                      </div>
                    ))}
                  </nav>

                  <div style={{ flex: 1 }} />

                  {/* Plan pill */}
                  <span style={{
                    alignSelf: 'flex-start', margin: '0 10px',
                    background: '#E8EFEB', color: '#1F4D3A',
                    fontFamily: 'Inter, sans-serif', fontWeight: 500,
                    fontSize: 11, padding: '5px 11px', borderRadius: 999,
                  }}>Pro plan</span>
                </aside>

                {/* Main content */}
                <main style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                  {/* App header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7A72' }}>
                      <span style={{ color: '#1F4D3A', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Events</span>
                      {'  /  '}Pan-African Climate Summit
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7A72" strokeWidth="1.7">
                        <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/>
                      </svg>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#3A6B4A,#2A5A3A)' }} />
                    </div>
                  </div>

                  {/* Title row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
                    <h1 style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600,
                      fontSize: 22, letterSpacing: '-0.02em', color: '#1F4D3A', margin: 0,
                    }}>Pan-African Climate Summit</h1>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: '#E8EFEB', color: '#2D7A4F',
                      fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 11,
                      padding: '3px 10px', borderRadius: 999, border: '1px solid #C9DDD3',
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2D7A4F' }} />
                      Live
                    </span>
                  </div>

                  {/* Stat cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 18 }}>
                    {[
                      { label: 'Registrations', val: '847', color: '#C9A45E' },
                      { label: 'Cards shared',  val: '1,204', color: '#2D7A4F' },
                      { label: 'Check-ins',     val: '412',   color: '#0F1F18' },
                    ].map((s) => (
                      <div key={s.label} style={{
                        background: '#FFFFFF', border: '1px solid #E5E0D4',
                        borderRadius: 8, padding: '15px 17px',
                        boxShadow: '0 1px 2px rgba(15,31,24,0.04)',
                      }}>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7A72' }}>{s.label}</div>
                        <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: 28, letterSpacing: '-0.02em', lineHeight: 1, marginTop: 9, color: s.color }}>{s.val}</div>
                        <div style={{ height: 8, background: '#E7E2D6', borderRadius: 999, marginTop: 12, width: '60%' }} />
                      </div>
                    ))}
                  </div>

                  {/* Chart */}
                  <div style={{
                    marginTop: 14, background: '#FFFFFF', border: '1px solid #E5E0D4',
                    borderRadius: 8, padding: '16px 20px 14px',
                    boxShadow: '0 1px 2px rgba(15,31,24,0.04)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7A72' }}>Registrations — last 7 days</div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#C9A45E' }}>Peak · Sat 184</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 13, height: 82, marginTop: 16 }}>
                      {[38, 52, 44, 66, 58, 100, 48].map((h, i) => (
                        <div key={i} style={{
                          flex: 1, height: `${h}%`, borderRadius: '5px 5px 3px 3px',
                          background: i === 5 ? '#E8C57E' : '#E7E2D6',
                          boxShadow: i === 5 ? '0 4px 10px -4px rgba(201,164,94,0.5)' : 'none',
                        }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 13, marginTop: 9 }}>
                      {['M','T','W','T','F','S','S'].map((d, i) => (
                        <div key={i} style={{
                          flex: 1, textAlign: 'center',
                          fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 11,
                          color: i === 5 ? '#C9A45E' : '#6B7A72',
                        }}>{d}</div>
                      ))}
                    </div>
                  </div>

                  {/* Events list */}
                  <div style={{ marginTop: 14 }}>
                    {/* Row 1 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 2px', borderBottom: '1px solid #E5E0D4' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 7, background: 'linear-gradient(135deg,#1F4D3A,#2A6A50)', flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 500, fontSize: 14, color: '#1F4D3A', whiteSpace: 'nowrap' }}>Pan-African Climate Summit</div>
                        <span style={{ height: 8, width: 118, borderRadius: 999, background: '#E7E2D6', display: 'inline-block' }} />
                      </div>
                      <div style={{ marginLeft: 'auto', fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#3A4A42' }}>847 reg.</div>
                    </div>
                    {/* Row 2 — skeleton */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 2px' }}>
                      <span style={{ width: 38, height: 38, borderRadius: 7, background: '#E7E2D6', display: 'inline-block', flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ width: 148, height: 8, borderRadius: 999, background: '#E7E2D6', display: 'inline-block' }} />
                        <span style={{ width: 96, height: 8, borderRadius: 999, background: '#E7E2D6', display: 'inline-block' }} />
                      </div>
                      <span style={{ width: 42, height: 8, borderRadius: 999, background: '#E7E2D6', display: 'inline-block', marginLeft: 'auto' }} />
                    </div>
                  </div>

                </main>
              </div>
            </div>{/* /browser */}

            {/* ── Phone ── */}
            <div
              ref={phoneRef}
              className="hero-phone"
              style={{
                position: 'absolute', right: 8, bottom: 14,
                width: 236, height: 452,
                background: '#0C1813',
                border: '1.5px solid rgba(232,197,126,0.32)',
                borderRadius: 36, padding: 11, zIndex: 30,
                boxShadow: '0 48px 80px -36px rgba(15,31,24,0.5), 0 0 0 1px rgba(0,0,0,0.18)',
              }}
            >
              {/* Notch */}
              <div style={{
                position: 'absolute', top: 13, left: '50%', transform: 'translateX(-50%)',
                width: 70, height: 7, borderRadius: 999,
                background: 'rgba(255,255,255,0.14)',
              }} />

              {/* Card */}
              <div style={{
                height: '100%', borderRadius: 26,
                padding: '26px 20px 18px',
                display: 'flex', flexDirection: 'column',
                position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(150deg,#163828 0%,#1F4D3A 52%,#2A6A50 100%)',
              }}>
                {/* Diagonal line texture */}
                <div style={{
                  position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none',
                  backgroundImage: 'repeating-linear-gradient(115deg, rgba(232,197,126,0.05) 0 2px, transparent 2px 9px)',
                }} />

                {/* Brand */}
                <div style={{
                  position: 'absolute', top: 18, right: 20,
                  fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600,
                  fontSize: 9, letterSpacing: '0.18em',
                  color: 'rgba(232,197,126,0.62)',
                }}>EVENTERA</div>

                {/* Avatar */}
                <div style={{
                  width: 58, height: 58, borderRadius: '50%',
                  border: '1.5px solid #E8C57E', marginTop: 12,
                  background: 'linear-gradient(135deg, rgba(232,197,126,0.4) 0%, rgba(180,120,60,0.6) 100%)',
                  boxShadow: '0 0 18px rgba(232,197,126,0.22)',
                }} />

                {/* Name */}
                <div style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600,
                  fontSize: 20, color: '#FFFFFF', marginTop: 15, letterSpacing: '-0.01em',
                }}>Amara Yusuf</div>

                {/* Role */}
                <div style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 13,
                  color: 'rgba(250,246,238,0.66)', marginTop: 3,
                }}>Policy Lead · African Union</div>

                {/* Share buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  {[
                    { label: 'IG', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(250,246,238,0.85)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="rgba(250,246,238,0.85)" stroke="none"/></svg> },
                    { label: 'WA', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(250,246,238,0.85)"><path d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-2.8.7.8-2.8-.2-.3A8 8 0 1112 20z"/></svg> },
                    { label: 'X',  icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(250,246,238,0.85)"><path d="M17.5 3h3l-7 8 8.2 10h-6.4l-5-6.2L7 21H4l7.5-8.6L3.6 3H10l4.5 5.7L17.5 3z"/></svg> },
                  ].map((b) => (
                    <div key={b.label} style={{
                      flex: 1, height: 36, borderRadius: 999,
                      background: 'rgba(255,255,255,0.10)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 11,
                      color: 'rgba(250,246,238,0.85)',
                    }}>
                      {b.icon}{b.label}
                    </div>
                  ))}
                </div>

                {/* Download button */}
                <div style={{
                  marginTop: 10, height: 42, borderRadius: 11,
                  background: '#E8C57E', color: '#0F1F18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: 13,
                  boxShadow: '0 6px 16px -6px rgba(201,164,94,0.55)',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F1F18" strokeWidth="2">
                    <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"/>
                  </svg>
                  Download card
                </div>

                {/* Ready */}
                <div style={{
                  textAlign: 'center', fontFamily: 'Inter, sans-serif',
                  fontSize: 11, color: 'rgba(250,246,238,0.45)', marginTop: 12,
                }}>Ready to share ✓</div>

              </div>
            </div>{/* /phone */}

          </div>{/* /comp */}
        </div>
      </div>
    </>
  );
}
