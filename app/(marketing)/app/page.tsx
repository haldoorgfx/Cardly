import type { Metadata } from 'next';
import {
  Ticket, CreditCard, CalendarDays, Utensils, WifiOff, Fingerprint,
  Bell, CalendarPlus, ScanLine, Users, Contact, QrCode, Smartphone,
} from 'lucide-react';
import { AppPhone } from '@/components/marketing/AppPhone';
import { AppStoreBadges } from '@/components/marketing/AppStoreBadges';

export const metadata: Metadata = {
  title: 'The Eventera App — iOS & Android',
  description:
    'Tickets, your Eventera Card, and on-site check-in in one native app. For attendees and organizers. Works offline at the door. iOS and Android.',
  openGraph: {
    title: 'The Eventera App',
    description:
      'Tickets, your Eventera Card, and on-site check-in in one native app — for attendees and organizers. Works offline.',
    url: `${process.env.NEXT_PUBLIC_APP_URL}/app`,
    siteName: 'Eventera',
    type: 'website',
  },
};

const C = {
  primary: '#1F4D3A', primaryDark: '#163828', primarySoft: '#E8EFEB',
  accent: '#E8C57E', accentDark: '#C9A45E', ink: '#0F1F18', inkSoft: '#3A4A42',
  muted: '#65736B', cream: '#FAF6EE', surface: '#FFFFFF', border: '#E5E0D4',
} as const;

const ATTENDEE = [
  { icon: Ticket, title: 'Ticket wallet', body: 'Every ticket with its QR, ready to scan at the gate — even offline.' },
  { icon: CreditCard, title: 'Your Eventera Card', body: 'Reveal, personalize and share your branded card the moment you register.' },
  { icon: CalendarDays, title: 'Agenda & community', body: 'Build your schedule, follow sessions, and meet other attendees.' },
  { icon: Utensils, title: 'Meal & access passes', body: 'Show your entitlements at catering and access points — one tap.' },
  { icon: Bell, title: 'Push reminders', body: 'A nudge 24 hours before, and when your session is about to start.' },
  { icon: CalendarPlus, title: 'Add to calendar', body: 'Drop any event straight into your phone calendar.' },
];

const ORGANIZER = [
  { icon: ScanLine, title: 'On-site QR check-in', body: 'Scan attendees at the door — fast, with a running count.' },
  { icon: Utensils, title: 'Entitlement scanning', body: 'Redeem meals and access passes, with an offline queue that syncs later.' },
  { icon: WifiOff, title: 'Works offline', body: 'Cached events and queued scans keep the door moving when Wi-Fi drops.' },
  { icon: Users, title: 'Live attendee counts', body: 'See registrations, check-ins and no-shows update in real time.' },
  { icon: Contact, title: 'Sponsor lead scanning', body: 'Give sponsors a scanner to capture leads at their booth.' },
  { icon: Fingerprint, title: 'Biometric sign-in', body: 'Staff sign in with Face or Touch ID — no passwords at the gate.' },
];

function FeatureCard({ icon: Icon, title, body }: { icon: typeof Ticket; title: string; body: string }) {
  return (
    <article className="bg-white border rounded-2xl p-6 transition-all duration-200 hover:border-[#C9C3B1] hover:shadow-soft" style={{ borderColor: C.border }}>
      <div className="flex items-center justify-center mb-4" style={{ width: 44, height: 44, borderRadius: 12, background: C.primarySoft, color: C.primary }}>
        <Icon size={21} strokeWidth={1.8} />
      </div>
      <h3 className="font-title font-bold" style={{ fontSize: 18, color: C.ink, letterSpacing: '-0.02em', marginBottom: 6 }}>{title}</h3>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14.5, color: C.inkSoft, lineHeight: 1.55 }}>{body}</p>
    </article>
  );
}

export default function AppPage() {
  return (
    <div style={{ background: C.cream }}>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto px-5 lg:px-10 pt-16 lg:pt-24 pb-16" style={{ maxWidth: 1200 }}>
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6" style={{ background: C.primarySoft }}>
                <Smartphone size={13} strokeWidth={2} style={{ color: C.primary }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.primary, fontFamily: 'var(--font-sans)', letterSpacing: '0.02em' }}>Coming soon · iOS &amp; Android</span>
              </div>
              <h1 className="font-title font-extrabold" style={{ fontSize: 'clamp(38px, 6vw, 68px)', color: C.ink, letterSpacing: '-0.03em', lineHeight: 1.02 }}>
                The whole event, in your pocket.
              </h1>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 19, color: C.inkSoft, lineHeight: 1.6, marginTop: 20, maxWidth: 500 }}>
                Your tickets, your Eventera Card, and the fastest check-in at the door — in one native app for attendees and organizers. Built to keep working when the venue Wi-Fi doesn&apos;t. Coming soon to iOS and Android.
              </p>
              <div className="mt-8"><AppStoreBadges /></div>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2" style={{ fontSize: 13, color: C.muted, fontFamily: 'var(--font-sans)' }}>
                <span>Free when it lands</span><span aria-hidden>·</span><span>iOS 15+ &amp; Android 8+</span><span aria-hidden>·</span><span>Offline-ready</span>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <AppPhone />
            </div>
          </div>
        </div>
      </section>

      {/* For attendees */}
      <section className="border-t" style={{ borderColor: C.border }}>
        <div className="mx-auto px-5 lg:px-10 py-20" style={{ maxWidth: 1200 }}>
          <div className="mb-10">
            <div style={{ fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.primary, marginBottom: 12 }}>For attendees</div>
            <h2 className="font-title font-bold" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', color: C.ink, letterSpacing: '-0.03em', lineHeight: 1.06, maxWidth: 620 }}>
              Everything you need to show up ready.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ATTENDEE.map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* For organizers */}
      <section className="border-t" style={{ borderColor: C.border }}>
        <div className="mx-auto px-5 lg:px-10 py-20" style={{ maxWidth: 1200 }}>
          <div className="mb-10">
            <div style={{ fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.primary, marginBottom: 12 }}>For organizers</div>
            <h2 className="font-title font-bold" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', color: C.ink, letterSpacing: '-0.03em', lineHeight: 1.06, maxWidth: 620 }}>
              Run the door from your phone.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ORGANIZER.map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* Scan to download */}
      <section className="border-t" style={{ borderColor: C.border }}>
        <div className="mx-auto px-5 lg:px-10 py-20" style={{ maxWidth: 1200 }}>
          <div className="rounded-[24px] px-6 py-12 sm:px-12" style={{ background: 'linear-gradient(150deg, #163828 0%, #1F4D3A 60%, #235741 100%)' }}>
            <div className="grid sm:grid-cols-[auto_1fr] gap-8 items-center">
              <div className="grid place-items-center mx-auto sm:mx-0" style={{ width: 132, height: 132, borderRadius: 24, background: C.cream, color: C.primary }}>
                <QrCode size={92} strokeWidth={1.4} />
              </div>
              <div className="text-center sm:text-left">
                <h2 className="font-title font-bold" style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', color: C.cream, letterSpacing: '-0.03em', lineHeight: 1.08 }}>
                  Be first to know when it lands.
                </h2>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, color: 'rgba(250,246,238,0.78)', lineHeight: 1.6, marginTop: 12, maxWidth: 460 }}>
                  The Eventera app is on its way to iOS and Android. Watch this space — you&apos;ll be able to grab it from the App Store and Google Play at launch.
                </p>
                <div className="mt-7 flex justify-center sm:justify-start"><AppStoreBadges onDark /></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
