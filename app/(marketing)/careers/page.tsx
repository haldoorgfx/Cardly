import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Careers — Eventera',
  description: 'We are hiring. Join a small, focused team building the event platform for Africa and beyond — engineering, design, and delivery roles open now.',
};

const CAREERS_EMAIL = 'careers@eventera.so';

const C = {
  primary: '#1F4D3A', primaryDark: '#163828', primarySoft: '#E8EFEB',
  accent: '#E8C57E', accentDark: '#C9A45E',
  ink: '#0F1F18', inkSoft: '#3A4A42', muted: '#6B7A72',
  cream: '#FAF6EE', surface: '#FFFFFF', border: '#E5E0D4',
} as const;

const whyEventera = [
  { title: 'Small team, big surface area', desc: 'We are a small team working across product, design, and infrastructure. You will own real things from day one — not tickets in a queue.' },
  { title: 'Events are everywhere', desc: 'Every industry runs events. Our market is global and largely untouched by modern tooling. The opportunity is huge and the timing is right.' },
  { title: 'Remote-first, async by default', desc: 'We work across time zones with clear context and written communication. Deep work is protected. Meetings are rare and purposeful.' },
];

const roles = [
  {
    title: 'AI Engineer / Developer',
    type: 'Full-time · Remote',
    comp: '$$$$',
    desc: 'Build the product and the AI behind it — from the organizer dashboard and attendee card pipeline to ERA and the AI Copilot. You are strong across Next.js, TypeScript, and Supabase, and comfortable wiring up LLM APIs into real features that ship.',
    skills: ['Next.js', 'TypeScript', 'Supabase', 'LLM / AI APIs'],
  },
  {
    title: 'Designer',
    type: 'Full-time · Remote',
    comp: '$$$$',
    desc: 'Own the end-to-end design of Eventera — the organizer dashboard, the public event pages, and the signature attendee card. You think in systems, ship in components, and hold a high bar for mobile-first craft.',
    skills: ['Figma', 'Design systems', 'Mobile UX', 'Brand'],
  },
  {
    title: 'Project Manager',
    type: 'Full-time · Remote',
    comp: '$$$$',
    desc: 'Keep the roadmap moving — turn ideas into scoped, shipped work. You coordinate across engineering and design, protect focus, communicate clearly in writing, and make sure the right things get built on time.',
    skills: ['Roadmapping', 'Delivery', 'Written comms', 'Product sense'],
  },
];

const culture = [
  { title: 'Taste matters', desc: 'We are building a product for designers and organizers who care about craft. We hold our own work to the same standard we expect from them.' },
  { title: 'Write it down', desc: 'Decisions get documented. Context is shared. No one should have to ask twice for the same piece of information. Writing is how we think clearly.' },
  { title: 'Ship, then improve', desc: 'We bias toward getting things in front of users. Perfect is the enemy of learning. We iterate in public and get smarter with every release.' },
];

export default function CareersPage() {
  return (
    <>
      {/* Hero */}
      <section style={{ background: C.cream, backgroundImage: `radial-gradient(ellipse 80% 60% at 50% -10%, ${C.primarySoft} 0%, transparent 70%)`, padding: 'clamp(80px, 12vw, 140px) clamp(20px, 5vw, 80px) clamp(60px, 8vw, 100px)', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.primarySoft, border: `1px solid ${C.border}`, borderRadius: 999, padding: '6px 16px', marginBottom: 28 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.primary, display: 'inline-block' }} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: C.primary, letterSpacing: '0.02em' }}>We&apos;re hiring</span>
        </div>
        <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.1, maxWidth: 720, margin: '0 auto 24px' }}>Help us build the future of events.</h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(16px, 2vw, 20px)', color: C.inkSoft, maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.65 }}>Eventera is a small, focused team building the event platform we always wished existed. If you care about craft, love shipping, and want to work on something that matters to real people — keep reading.</p>
        <a href="#roles" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, background: C.primary, color: C.surface, padding: '14px 28px', borderRadius: 10, textDecoration: 'none', display: 'inline-block' }}>See open roles</a>
      </section>

      {/* Why Eventera */}
      <section style={{ background: C.surface, padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 56 }}>Why Eventera</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {whyEventera.map((w) => (
              <div key={w.title} style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 16, padding: '32px 28px' }}>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 12 }}>{w.title}</h3>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <section id="roles" style={{ scrollMarginTop: 80, background: C.cream, padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 12 }}>Open roles</h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: C.inkSoft, textAlign: 'center', maxWidth: 480, margin: '0 auto 56px' }}>We&apos;re hiring across engineering, design, and delivery. Remote-first, async by default. If one sounds like you, apply.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {roles.map((r) => (
              <div key={r.title} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '32px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 8 }}>{r.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: C.muted }}>{r.type}</span>
                      <span aria-label="Competitive compensation" title="Competitive — let's talk" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: C.accentDark, background: 'rgba(232,197,126,0.16)', border: `1px solid ${C.border}`, borderRadius: 999, padding: '2px 10px' }}>{r.comp}</span>
                    </div>
                  </div>
                  <a href={`mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent(`Application · ${r.title}`)}`} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14, background: C.primary, color: C.surface, padding: '10px 20px', borderRadius: 8, textDecoration: 'none', display: 'inline-block', flexShrink: 0 }}>Apply</a>
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.65, marginBottom: 20 }}>{r.desc}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {r.skills.map((sk) => (
                    <span key={sk} style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500, color: C.primary, background: C.primarySoft, border: `1px solid ${C.border}`, borderRadius: 999, padding: '4px 12px' }}>{sk}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Culture */}
      <section style={{ background: C.surface, padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 56 }}>How we work</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {culture.map((c) => (
              <div key={c.title} style={{ borderLeft: `3px solid ${C.accent}`, paddingLeft: 24 }}>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 10 }}>{c.title}</h3>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)', padding: 'clamp(72px, 10vw, 120px) clamp(20px, 5vw, 80px)', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', maxWidth: 600, margin: '0 auto 20px', lineHeight: 1.15 }}>Don&apos;t see your role? Send us your story anyway.</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, color: 'rgba(255,255,255,0.8)', maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.65 }}>If you care about what we are building and have something to contribute, email us at {CAREERS_EMAIL} — tell us what you do and what you want to work on.</p>
        <a href={`mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent('Working at Eventera')}`} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, background: '#FFFFFF', color: C.primary, padding: '14px 28px', borderRadius: 10, textDecoration: 'none', display: 'inline-block' }}>Email {CAREERS_EMAIL}</a>
      </section>
    </>
  );
}
