import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Event Gamification — Karta',
  description: 'Points, leaderboards, badges, and challenges that keep attendees moving, engaging, and coming back.',
};

const C = {
  primary: '#1F4D3A', primaryDark: '#163828', primarySoft: '#E8EFEB',
  accent: '#E8C57E', accentDark: '#C9A45E',
  ink: '#0F1F18', inkSoft: '#3A4A42', muted: '#6B7A72',
  cream: '#FAF6EE', surface: '#FFFFFF', border: '#E5E0D4',
} as const;
const steps = [
  { n: '1', title: 'Organizer sets up point rules and challenges', desc: 'Define point values for check-ins, sessions, booth visits, and questions. Create sponsor quests with custom point rewards.'  },
  { n: '2', title: 'Attendees earn points by completing actions at the event', desc: 'Every check-in, session attended, booth visit, and Q&A submission earns points automatically. No extra app needed.'  },
  { n: '3', title: 'Leaderboard updates live — winners announced at closing', desc: 'Rankings refresh in real time. Every attendee knows where they stand. The top three get recognized at closing.'  },
];

const stats = [
  { value: '4×', label: 'more sponsor booth visits'  },
  { value: '2.3×', label: 'higher session attendance'  },
  { value: '89%', label: 'more networking from top leaderboard position'  },
];

