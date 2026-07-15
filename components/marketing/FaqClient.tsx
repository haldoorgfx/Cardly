'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, LifeBuoy } from 'lucide-react';
import { FAQAccordion, type FAQItem } from './FAQAccordion';

const CATEGORIES: { name: string; items: FAQItem[] }[] = [
  {
    name: 'Getting started',
    items: [
      { q: 'What is Eventera?', a: 'Eventera is a full event-management platform. You create an event, take registrations and tickets, build an agenda, manage speakers and sponsors, check people in with QR, and run live engagement — all in one place. Every attendee also gets a personalized, branded Eventera Card to share.' },
      { q: 'What kinds of events is it built for?', a: 'Any kind — tech conferences, NGO and community gatherings, corporate events, festivals, religious events, summits. It scales from a 50-person workshop to a multi-day, multi-track conference.' },
      { q: 'How long does it take to set up an event?', a: 'A basic event with registration takes about ten minutes. Add tickets, an agenda and speakers as you go — nothing is required upfront.' },
      { q: 'Do attendees need an account to register?', a: 'No. Anyone can register from your public event page. They can optionally save their tickets and cards to the Eventera app or their account.' },
    ],
  },
  {
    name: 'The Eventera Card',
    items: [
      { q: 'What is the Eventera Card?', a: 'A personalized, branded card that is automatically generated for every registered attendee — with their name, role and your event branding. It is made to be shared on social, so your event travels further. No other platform does this.' },
      { q: 'When is the card created?', a: 'The moment someone registers. They can reveal, personalize and share it right away — on the web or in the app.' },
      { q: 'Is the card a ticket?', a: 'No. The card is a shareable graphic. The ticket (with its QR for check-in) is separate and lives in the wallet.' },
      { q: 'Can I brand the card to my event?', a: 'Yes. In Card Studio you control the layout, colors, logo and photo zones. Paid plans remove the Eventera watermark.' },
    ],
  },
  {
    name: 'Registration & tickets',
    items: [
      { q: 'Can I sell paid tickets?', a: 'Yes — free, paid, or a mix, with multiple ticket types (General, VIP, Early Bird). You can also run application-gated events, waitlists and group registration.' },
      { q: 'Which payment methods are supported?', a: 'Card payments plus mobile money — Flutterwave across Africa and WaafiPay for Somalia and Djibouti, alongside Stripe internationally.' },
      { q: 'Can I collect custom information at registration?', a: 'Yes. Add custom form fields with conditional logic, and capture dietary and accessibility needs where relevant.' },
    ],
  },
  {
    name: 'Check-in & on-site',
    items: [
      { q: 'How does check-in work?', a: 'Scan each attendee’s QR at the door from the Eventera app or a kiosk. You can also do walk-in registration on the spot and print badges.' },
      { q: 'Does check-in work without internet?', a: 'Yes. The app caches your event and queues scans while offline, then syncs automatically when the connection returns.' },
      { q: 'Can I manage meals and access passes?', a: 'Yes. Define entitlements (meals, sessions, zones), assign them per attendee, and redeem them by scanning — with a full redemption audit.' },
    ],
  },
  {
    name: 'The mobile app',
    items: [
      { q: 'Is there a mobile app?', a: 'A native iOS and Android app is coming soon. Attendees will get their ticket wallet, Eventera Card, agenda and entitlements; organizers will get on-site QR check-in and entitlement scanning. Everything works on the web in the meantime.' },
      { q: 'Can I sign in with Face or Touch ID?', a: 'Yes. Biometric sign-in is supported, so you don’t retype your password at the door.' },
      { q: 'Does the organizer scanner work offline?', a: 'Yes — scans queue offline and sync later, so the door keeps moving even when venue Wi-Fi drops.' },
    ],
  },
  {
    name: 'Pricing & billing',
    items: [
      { q: 'Is there a free plan?', a: 'Yes. Free covers one active event with up to 50 registrations and an Eventera Card for every attendee (with a small watermark).' },
      { q: 'What do paid plans add?', a: 'Pro ($19/mo) unlocks unlimited events, 500 registrations/month, the full agenda, networking and no watermark. Studio ($49/mo) adds ERA AI, the API, white-label and higher limits.' },
      { q: 'Can I cancel anytime?', a: 'Yes. Plans are month-to-month with no contract. Annual billing saves 20%.' },
    ],
  },
  {
    name: 'Data & privacy',
    items: [
      { q: 'Who owns my attendee data?', a: 'You do. Export your registrations and analytics at any time as CSV or PDF.' },
      { q: 'Is my data secure?', a: 'Data is stored with row-level security so each account only sees its own rows, and public pages only expose what you publish.' },
    ],
  },
  {
    name: 'Developers & API',
    items: [
      { q: 'Is there an API?', a: 'Yes, on the Studio plan. Create events, read registrations, render cards and check people in programmatically, plus webhooks for real-time events.' },
      { q: 'Can I white-label Eventera?', a: 'Yes, on Studio — bring your own domain, logo and colors so the whole experience is yours.' },
    ],
  },
];

