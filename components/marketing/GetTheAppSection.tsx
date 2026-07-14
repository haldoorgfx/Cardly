import { Ticket, CreditCard, WifiOff, ScanLine, BarChart2, Contact } from 'lucide-react';
import { AppPhone } from './AppPhone';
import { AppStoreBadges } from './AppStoreBadges';

const ATTENDEE = [
  { icon: Ticket, label: 'Ticket wallet with QR' },
  { icon: CreditCard, label: 'Your Eventera Card' },
  { icon: WifiOff, label: 'Works offline at the door' },
];
const ORGANIZER = [
  { icon: ScanLine, label: 'QR check-in scanner' },
  { icon: BarChart2, label: 'Live attendee counts' },
  { icon: Contact, label: 'Sponsor lead scanning' },
];

export function GetTheAppSection() {
  return (
    <section id="app" style={{ background: '#FAF6EE', paddingTop: 24, paddingBottom: 96 }}>
      <div className="mx-auto px-5 lg:px-10" style={{ maxWidth: 1200 }}>
        <div
          className="overflow-hidden rounded-[24px] px-6 py-12 sm:px-12 sm:py-16 lg:px-16"
          style={{ background: '#0F1F18' }}
        >
          <div className="grid lg:grid-cols-[1fr_360px] gap-12 lg:gap-[clamp(40px,6vw,72px)] items-center">
            {/* Copy */}
            <div>
              <span
                className="inline-flex items-center rounded-full"
                style={{ fontSize: 11, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#E8C57E', background: 'rgba(232,197,126,0.1)', border: '1px solid rgba(232,197,126,0.22)', padding: '5px 12px', marginBottom: 20 }}
              >
                The Eventera app
              </span>
              <h2 className="font-title font-bold" style={{ fontSize: 'clamp(28px, 4vw, 48px)', color: '#FAF6EE', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
                Your events, in your pocket.
              </h2>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 17, color: 'rgba(250,246,238,0.7)', lineHeight: 1.65, marginTop: 16, maxWidth: 400 }}>
                Tickets, your card, and check-in — on iOS and Android. Built to work offline.
              </p>

              <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-x-8 gap-y-7 mt-7 mb-8" style={{ maxWidth: 560 }}>
                {[
                  { head: 'For attendees', items: ATTENDEE },
                  { head: 'For organizers', items: ORGANIZER },
                ].map(({ head, items }) => (
                  <div key={head}>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#E8C57E', marginBottom: 14 }}>{head}</div>
                    <ul className="flex flex-col gap-3">
                      {items.map(({ icon: Icon, label }) => (
                        <li key={label} className="flex items-center gap-2.5" style={{ color: 'rgba(250,246,238,0.86)', fontSize: 14, fontFamily: 'var(--font-sans)' }}>
                          <Icon size={17} strokeWidth={1.7} style={{ color: '#E8C57E', flexShrink: 0 }} /> {label}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <AppStoreBadges onDark />
            </div>

            {/* Phone */}
            <div className="flex justify-center">
              <AppPhone />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
