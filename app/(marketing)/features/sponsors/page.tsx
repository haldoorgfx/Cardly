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
