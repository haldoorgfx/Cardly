import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CreditCard, Ticket, CalendarDays, Mic, ScanLine, BarChart2,
  MessageSquare, Network, Briefcase, Trophy, ArrowRight, ArrowUpRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Features — Eventera',
  description:
    'Everything Eventera does — the Eventera Card, registration & tickets, agenda, speakers, QR check-in, analytics, live Q&A, networking, sponsors and gamification.',
  openGraph: {
    title: 'Eventera features',
    description:
      'The Eventera Card, registration, agenda, check-in, analytics, live engagement and more — one platform.',
    url: `${process.env.NEXT_PUBLIC_APP_URL}/features`,
    siteName: 'Eventera',
    type: 'website',
  },
};

const C = { primary: '#1F4D3A', primarySoft: '#E8EFEB', accent: '#E8C57E', accentDark: '#C9A45E', accentSoft: '#F6EDDA', ink: '#0F1F18', inkSoft: '#3A4A42', muted: '#6B7A72', cream: '#FAF6EE', border: '#E5E0D4' } as const;

const FEATURES = [
  { icon: CreditCard, title: 'The Eventera Card', body: 'A personalized, branded card auto-generated for every attendee — made to be shared.', href: '/features/eventera-card', gold: true },
  { icon: Ticket, title: 'Registration & Tickets', body: 'Free, paid and mixed tickets with custom forms, approvals and waitlists.', href: '/features/registration' },
  { icon: CalendarDays, title: 'Agenda', body: 'Multi-track schedules attendees can filter and build their own from.', href: '/features/agenda' },
  { icon: Mic, title: 'Speakers', body: 'A speaker directory with profiles, sessions, bios and public pages.', href: '/features/speakers' },
  { icon: ScanLine, title: 'Check-in', body: 'QR check-in at the door, kiosk mode and on-the-spot walk-in registration.', href: '/features/check-in' },
  { icon: BarChart2, title: 'Analytics', body: 'Real-time registration, revenue, check-in and card-sharing metrics.', href: '/features/analytics' },
  { icon: MessageSquare, title: 'Live Q&A & Polls', body: 'Session engagement that fills the room and surfaces the best questions.', href: '/features/qa-polls' },
  { icon: Network, title: 'Networking', body: 'AI matchmaking and 1:1 messaging that connect the right attendees.', href: '/features/networking' },
  { icon: Briefcase, title: 'Sponsors', body: 'Exhibitor booths, resources and lead retrieval that sponsors love.', href: '/features/sponsors' },
  { icon: Trophy, title: 'Gamification', body: 'Points, badges and a live leaderboard that keep attendees coming back.', href: '/features/gamification' },
];

export default function FeaturesIndexPage() {
  return (
    <div style={{ background: C.cream }}>
      <section>
        <div className="mx-auto px-5 lg:px-10 pt-16 lg:pt-24 pb-12 text-center" style={{ maxWidth: 760 }}>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.primary, marginBottom: 14 }}>
            Features
          </div>
          <h1 className="font-title font-extrabold" style={{ fontSize: 'clamp(38px, 5.5vw, 64px)', color: C.ink, letterSpacing: '-0.03em', lineHeight: 1.02 }}>
            One platform. The whole event.
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 18, color: C.inkSoft, lineHeight: 1.6, marginTop: 16 }}>
            From the first registration to the last check-in — and a card in every attendee&apos;s hand.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto px-5 lg:px-10 pb-20" style={{ maxWidth: 1200 }}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              const gold = 'gold' in f && f.gold;
              return (
                <Link
                  key={f.title}
                  href={f.href}
                  className="group bg-white border rounded-2xl p-6 transition-all duration-200 hover:border-[#C9C3B1] hover:shadow-soft"
                  style={{ borderColor: C.border }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center justify-center" style={{ width: 46, height: 46, borderRadius: 12, background: gold ? C.accentSoft : C.primarySoft, color: gold ? C.accentDark : C.primary }}>
                      <Icon size={22} strokeWidth={1.8} />
                    </div>
                    <ArrowUpRight size={18} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: C.muted }} />
                  </div>
                  <h2 className="font-title font-bold" style={{ fontSize: 19, color: C.ink, letterSpacing: '-0.02em', marginTop: 16, marginBottom: 6 }}>{f.title}</h2>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14.5, color: C.inkSoft, lineHeight: 1.55 }}>{f.body}</p>
                </Link>
              );
            })}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-full font-semibold text-white transition hover:opacity-90" style={{ background: C.primary, fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', height: 52, padding: '0 24px', fontSize: 15 }}>
              Start free <ArrowRight size={16} strokeWidth={2} />
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 rounded-full font-semibold transition hover:border-[#1F4D3A]" style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, color: C.ink, fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', height: 52, padding: '0 24px', fontSize: 15 }}>
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
