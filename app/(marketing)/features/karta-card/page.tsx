import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Karta Card — Karta',
  description: 'The personalized social card every attendee gets and shares. Your design, their face, instant organic reach.',
};

const C = {
  primary: '#1F4D3A', primaryDark: '#163828', primarySoft: '#E8EFEB',
  accent: '#E8C57E', accentDark: '#C9A45E',
  ink: '#0F1F18', inkSoft: '#3A4A42', muted: '#6B7A72',
  cream: '#FAF6EE', surface: '#FFFFFF', border: '#E5E0D4',
} as const;

const cardSteps = [
  { n: '1', title: 'Upload your event design and define the zones', desc: 'Drop in your branded event artwork. Mark where the attendee name, title, and photo should go. Takes under 10 minutes.' },
  { n: '2', title: 'Attendees open the link and fill in their info', desc: 'They get a unique link. On mobile, they type their name, upload a photo, and preview their card in seconds. No app. No login.' },
  { n: '3', title: 'They download and share — your brand is everywhere', desc: 'One tap downloads their personalized PNG. They post it on LinkedIn, Instagram, or WhatsApp. Every share is a free impression for your event.' },
];

const cardStats = [
  { value: '740', label: 'avg cards shared per event' },
  { value: '14.8×', label: 'organic reach multiplier' },
  { value: 'Every plan', label: 'includes Karta Card — no upsell' },
];