export function FaqClient() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return CATEGORIES;
    return CATEGORIES
      .map((c) => ({ ...c, items: c.items.filter((it) => it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)) }))
      .filter((c) => c.items.length > 0);
  }, [q]);

  return (
    <div style={{ background: '#FAF6EE' }}>
      {/* Hero + search */}
      <section>
        <div className="mx-auto px-5 lg:px-10 pt-16 lg:pt-24 pb-10 text-center" style={{ maxWidth: 760 }}>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1F4D3A', marginBottom: 14 }}>
            Help &amp; FAQ
          </div>
          <h1 className="font-title font-extrabold" style={{ fontSize: 'clamp(36px, 5.5vw, 60px)', color: '#0F1F18', letterSpacing: '-0.03em', lineHeight: 1.03 }}>
            Questions, answered.
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 18, color: '#3A4A42', lineHeight: 1.6, marginTop: 16 }}>
            Everything about events, the Eventera Card, tickets, check-in and the app.
          </p>
          <div className="relative mt-8">
            <Search size={19} strokeWidth={2} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: '#65736B' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions…"
              aria-label="Search questions"
              className="w-full rounded-2xl border outline-none transition-colors focus:border-[#1F4D3A]"
              style={{ background: '#FFFFFF', borderColor: '#E5E0D4', color: '#0F1F18', fontFamily: 'var(--font-sans)', fontSize: 16, padding: '16px 18px 16px 48px' }}
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="mx-auto px-5 lg:px-10 pb-16" style={{ maxWidth: 820 }}>
          {filtered.length === 0 ? (
            <div className="text-center py-16" style={{ color: '#65736B', fontFamily: 'var(--font-sans)' }}>
              No questions match “{query}”. Try another word, or <Link href="/contact" className="underline" style={{ color: '#1F4D3A' }}>contact us</Link>.
            </div>
          ) : (
            filtered.map((cat) => (
              <div key={cat.name} className="mb-12">
                <h2 className="font-title font-bold mb-4" style={{ fontSize: 22, color: '#0F1F18', letterSpacing: '-0.02em' }}>{cat.name}</h2>
                <FAQAccordion items={cat.items} defaultOpen={-1} />
              </div>
            ))
          )}
        </div>
      </section>

      {/* Still need help */}
      <section className="border-t" style={{ borderColor: '#E5E0D4' }}>
        <div className="mx-auto px-5 lg:px-10 py-16 text-center" style={{ maxWidth: 760 }}>
          <div className="inline-grid place-items-center mb-5" style={{ width: 52, height: 52, borderRadius: 16, background: '#E8EFEB', color: '#1F4D3A' }}>
            <LifeBuoy size={24} strokeWidth={1.8} />
          </div>
          <h2 className="font-title font-bold" style={{ fontSize: 'clamp(24px, 3vw, 32px)', color: '#0F1F18', letterSpacing: '-0.025em' }}>
            Still need a hand?
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, color: '#3A4A42', marginTop: 10 }}>
            The Help Center has step-by-step guides, or reach the team directly.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/help" className="inline-flex items-center gap-2 rounded-xl font-semibold text-white transition hover:opacity-90" style={{ background: '#1F4D3A', fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', height: 50, padding: '0 22px', fontSize: 15 }}>
              Visit Help Center <ArrowRight size={16} strokeWidth={2} />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl font-semibold transition hover:border-[#1F4D3A]" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', color: '#0F1F18', fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', height: 50, padding: '0 22px', fontSize: 15 }}>
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
