import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Careers — Eventera',
  description: 'Join the team building the future of event experiences. We are hiring designers, engineers, and growth leads.',
};

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
    title: 'Product Designer',
    type: 'Full-time · Remote',
    desc: 'Own the end-to-end design of Eventera — from the organizer dashboard to the attendee card experience. You think in systems, ship in components, and care deeply about mobile-first interaction.',
    skills: ['Figma', 'Design systems', 'Mobile UX', 'Prototyping'],
  },
  {
    title: 'Full-Stack Engineer',
    type: 'Full-time · Remote',
    desc: 'Build the features that make organizers choose Eventera and attendees love it. You are comfortable across Next.js, Supabase, and Node APIs. You ship fast and refactor thoughtfully.',
    skills: ['Next.js', 'TypeScript', 'PostgreSQL', 'Supabase'],
  },
  {
    title: 'Growth & Marketing',
    type: 'Full-time · Remote',
    desc: 'Own the pipeline from awareness to activation. You understand content, distribution, and conversion. You are comfortable with analytics and can write copy that does not sound like a press release.',
    skills: ['Content', 'SEO', 'Analytics', 'Email'],
  },
  {
    title: 'Customer Success',
    type: 'Part-time · Remote',
    desc: 'Be the first person organizers talk to when they need help. You translate feedback into product insights, resolve issues fast, and build the kind of relationship that turns customers into advocates.',
    skills: ['Communication', 'Product knowledge', 'Empathy', 'Organization'],
  },
];

const culture = [
  { title: 'Taste matters', desc: 'We are building a product used by designers at some of the best events in the world. We hold our work to the same standard we hold our customers to.' },
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
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: C.primary, letterSpacing: '0.02em' }}>We are hiring</span>
        </div>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.1, maxWidth: 720, margin: '0 auto 24px' }}>Help us build the future of events.</h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(16px, 2vw, 20px)', color: C.inkSoft, maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.65 }}>Eventera is a small, focused team building the event platform we always wished existed. If you care about craft, love shipping, and want to work on something that matters to real people — keep reading.</p>
        <a href="#roles" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, background: C.primary, color: C.surface, padding: '14px 28px', borderRadius: 10, textDecoration: 'none', display: 'inline-block' }}>See open roles</a>
      </section>

      {/* Why Eventera */}
      <section style={{ background: C.surface, padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 56 }}>Why Eventera</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {whyEventera.map((w) => (
              <div key={w.title} style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 16, padding: '32px 28px' }}>
                <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 12 }}>{w.title}</h3>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <section id="roles" style={{ scrollMarginTop: 80, background: C.cream, padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 12 }}>Open roles</h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: C.inkSoft, textAlign: 'center', maxWidth: 480, margin: '0 auto 56px' }}>Four positions. All remote. All with real ownership from day one.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {roles.map((r) => (
              <div key={r.title} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '32px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 4 }}>{r.title}</h3>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: C.muted }}>{r.type}</span>
                  </div>
                  <Link href="/contact" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14, background: C.primary, color: C.surface, padding: '10px 20px', borderRadius: 8, textDecoration: 'none', display: 'inline-block', flexShrink: 0 }}>Apply</Link>
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
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 56 }}>How we work</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {culture.map((c) => (
              <div key={c.title} style={{ borderLeft: `3px solid ${C.accent}`, paddingLeft: 24 }}>
                <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 10 }}>{c.title}</h3>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)', padding: 'clamp(72px, 10vw, 120px) clamp(20px, 5vw, 80px)', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', maxWidth: 600, margin: '0 auto 20px', lineHeight: 1.15 }}>Don&apos;t see your role? Send us your story anyway.</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, color: 'rgba(255,255,255,0.8)', maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.65 }}>If you care about what we are building and have something to contribute, we want to hear from you.</p>
        <Link href="/contact" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, background: '#FFFFFF', color: C.primary, padding: '14px 28px', borderRadius: 10, textDecoration: 'none', display: 'inline-block' }}>Get in touch</Link>
      </section>
    </>
  );
}