function GamificationMockup() {
  return (
    <section style={{ background: '#0F1F18', padding: 'clamp(72px,10vw,112px) clamp(20px,4vw,48px)' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 'clamp(40px,6vw,80px)', alignItems: 'center' }}>
        {/* LEFT — copy */}
        <div>
          <div style={{ display: 'inline-block', background: 'rgba(232,197,126,0.12)', border: '1px solid rgba(232,197,126,0.25)', color: '#E8C57E', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' as const, borderRadius: 999, padding: '5px 14px', fontFamily: 'Inter,sans-serif', marginBottom: 20 }}>
            Attendee Engagement
          </div>
          <h2 style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 'clamp(1.7rem,3vw,2.4rem)', fontWeight: 700, color: '#FAF6EE', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 16 }}>
            Friendly competition that drives real event engagement.
          </h2>
          <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 16, color: 'rgba(250,246,238,0.65)', lineHeight: 1.7, marginBottom: 28, maxWidth: 460 }}>
            Points for every action. A live leaderboard everyone checks. Badges that mean something. The most engaged attendees rise — and everyone else wants in.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column' as const, gap: 11 }}>
            {['Points auto-update on check-ins, sessions, booth visits, Q&A', 'Leaderboard visible to all attendees in real time', 'Badges and achievements shown on attendee profiles'].map(pt => (
              <li key={pt} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'rgba(250,246,238,0.8)', fontFamily: 'Inter,sans-serif', lineHeight: 1.5 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(31,77,58,0.9)', border: '1px solid rgba(31,77,58,1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#E8C57E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                {pt}
              </li>
            ))}
          </ul>
          <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1F4D3A', color: '#FAF6EE', fontSize: 14, fontWeight: 600, fontFamily: 'Inter,sans-serif', padding: '12px 24px', borderRadius: 10, textDecoration: 'none', border: '1.5px solid rgba(31,77,58,0.6)' }}>
            Add gamification to your event →
          </Link>
        </div>
        {/* RIGHT — phone mockup */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: 300, background: '#163828', borderRadius: 36, padding: 10, boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ background: '#FAF6EE', borderRadius: 28, overflow: 'hidden' }}>
              {/* Top Bar */}
              <div style={{ background: '#1F4D3A', padding: 16 }}>
                <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 15, fontWeight: 700, color: '#FAF6EE' }}>🏆 Leaderboard</div>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: 'rgba(250,246,238,0.6)', marginTop: 2 }}>Pan-African Tech Summit · Day 1</div>
                <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.12)', color: '#FAF6EE', fontFamily: 'Inter,sans-serif', fontSize: 11, borderRadius: 999, padding: '4px 10px', marginTop: 10 }}>Your rank: #7 · 340 pts</div>
              </div>
              {/* Top 3 */}
              <div style={{ background: '#FFFFFF', margin: 8, borderRadius: 14, padding: 14 }}>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: '#6B7A72', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 12 }}>Top this event</div>
                {[
                  { medal: '🥇', initials: 'AO', avatarBg: 'linear-gradient(135deg,#E8C57E,#C9A45E)', initialsColor: '#163828', name: 'Dr. Amara Osei', org: 'Nairobi Tech', pts: '1,240 pts' },
                  { medal: '🥈', initials: 'KA', avatarBg: 'linear-gradient(135deg,#1F4D3A,#2A6A50)', initialsColor: '#FAF6EE', name: 'Kofi Asante', org: 'Accra Labs', pts: '980 pts' },
                  { medal: '🥉', initials: 'FH', avatarBg: 'linear-gradient(135deg,#C9A45E,#E8C57E)', initialsColor: '#163828', name: 'Fatima Hassan', org: 'Lagos Startup', pts: '820 pts' },
                ].map((r, i) => (
                  <div key={r.initials} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < 2 ? '1px solid #F5F0E8' : 'none' }}>
                    <span style={{ fontSize: 20 }}>{r.medal}</span>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: r.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 14, fontWeight: 700, color: r.initialsColor }}>{r.initials}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 700, color: '#0F1F18', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                      <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#6B7A72' }}>{r.org}</div>
                    </div>
                    <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: 700, color: '#1F4D3A', flexShrink: 0 }}>{r.pts}</div>
                  </div>
                ))}
              </div>
              {/* Badges */}
              <div style={{ background: '#FAF6EE', padding: '10px 12px' }}>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 700, color: '#0F1F18', marginBottom: 8 }}>Your badges</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                  {[
                    { emoji: '✅', label: 'Early Bird', locked: false },
                    { emoji: '🎤', label: '5 Sessions', locked: false },
                    { emoji: '🤝', label: 'Networker', locked: false },
                    { emoji: '🏢', label: 'Booth Hopper', locked: true },
                  ].map(b => (
                    <div key={b.label} style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 3, opacity: b.locked ? 0.3 : 1 }}>
                      <span style={{ fontSize: 18 }}>{b.emoji}</span>
                      <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 9, color: '#6B7A72' }}>{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Points Feed */}
              <div style={{ background: '#FFFFFF', margin: 8, borderRadius: 12, padding: 12 }}>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: '#6B7A72', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 8 }}>Recent points</div>
                {[
                  { pts: '+100', label: 'Attended Opening Keynote', time: 'now' },
                  { pts: '+50', label: 'Connected with Kofi Asante', time: '2m' },
                  { pts: '+200', label: 'Visited 4 sponsor booths', time: '10m' },
                ].map((a, i) => (
                  <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < 2 ? '1px solid #F5F0E8' : 'none' }}>
                    <span style={{ background: 'rgba(45,122,79,0.15)', color: '#2D7A4F', fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '3px 8px', flexShrink: 0 }}>{a.pts}</span>
                    <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#0F1F18', flex: 1 }}>{a.label}</span>
                    <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 10, color: '#6B7A72', flexShrink: 0 }}>{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function GamificationPage() {
  return (
    <>
      {/* Hero */}
      <section style={{ background: C.cream, backgroundImage: `radial-gradient(ellipse 80% 60% at 50% -10%, ${C.primarySoft} 0%, transparent 70%)`, padding: 'clamp(80px, 12vw, 140px) clamp(20px, 5vw, 80px) clamp(60px, 8vw, 100px)', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.primarySoft, border: `1px solid ${C.border}`, borderRadius: 999, padding: '6px 16px', marginBottom: 28 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.primary, display: 'inline-block'  }} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: C.primary, letterSpacing: '0.02em'  }}>Gamification</span>
        </div>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.1, maxWidth: 720, margin: '0 auto 24px'  }}>Turn attending into achieving.</h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(16px, 2vw, 20px)', color: C.inkSoft, maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.65 }}>Points, leaderboards, badges, and challenges that keep attendees moving, engaging, and coming back. The most-attended sessions. The most-active networkers. Recognized.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap'  }}>
          <Link href="/signup" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, background: C.primary, color: C.surface, padding: '14px 28px', borderRadius: 10, textDecoration: 'none', display: 'inline-block'  }}>Get started free</Link>
          <Link href="/pricing" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, background: C.surface, color: C.primary, border: `1.5px solid ${C.border}`, padding: '14px 28px', borderRadius: 10, textDecoration: 'none', display: 'inline-block'  }}>See pricing</Link>
        </div>
      </section>
      <GamificationMockup />
      {/* Features */}
      <section style={{ background: C.surface, padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)'  }}>
        <div style={{ maxWidth: 1100, margin: '0 auto'  }}>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 12 }}>Everything you need to run a game</h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: C.muted, textAlign: 'center', maxWidth: 520, margin: '0 auto 56px'  }}>Four mechanics that work together. Attendees play, sponsors win, organizers celebrate.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>

            <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 16, padding: '32px 28px'  }}>
              <div style={{ marginBottom: 20 }}><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="13" stroke="#1F4D3A" strokeWidth="1.5" /><path d="M14 8v6l3.5 3.5" stroke="#1F4D3A" strokeWidth="1.5" strokeLinecap="round" /><circle cx="14" cy="14" r="2.5" fill="#E8C57E" /></svg></div>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 10 }}>Points System</h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>Earn points for checking in, attending sessions, visiting sponsor booths, submitting Q&amp;A questions, and connecting with other attendees. Organizers set the rules.</p>
            </div>

            <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 16, padding: '32px 28px'  }}>
              <div style={{ marginBottom: 20 }}><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="3" y="17" width="4" height="8" rx="1" fill="#E8EFEB" stroke="#1F4D3A" strokeWidth="1.5" /><rect x="9" y="12" width="4" height="13" rx="1" fill="#E8EFEB" stroke="#1F4D3A" strokeWidth="1.5" /><rect x="15" y="7" width="4" height="18" rx="1" fill="#E8EFEB" stroke="#1F4D3A" strokeWidth="1.5" /><rect x="21" y="3" width="4" height="22" rx="1" fill="#E8C57E" stroke="#C9A45E" strokeWidth="1.5" /></svg></div>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 10 }}>Live Leaderboard</h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>A real-time leaderboard visible to all attendees. The competitive ones climb it. Everyone else sees who is most engaged — and wants in.</p>
            </div>

            <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 16, padding: '32px 28px'  }}>
              <div style={{ marginBottom: 20 }}><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 3l2.8 7.5H25l-6.4 4.6 2.4 7.5L14 18.2l-7 4.4 2.4-7.5L3 10.5h8.2z" fill="#E8EFEB" stroke="#1F4D3A" strokeWidth="1.5" strokeLinejoin="round" /><circle cx="14" cy="12" r="2" fill="#E8C57E" /></svg></div>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 10 }}>Badges &amp; Achievements</h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>Award badges for milestones: first check-in, attended 5 sessions, visited all sponsors. Badges show on attendee profiles. They become a credential worth sharing.</p>
            </div>

            <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 16, padding: '32px 28px'  }}>
              <div style={{ marginBottom: 20 }}><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="8" width="20" height="15" rx="2" fill="#E8EFEB" stroke="#1F4D3A" strokeWidth="1.5" /><path d="M10 5h8" stroke="#1F4D3A" strokeWidth="1.5" strokeLinecap="round" /><path d="M14 5v3" stroke="#1F4D3A" strokeWidth="1.5" strokeLinecap="round" /><path d="M8 15h12M8 19h6" stroke="#1F4D3A" strokeWidth="1.5" strokeLinecap="round" /></svg></div>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 10 }}>Sponsor Quests</h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>Create sponsored challenges. Visit the Acme booth and scan their QR for 200 points. Gives sponsors foot traffic and gives attendees a reason to explore.</p>
            </div>

          </div>
        </div>
      </section>
      {/* How it works */}
      <section style={{ background: C.cream, padding: 'clamp(60px, 8vw, 100px) clamp(20px, 5vw, 80px)'  }}>
        <div style={{ maxWidth: 860, margin: '0 auto'  }}>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 56 }}>How it works</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {steps.map((s) => (
              <div key={s.n} style={{ display: 'flex', gap: 24, alignItems: 'flex-start'  }}>
                <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: '50%', background: C.primary, color: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 18 }}>{s.n}</div>
                <div><h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 8, marginTop: 10 }}>{s.title}</h3><p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>{s.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: 'clamp(48px, 6vw, 72px) clamp(20px, 5vw, 80px)'  }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40, textAlign: 'center'  }}>
          {stats.map((s) => (
            <div key={s.value}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(40px, 6vw, 56px)', fontWeight: 700, color: C.primary, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.muted, marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)', padding: 'clamp(72px, 10vw, 120px) clamp(20px, 5vw, 80px)', textAlign: 'center'  }}>
        <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', maxWidth: 600, margin: '0 auto 20px', lineHeight: 1.15 }}>Ready to make your event unforgettable?</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, color: 'rgba(255,255,255,0.8)', maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.65 }}>Set up gamification in minutes. Your attendees will thank you for it.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap'  }}>
          <Link href="/signup" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, background: '#FFFFFF', color: C.primary, padding: '14px 28px', borderRadius: 10, textDecoration: 'none', display: 'inline-block'  }}>Start for free</Link>
          <Link href="/pricing" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, background: 'transparent', color: '#FFFFFF', border: '1.5px solid rgba(255,255,255,0.4)', padding: '14px 28px', borderRadius: 10, textDecoration: 'none', display: 'inline-block'  }}>View pricing</Link>
        </div>
      </section>
    </>
  );
}