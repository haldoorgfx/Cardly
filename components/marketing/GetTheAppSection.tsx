import { Ticket, CreditCard, CalendarDays, Utensils, WifiOff, Fingerprint, ScanLine, BarChart2, Contact } from 'lucide-react';
import { AppPhone } from './AppPhone';
import { AppStoreBadges } from './AppStoreBadges';

const ATTENDEE = [
  { icon: Ticket, label: 'Ticket wallet with QR' },
  { icon: CreditCard, label: 'Your Eventera Card' },
  { icon: CalendarDays, label: 'Agenda & community' },
  { icon: Utensils, label: 'Meal & access passes' },
  { icon: WifiOff, label: 'Works offline at the door' },
  { icon: Fingerprint, label: 'Face / Touch ID sign-in' },
];
const ORGANIZER = [
  { icon: ScanLine, label: 'On-site QR check-in scanner' },
  { icon: Utensils, label: 'Meal scanning + offline queue' },
  { icon: BarChart2, label: 'Live attendee counts' },
  { icon: Contact, label: 'Sponsor lead scanning' },
];

export function GetTheAppSection() {
  return (
    <section id="app" style={{ background: '#FAF6EE', paddingTop: 24, paddingBottom: 96 }}>
      <div className="mx-auto px-5 lg:px-10" style={{ maxWidth: 1200 }}>
        <div
          className="relative overflow-hidden rounded-[28px] px-6 py-10 sm:px-12 sm:py-14 lg:px-16"
          style={{ background: 'linear-gradient(150deg, #163828 0%, #1F4D3A 60%, #235741 100%)' }}
        >
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
            {/* Copy */}
            <div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#E8C57E', marginBottom: 16 }}>
                The Eventera app
              </div>
              <h2 className="font-title font-bold" style={{ fontSize: 'clamp(30px, 4vw, 46px)', color: '#FAF6EE', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
                Your events, in your pocket.
              </h2>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 17, color: 'rgba(250,246,238,0.8)', lineHeight: 1.6, marginTop: 16, maxWidth: 460 }}>
                Tickets, the Eventera Card, and on-site check-in live in the native app — for iOS and Android. Built to work even when the venue Wi-Fi doesn&apos;t.
              </p>

              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6 mt-8">
                <div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(250,246,238,0.5)', marginBottom: 12 }}>For attendees</div>
                  <ul className="space-y-2.5">
                    {ATTENDEE.map(({ icon: Icon, label }) => (
                      <li key={label} className="flex items-center gap-2.5" style={{ color: 'rgba(250,246,238,0.9)', fontSize: 14, fontFamily: 'var(--font-sans)' }}>
                        <Icon size={16} strokeWidth={1.9} style={{ color: '#E8C57E', flexShrink: 0 }} /> {label}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(250,246,238,0.5)', marginBottom: 12 }}>For organizers</div>
                  <ul className="space-y-2.5">
                    {ORGANIZER.map(({ icon: Icon, label }) => (
                      <li key={label} className="flex items-center gap-2.5" style={{ color: 'rgba(250,246,238,0.9)', fontSize: 14, fontFamily: 'var(--font-sans)' }}>
                        <Icon size={16} strokeWidth={1.9} style={{ color: '#E8C57E', flexShrink: 0 }} /> {label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-9">
                <AppStoreBadges onDark />
              </div>
            </div>

            {/* Phone */}
            <div className="flex justify-center lg:justify-end">
              <AppPhone />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
