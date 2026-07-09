import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sponsor Tools — Karta',
  description: 'Give sponsors real ROI: profiles, QR lead retrieval, sponsored sessions, and post-event analytics.',
};

const C = {
  primary: '#1F4D3A', primaryDark: '#163828', primarySoft: '#E8EFEB',
  accent: '#E8C57E', accentDark: '#C9A45E',
  ink: '#0F1F18', inkSoft: '#3A4A42', muted: '#6B7A72',
  cream: '#FAF6EE', surface: '#FFFFFF', border: '#E5E0D4',
} as const;

const spSteps = [
  { n: '1', title: 'Add sponsors with logo and tier', desc: 'Create sponsor profiles in minutes. Upload a logo, set the tier (Gold, Silver, Bronze), and write a short bio. Sponsors get their own profile page inside the event app.' },
  { n: '2', title: 'Sponsors access their booth and lead QR before the event', desc: 'Each sponsor gets a unique QR code and a self-service booth dashboard. Attendees scan to connect. Leads are captured instantly — no app required on the attendee side.' },
  { n: '3', title: 'Post-event: every sponsor gets their analytics report', desc: 'After the event closes, each sponsor receives a downloadable report: leads captured, booth visits, session engagement. Real numbers to show their team.' },
];

const spStats = [
  { value: '3×', label: 'higher lead quality vs badge scanning' },
  { value: '78%', label: 'sponsor renewal rate' },
  { value: '6 min', label: 'median time to export leads post-event' },
];