function KartaCardMockup() {
  return (
    <section style={{ background: '#0F1F18', padding: 'clamp(72px,10vw,112px) clamp(20px,4vw,48px)', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 56, alignItems: 'center' }}>

        {/* LEFT — Text */}
        <div>
          <div style={{ display: 'inline-block', background: 'rgba(232,197,126,0.12)', border: '1px solid rgba(232,197,126,0.25)', color: '#E8C57E', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' as const, borderRadius: 999, padding: '5px 14px', fontFamily: 'Inter,sans-serif', marginBottom: 20 }}>
            The Karta Difference
          </div>
          <h2 style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 'clamp(1.7rem,3vw,2.4rem)', fontWeight: 700, color: '#FAF6EE', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 16 }}>
            Your design. Their face. Ready to share.
          </h2>
          <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 16, color: 'rgba(250,246,238,0.60)', lineHeight: 1.65, marginBottom: 24, maxWidth: 420 }}>
            Every person who registers gets a personalized card with their photo, name, and your event brand. They share it. Your event reaches people who haven&apos;t heard of you yet.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            {[
              'Auto-generated at registration — no design work needed',
              'One tap to WhatsApp, Instagram, LinkedIn, X',
              'Included on every plan, free or paid',
            ].map((b) => (
              <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: 'Inter,sans-serif', fontSize: 14, color: 'rgba(250,246,238,0.70)', lineHeight: 1.5 }}>
                <span style={{ color: '#E8C57E', marginTop: 2, flexShrink: 0 }}>✦</span>
                {b}
              </li>
            ))}
          </ul>
          <Link href="/features/karta-card#how" style={{ display: 'inline-flex', alignItems: 'center', background: '#E8C57E', color: '#0F1F18', fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 700, padding: '12px 22px', borderRadius: 10, textDecoration: 'none' }}>
            See how the card works →
          </Link>
        </div>

        {/* RIGHT — Two phones */}
        <div style={{ display: 'flex', flexDirection: 'row' as const, gap: 20, justifyContent: 'center', flexWrap: 'wrap' as const, alignItems: 'center' }}>

          {/* PHONE LEFT — Fill in */}
          <div style={{ width: 230, background: '#163828', borderRadius: 32, padding: 8, boxShadow: '0 32px 80px rgba(0,0,0,0.5)', position: 'relative', top: 20 }}>
            <div style={{ background: '#FFFFFF', borderRadius: 26, overflow: 'hidden' }}>
              <div style={{ background: '#1F4D3A', padding: 14, textAlign: 'center' as const }}>
                <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 700, color: '#FAF6EE' }}>Your Karta Card</div>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: 'rgba(250,246,238,0.6)', marginTop: 2 }}>Pan-African Climate Summit</div>
              </div>
              <div style={{ background: '#FAF6EE', margin: 12, border: '2px dashed #E5E0D4', borderRadius: 12, padding: 16, textAlign: 'center' as const }}>
                <div style={{ width: 52, height: 52, background: '#E8EFEB', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="7" width="18" height="13" rx="2" stroke="#6B7A72" strokeWidth="1.5" fill="none"/>
                    <circle cx="12" cy="13" r="3.5" stroke="#6B7A72" strokeWidth="1.5" fill="none"/>
                    <path d="M9 7V6a3 3 0 0 1 6 0v1" stroke="#6B7A72" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#6B7A72', marginTop: 8 }}>Tap to add your photo</div>
              </div>
              <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                <div style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', borderRadius: 8, height: 36, display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                  <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#0F1F18' }}>Amara Yusuf</span>
                </div>
                <div style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', borderRadius: 8, height: 36, display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                  <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#0F1F18' }}>Climate Policy Lead</span>
                </div>
              </div>
              <div style={{ margin: '0 12px 12px', background: '#1F4D3A', borderRadius: 10, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 700, color: '#FAF6EE' }}>Generate my card →</span>
              </div>
            </div>
          </div>

          {/* PHONE RIGHT — The card */}
          <div style={{ width: 230, background: '#163828', borderRadius: 32, padding: 8, boxShadow: '0 32px 80px rgba(0,0,0,0.5)', border: '2px solid rgba(232,197,126,0.4)' }}>
            <div style={{ background: 'linear-gradient(160deg,#1F4D3A 0%,#2A6A50 50%,rgba(232,197,126,0.15) 100%)', borderRadius: 26, overflow: 'hidden' }}>
              <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', textAlign: 'center' as const }}>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 8, fontWeight: 700, color: '#E8C57E', textTransform: 'uppercase' as const, letterSpacing: '0.2em', marginBottom: 20 }}>PAN-AFRICAN CLIMATE SUMMIT 2025</div>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#E8C57E,#C9A45E)', border: '2.5px solid rgba(232,197,126,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 22, fontWeight: 700, color: '#163828' }}>AY</span>
                </div>
                <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 19, fontWeight: 700, color: '#FAF6EE', marginTop: 12, marginBottom: 2, letterSpacing: '-0.01em' }}>Amara Yusuf</div>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: 'rgba(250,246,238,0.75)' }}>Climate Policy Lead</div>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: 'rgba(250,246,238,0.5)', marginTop: 2 }}>COP29 · Cairo</div>
                <div style={{ width: '70%', height: 1, background: 'rgba(232,197,126,0.2)', margin: '14px 0' }} />
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#E8C57E', letterSpacing: '0.1em' }}>✦ I&apos;m Attending</div>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: 'rgba(250,246,238,0.35)', marginTop: 4 }}>karta.cre8so.com</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                  {['W', 'IG', 'in', '↓'].map((icon) => (
                    <div key={icon} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 700, color: '#FAF6EE' }}>{icon}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 9, color: 'rgba(250,246,238,0.35)', textAlign: 'center' as const, marginTop: 4 }}>Tap to share</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default function KartaCardPage() {
  return (
    <>
      {/* Hero */}
      <section style={{ background: C.cream, backgroundImage: `radial-gradient(ellipse 80% 60% at 50% -10%, ${C.primarySoft} 0%, transparent 70%)`, padding: 'clamp(80px, 12vw, 140px) clamp(20px, 5vw, 80px) clamp(60px, 8vw, 100px)', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.accent, border: `1px solid ${C.accentDark}`, borderRadius: 999, padding: '6px 16px', marginBottom: 28 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.accentDark, display: 'inline-block' }} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: C.primaryDark, letterSpacing: '0.02em' }}>Karta Card</span>
        </div>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.1, maxWidth: 760, margin: '0 auto 24px' }}>The personalized card every attendee gets <span style={{ color: C.primary }}>— and shares.</span></h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(16px, 2vw, 20px)', color: C.inkSoft, maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.65 }}>Your event design. Their face and name. A shareable PNG in under 30 seconds. Organic reach that compounds long after the event ends.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, background: C.primary, color: C.surface, padding: '14px 28px', borderRadius: 10, textDecoration: 'none', display: 'inline-block' }}>Get started free</Link>
          <Link href="/pricing" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, background: C.surface, color: C.primary, border: `1.5px solid ${C.border}`, padding: '14px 28px', borderRadius: 10, textDecoration: 'none', display: 'inline-block' }}>See pricing</Link>
        </div>
      </section>

      <KartaCardMockup />

      {/* Features */}
      <section style={{ background: C.surface, padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 12 }}>Built for designers. Loved by attendees.</h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: C.muted, textAlign: 'center', maxWidth: 520, margin: '0 auto 56px' }}>No templates. No constraints. Your design — exactly as you made it.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>

            <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 16, padding: '32px 28px' }}>
              <div style={{ marginBottom: 20 }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="3" y="3" width="22" height="22" rx="3" fill="#E8EFEB" stroke="#1F4D3A" strokeWidth="1.5"/>
                  <circle cx="14" cy="12" r="4" fill="#E8C57E" stroke="#C9A45E" strokeWidth="1"/>
                  <path d="M6 24c0-4 3.6-7 8-7s8 3 8 7" stroke="#1F4D3A" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 10 }}>Your Design. Their Face.</h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>Upload any PNG or JPG — your full event artwork. Mark the zones for name, title, and photo. Karta composites the attendee&apos;s details onto your design server-side using sharp. Pixel-perfect every time.</p>
            </div>

            <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 16, padding: '32px 28px' }}>
              <div style={{ marginBottom: 20 }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="4" y="6" width="20" height="16" rx="3" fill="#E8EFEB" stroke="#1F4D3A" strokeWidth="1.5"/>
                  <path d="M4 10h20" stroke="#1F4D3A" strokeWidth="1.5"/>
                  <circle cx="8" cy="8" r="1.5" fill="#E8C57E"/>
                  <circle cx="12" cy="8" r="1.5" fill="#1F4D3A" opacity="0.3"/>
                  <path d="M8 15h12M8 19h8" stroke="#1F4D3A" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 10 }}>WhatsApp &amp; Instagram Ready</h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>Output is a standard PNG optimized for social sharing. Attendees tap Download and the file lands in their camera roll. Share to any platform in one more tap. No compression artifacts, no cropping surprises.</p>
            </div>

            <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 16, padding: '32px 28px' }}>
              <div style={{ marginBottom: 20 }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M14 3l2.8 7.5H25l-6.4 4.6 2.4 7.5L14 18.2l-7 4.4 2.4-7.5L3 10.5h8.2z" fill="#E8C57E" stroke="#C9A45E" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 10 }}>Included on Every Plan</h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>Karta Card is not an add-on. It is the core product. Every plan — including free — includes personalized card generation. The only difference on paid plans is watermark removal and higher event limits.</p>
            </div>

            <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 16, padding: '32px 28px' }}>
              <div style={{ marginBottom: 20 }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="11" fill="#E8EFEB" stroke="#1F4D3A" strokeWidth="1.5"/>
                  <path d="M8 14c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6" stroke="#1F4D3A" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M14 8v6l3 3" stroke="#E8C57E" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 10 }}>Organic Reach That Compounds</h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>Every card shared is a branded impression from a real attendee. Authentic peer endorsement — no paid media budget required. Events using Karta Card average 14.8× their attendee count in social impressions.</p>
            </div>

          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: C.cream, padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 56 }}>How it works</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {cardSteps.map((s) => (
              <div key={s.n} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: '50%', background: C.primary, color: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 18 }}>{s.n}</div>
                <div><h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 8, marginTop: 10 }}>{s.title}</h3><p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>{s.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: 'clamp(48px, 6vw, 72px) clamp(20px, 5vw, 80px)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40, textAlign: 'center' }}>
          {cardStats.map((s) => (
            <div key={s.value}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, color: C.primary, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.muted, marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)', padding: 'clamp(72px, 10vw, 120px) clamp(20px, 5vw, 80px)', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', maxWidth: 620, margin: '0 auto 20px', lineHeight: 1.15 }}>Your event design. In every attendee&apos;s feed.</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, color: 'rgba(255,255,255,0.8)', maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.65 }}>Upload your design and publish your first card link in under 10 minutes.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, background: '#FFFFFF', color: C.primary, padding: '14px 28px', borderRadius: 10, textDecoration: 'none', display: 'inline-block' }}>Start for free</Link>
          <Link href="/pricing" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, background: 'transparent', color: '#FFFFFF', border: '1.5px solid rgba(255,255,255,0.4)', padding: '14px 28px', borderRadius: 10, textDecoration: 'none', display: 'inline-block' }}>View pricing</Link>
        </div>
      </section>
    </>
  );
}