function SponsorsMockup() {
  return (
    <section style={{ background: '#163828', padding: '80px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        {/* Header */}
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, color: '#E8C57E', letterSpacing: '0.15em', textTransform: 'uppercase' as const, marginBottom: 16 }}>SPONSOR VIEW</p>
        <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 28, fontWeight: 700, color: '#FAF6EE', letterSpacing: '-0.02em', marginBottom: 12 }}>Every sponsor gets their own dashboard.</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: 'rgba(250,246,238,0.65)', marginBottom: 48 }}>Leads, analytics, booth visits — all in one place after the event.</p>

        {/* Browser Frame */}
        <div style={{ maxWidth: 860, margin: '0 auto', background: '#1A1A1A', borderRadius: 14, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
          {/* Chrome Bar */}
          <div style={{ background: '#2A2A2A', height: 36, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
            <div style={{ background: '#3A3A3A', borderRadius: 4, flex: '0 0 280px', height: 20, marginLeft: 12, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>karta.cre8so.com/sponsors/safaricom</span>
            </div>
          </div>

          {/* App Content */}
          <div style={{ background: '#FAF6EE', textAlign: 'left' }}>
            {/* Nav Strip */}
            <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E0D4', height: 44, display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#0F1F18' }}>Safaricom</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#6B7A72', marginLeft: 6 }}>Gold Sponsor · Pan-African Tech Summit</span>
              </div>
              <div style={{ background: '#2D7A4F', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, borderRadius: 999, padding: '4px 10px' }}>47 leads</div>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, padding: '16px 20px' }}>
              {[
                { val: '47', label: 'Leads collected', sub: '↑ 12 today' },
                { val: '284', label: 'Booth visits', sub: '↑ 34 today' },
                { val: '1,840', label: 'Session views', sub: 'Sponsored session' },
              ].map((s) => (
                <div key={s.val} style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 700, color: '#1F4D3A' }}>{s.val}</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#6B7A72', marginTop: 2 }}>{s.label}</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#2D7A4F', marginTop: 6 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Two-column layout */}
            <div style={{ display: 'flex', gap: 16, padding: '0 20px 20px' }}>
              {/* Left Panel */}
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: '#0F1F18', marginBottom: 10 }}>Lead capture</div>
                {/* Instruction strip */}
                <div style={{ background: '#E8EFEB', borderRadius: 8, padding: 12, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  {/* QR icon */}
                  <div style={{ width: 48, height: 48, background: '#FFFFFF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <rect x="3" y="3" width="10" height="10" rx="1" stroke="#0F1F18" strokeWidth="1.5" fill="none"/>
                      <rect x="5" y="5" width="6" height="6" rx="0.5" fill="#0F1F18"/>
                      <rect x="15" y="3" width="10" height="10" rx="1" stroke="#0F1F18" strokeWidth="1.5" fill="none"/>
                      <rect x="17" y="5" width="6" height="6" rx="0.5" fill="#0F1F18"/>
                      <rect x="3" y="15" width="10" height="10" rx="1" stroke="#0F1F18" strokeWidth="1.5" fill="none"/>
                      <rect x="5" y="17" width="6" height="6" rx="0.5" fill="#0F1F18"/>
                      <rect x="15" y="15" width="4" height="4" rx="0.5" fill="#0F1F18"/>
                      <rect x="21" y="15" width="4" height="4" rx="0.5" fill="#0F1F18"/>
                      <rect x="15" y="21" width="4" height="4" rx="0.5" fill="#0F1F18"/>
                      <rect x="21" y="21" width="4" height="4" rx="0.5" fill="#0F1F18"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#0F1F18' }}>Scan attendee QR codes at your booth to capture leads instantly.</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#6B7A72', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#2D7A4F' }} />
                      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#2D7A4F' }} />
                      2 staff scanning
                    </div>
                  </div>
                </div>
                {/* Recent Leads */}
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                  {[
                    { initials: 'AY', bg: 'linear-gradient(135deg,#E8C57E,#C9A45E)', name: 'Amara Yusuf', role: 'Climate Lead · Nairobi, Kenya', time: '2m ago' },
                    { initials: 'KB', bg: 'linear-gradient(135deg,#1F4D3A,#2A6A50)', name: 'Kwame Boateng', role: 'Product Dir. · Accra', time: '5m ago' },
                    { initials: 'TN', bg: 'linear-gradient(135deg,#C9A45E,#E8C57E)', name: 'Tinashe Nyathi', role: 'Founder · Harare', time: '8m ago' },
                  ].map((l) => (
                    <div key={l.initials} style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: l.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 700, color: '#163828' }}>{l.initials}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: '#0F1F18' }}>{l.name}</div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#6B7A72' }}>{l.role}</div>
                      </div>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#6B7A72', flexShrink: 0 }}>{l.time}</span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#1F4D3A', flexShrink: 0, marginLeft: 4 }}>View →</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel */}
              <div style={{ width: 220, flexShrink: 0 }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: '#0F1F18', marginBottom: 10 }}>Your sponsored session</div>
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: 600, color: '#C9A45E', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 6 }}>SPONSORED</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#0F1F18', marginBottom: 4 }}>Building Fintech at Scale</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#6B7A72', marginBottom: 12 }}>Mar 15 · 2:00 PM · Tech Track</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#6B7A72' }}>1,840 views</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#6B7A72', marginTop: 2 }}>312 attendees live</div>
                </div>
                <div style={{ background: '#E8EFEB', color: '#1F4D3A', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, borderRadius: 8, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>Export leads to CSV</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function SponsorsPage() {
  return (
    <>
      {/* Hero */}
      <section style={{ background: C.cream, backgroundImage: `radial-gradient(ellipse 80% 60% at 50% -10%, ${C.primarySoft} 0%, transparent 70%)`, padding: 'clamp(80px, 12vw, 140px) clamp(20px, 5vw, 80px) clamp(60px, 8vw, 100px)', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.primarySoft, border: `1px solid ${C.border}`, borderRadius: 999, padding: '6px 16px', marginBottom: 28 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.primary, display: 'inline-block' }} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: C.primary, letterSpacing: '0.02em' }}>Sponsor Tools</span>
        </div>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.1, maxWidth: 780, margin: '0 auto 24px' }}>Sponsors that show up&#8202;—&#8202;not just logos on a banner.</h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(16px, 2vw, 20px)', color: C.inkSoft, maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.65 }}>Give every sponsor a booth, a lead pipeline, and a post-event report. They come back because the ROI is real.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, background: C.primary, color: C.surface, padding: '14px 28px', borderRadius: 10, textDecoration: 'none', display: 'inline-block' }}>Get started free</Link>
          <Link href="/pricing" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, background: C.surface, color: C.primary, border: `1.5px solid ${C.border}`, padding: '14px 28px', borderRadius: 10, textDecoration: 'none', display: 'inline-block' }}>See pricing</Link>
        </div>
      </section>
      <SponsorsMockup />

      {/* Features */}
      <section style={{ background: C.surface, padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 12 }}>Four tools that make sponsors want to come back</h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: C.muted, textAlign: 'center', maxWidth: 520, margin: '0 auto 56px' }}>Built for organizers who want sponsors that renew — not sponsors that ghost you after the invoice.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>

            <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 16, padding: '32px 28px' }}>
              <div style={{ marginBottom: 20 }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="3" y="3" width="22" height="22" rx="4" fill="#E8EFEB" stroke="#1F4D3A" strokeWidth="1.5"/>
                  <circle cx="14" cy="11" r="4" fill="#E8C57E" stroke="#C9A45E" strokeWidth="1"/>
                  <path d="M6 22c0-4 3.6-7 8-7s8 3 8 7" stroke="#1F4D3A" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 10 }}>Sponsor Profiles &amp; Booths</h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>Each sponsor gets a profile page inside the event app — logo, bio, tier badge, and a contact link. Attendees browse before they approach. First impressions happen before the booth conversation.</p>
            </div>

            <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 16, padding: '32px 28px' }}>
              <div style={{ marginBottom: 20 }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="4" y="4" width="9" height="9" rx="1.5" fill="#E8EFEB" stroke="#1F4D3A" strokeWidth="1.5"/>
                  <rect x="15" y="4" width="9" height="9" rx="1.5" fill="#E8EFEB" stroke="#1F4D3A" strokeWidth="1.5"/>
                  <rect x="4" y="15" width="9" height="9" rx="1.5" fill="#E8EFEB" stroke="#1F4D3A" strokeWidth="1.5"/>
                  <rect x="17" y="17" width="5" height="5" rx="1" fill="#E8C57E"/>
                  <path d="M15 19h2M19 15v2" stroke="#1F4D3A" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 10 }}>QR Lead Retrieval</h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>Sponsors get a unique booth QR. Attendees scan once — name, title, and contact are captured automatically from their registration. Sponsors export a clean CSV after the event in under 6 minutes.</p>
            </div>

            <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 16, padding: '32px 28px' }}>
              <div style={{ marginBottom: 20 }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="3" y="6" width="22" height="16" rx="2" fill="#E8EFEB" stroke="#1F4D3A" strokeWidth="1.5"/>
                  <path d="M9 10h10M9 14h6" stroke="#1F4D3A" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="20" cy="14" r="3" fill="#E8C57E" stroke="#C9A45E" strokeWidth="1"/>
                </svg>
              </div>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 10 }}>Sponsored Sessions</h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>Mark any session as sponsored and display the sponsor logo alongside it in the programme. Session Q&amp;A and attendance data feed directly into the sponsor analytics report.</p>
            </div>

            <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 16, padding: '32px 28px' }}>
              <div style={{ marginBottom: 20 }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M4 22V12l6-4 6 4 6-6v16" stroke="#1F4D3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 22h20" stroke="#1F4D3A" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="10" cy="12" r="2" fill="#E8C57E"/>
                  <circle cx="16" cy="12" r="2" fill="#E8C57E"/>
                </svg>
              </div>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 10 }}>Sponsor Analytics</h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>Every sponsor gets a post-event PDF report: total leads, booth scans, session views, and engagement percentile vs. other sponsors. The data that makes renewals easy to justify.</p>
            </div>

          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: C.cream, padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 56 }}>How it works</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {spSteps.map((s) => (
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
          {spStats.map((s) => (
            <div key={s.value}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(40px, 6vw, 56px)', fontWeight: 700, color: C.primary, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.muted, marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)', padding: 'clamp(72px, 10vw, 120px) clamp(20px, 5vw, 80px)', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', maxWidth: 600, margin: '0 auto 20px', lineHeight: 1.15 }}>Sponsors that see the ROI come back. Every time.</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, color: 'rgba(255,255,255,0.8)', maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.65 }}>Set up your sponsor suite before the event. Your sponsors will thank you with renewals.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, background: '#FFFFFF', color: C.primary, padding: '14px 28px', borderRadius: 10, textDecoration: 'none', display: 'inline-block' }}>Start for free</Link>
          <Link href="/pricing" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, background: 'transparent', color: '#FFFFFF', border: '1.5px solid rgba(255,255,255,0.4)', padding: '14px 28px', borderRadius: 10, textDecoration: 'none', display: 'inline-block' }}>View pricing</Link>
        </div>
      </section>
    </>
  );
}
