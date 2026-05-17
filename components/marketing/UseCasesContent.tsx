'use client';

import { useState } from 'react';
import {
  Mic, Heart, Flag, Sun, ShoppingBag, GraduationCap,
  ArrowRight, Quote,
} from 'lucide-react';
import { CardMockup, CardVariant } from '@/components/marketing/CardMockup';
import Reveal from '@/components/marketing/Reveal';

/* ── Types ───────────────────────────────────────────────── */
interface CardData {
  variant: CardVariant;
  org: string;
  event: string;
  role: string;
  name: string;
  initials: string;
  title: string;
  date: string;
  location: string;
  tilt: number;
}

interface UseCase {
  id: string;
  label: string;
  icon: React.ReactNode;
  headline: string;
  intro: string;
  cards: CardData[];
  problems: string[];
  quote: { text: string; who: string };
  template: string;
}

/* ── Data ────────────────────────────────────────────────── */
const USE_CASES: UseCase[] = [
  {
    id: 'conferences',
    label: 'Conferences',
    icon: <Mic size={16} strokeWidth={1.8} />,
    headline: 'Make every speaker, sponsor and attendee a poster for your event.',
    intro:
      'Conferences are won on the timeline. Cardly turns your speaker grid, sponsor deck, and ticket-holder list into 2,000 individual posts — each on-brand, each personal.',
    cards: [
      { variant: 'forest', org: 'AFRICA TECH FESTIVAL', event: 'Africa Tech Festival 2026', role: "I'M SPEAKING AT", name: 'Kwame Mensah', initials: 'KM', title: 'Product Engineer · Paystack', date: '12 MAR 2026', location: 'LAGOS', tilt: -4 },
      { variant: 'cream',  org: 'AFRICA TECH FESTIVAL', event: "I'll see you in Lagos.", role: "I'M ATTENDING", name: 'Zainab Okafor', initials: 'ZO', title: 'Backend Engineer · Flutterwave', date: '12 MAR 2026', location: 'LAGOS', tilt: 3 },
      { variant: 'gold',   org: 'AFRICA TECH FESTIVAL', event: 'Proud Gold sponsor.', role: "I'M SPONSORING", name: 'Paystack', initials: 'P', title: 'Gold Tier', date: '12 MAR 2026', location: 'LAGOS', tilt: -2 },
    ],
    problems: [
      'Speakers post off-brand grids and tag the wrong handles.',
      'Attendees share a quick selfie with no context — your hashtag dies day one.',
      'Sponsors got visibility you promised. The assets they shared looked like clipart.',
      "Designer queue is full and your event starts Thursday.",
    ],
    quote: { text: "We sent 1,800 speakers a Cardly link and saw 1,400 posts in the first 48 hours. The hashtag trended in three cities.", who: 'Festival Producer · Africa Tech Festival' },
    template: 'Tech summit template · 3 variants',
  },
  {
    id: 'ngos',
    label: 'NGOs',
    icon: <Heart size={16} strokeWidth={1.8} />,
    headline: 'Awareness needs faces. Cardly gives every supporter one.',
    intro:
      'When the cause matters, the people backing it should be visible. Cardly cards turn donors, volunteers and supporters into a wall of branded portraits.',
    cards: [
      { variant: 'duotone', org: 'PAN-AFRICAN CLIMATE', event: 'I stand for the climate.', role: "I'M SUPPORTING", name: 'Fatou Diop', initials: 'FD', title: 'Climate Researcher · Dakar', date: 'EARTH DAY', location: 'GLOBAL', tilt: -4 },
      { variant: 'forest',  org: 'WATER FOR EAST AFRICA', event: 'Clean water. Every village.', role: "I'M VOLUNTEERING", name: 'Esther Mwangi', initials: 'EM', title: 'Field Volunteer · Nairobi', date: 'JUL 2026', location: 'TURKANA', tilt: 3 },
      { variant: 'cream',   org: 'WATER FOR EAST AFRICA', event: 'I gave water to 12 families.', role: "I'M DONATING", name: 'Tunde Adebayo', initials: 'TA', title: 'Recurring Donor', date: 'ONGOING', location: 'REMOTE', tilt: -2 },
    ],
    problems: [
      'Awareness graphics are flat. Faces are not.',
      'Volunteers want to represent — but a Canva template is too much work.',
      'Donor cards make giving public, which doubles repeat donations.',
      'Most campaign assets feel corporate. Yours can feel personal.',
    ],
    quote: { text: "We turned 600 donors into 600 announcement posts. Repeat-gift rate that quarter was the highest we've seen.", who: 'Comms Lead · Water for East Africa' },
    template: 'Awareness drive template · 3 variants',
  },
  {
    id: 'political',
    label: 'Political',
    icon: <Flag size={16} strokeWidth={1.8} />,
    headline: 'Endorsements that look professional. Posts that scale to thousands.',
    intro:
      'Rallies. Endorsements. Voter mobilization. Each requires a different card — same brand, different message. Cardly variants do exactly that.',
    cards: [
      { variant: 'forest',  org: 'UNITED FOR EAST AFRICA', event: "I'm with the movement.", role: "I'M ENDORSING", name: 'Liya Tesfaye', initials: 'LT', title: 'Volunteer Captain · Addis', date: 'OCT 2025', location: 'ADDIS', tilt: -4 },
      { variant: 'gold',    org: 'UNITED FOR EAST AFRICA', event: "I'll be at the rally.", role: "I'M ATTENDING", name: 'Samuel Okello', initials: 'SO', title: 'Supporter · Kampala', date: '14 OCT 2025', location: 'KAMPALA', tilt: 2 },
      { variant: 'duotone', org: 'UNITED FOR EAST AFRICA', event: 'I voted today.', role: "I'M VOTING", name: 'Halima Yusuf', initials: 'HY', title: 'First-time voter', date: 'ELECTION DAY', location: 'DAR ES SALAAM', tilt: -2 },
    ],
    problems: [
      'Endorsement graphics either look amateur or take a week to make.',
      'Field volunteers want their face on the campaign — give them the moment.',
      'Rally attendance posts are your second wave of reach.',
      'Each region needs its own variant. Same brand. Different message.',
    ],
    quote: { text: "We shipped one Cardly link per region. 22 regions, 22 variants — and the central comms team didn't have to design any of them.", who: 'Field Director · East Africa Campaign' },
    template: 'Campaign rally template · 4 variants',
  },
  {
    id: 'religious',
    label: 'Religious',
    icon: <Sun size={16} strokeWidth={1.8} />,
    headline: 'Programs and events your community actually shares.',
    intro:
      "Mosques, churches, temples, fellowships. Cardly cards let members announce attendance, fundraising and registration — without leaving WhatsApp.",
    cards: [
      { variant: 'gold',   org: 'GLOBAL HALAL SUMMIT', event: 'Global Halal Summit', role: "I'M ATTENDING", name: 'Yusuf Bello', initials: 'YB', title: 'Delegate · Kano', date: '18 JUL 2026', location: 'ISTANBUL', tilt: -4 },
      { variant: 'forest', org: 'REDEEMER YOUTH CONFERENCE', event: 'Youth Conference 2026', role: "I'M GOING", name: 'Chika Nwosu', initials: 'CN', title: 'Youth Member · Lagos', date: '22–24 AUG', location: 'LAGOS', tilt: 3 },
      { variant: 'cream',  org: 'RAMADAN GIVING DRIVE', event: 'I gave Iftar for 30 families.', role: "I'M GIVING", name: 'Aminah Khalid', initials: 'AK', title: 'Community Donor', date: 'RAMADAN 2026', location: 'GLOBAL', tilt: -2 },
    ],
    problems: [
      'Members want to invite their network. They need the asset, not a slogan.',
      'Different programs (youth, women, drives) need different cards. All on-brand.',
      'A photo with the program name makes registration feel personal.',
      "WhatsApp Status is where your community lives. Design for it.",
    ],
    quote: { text: "Our Youth Conference filled to capacity in 9 days. Half of the registrations cited 'a friend's Status card' as how they heard about it.", who: 'Programs Director · Redeemer Conference' },
    template: 'Community event template · 3 variants',
  },
  {
    id: 'brand',
    label: 'Brand activations',
    icon: <ShoppingBag size={16} strokeWidth={1.8} />,
    headline: 'Customers do the launching for you. You just give them the asset.',
    intro:
      "Product launches, store openings, sponsorships. Cardly turns the people excited about your brand into the people advertising your brand.",
    cards: [
      { variant: 'forest',  org: 'MTN BRAND ACTIVATION', event: 'MTN 5G is here.', role: "I'M CELEBRATING", name: 'Chidinma O.', initials: 'CO', title: 'MTN Ambassador', date: '01 SEP 2026', location: 'ACCRA', tilt: -4 },
      { variant: 'duotone', org: 'GLOVO LAUNCH · KIGALI', event: 'First delivery, on us.', role: "I'M ORDERING", name: 'Patrick Niyonsenga', initials: 'PN', title: 'Glovo Founding Customer', date: 'LAUNCH WEEK', location: 'KIGALI', tilt: 3 },
      { variant: 'gold',    org: 'PIGGYVEST 7 YEARS', event: "I've been saving since 2019.", role: "I'M A PIGGYBANK", name: 'Adaeze E.', initials: 'AE', title: 'Long-term Saver', date: 'ANNIVERSARY', location: 'LAGOS', tilt: -2 },
    ],
    problems: [
      'Launch hype is built by your customers, not your in-house team.',
      "Brand ambassadors deserve assets that match the campaign they're repping.",
      "Store openings need local faces — not the same hero graphic everywhere.",
      "Sponsorship visibility you paid for, finally lands on someone's feed.",
    ],
    quote: { text: "We had 4,500 customers post a Cardly card in launch week. Our paid media team called it the cheapest UGC engine they've ever bought.", who: 'CMO · Pan-African Fintech' },
    template: 'Product launch template · 4 variants',
  },
  {
    id: 'education',
    label: 'Education',
    icon: <GraduationCap size={16} strokeWidth={1.8} />,
    headline: 'Graduations, alumni, scholarships — moments people want to share.',
    intro:
      "Schools and universities sit on the best UGC moments in the calendar — and almost never harvest them. Cardly is how you turn graduations and class reunions into reach.",
    cards: [
      { variant: 'cream',  org: 'UNIVERSITY OF NAIROBI', event: 'Class of 2026.', role: 'I JUST GRADUATED', name: 'Wanjiku Kariuki', initials: 'WK', title: 'BSc Computer Science', date: 'DEC 2026', location: 'NAIROBI', tilt: -4 },
      { variant: 'forest', org: 'MASTERCARD FOUNDATION SCHOLARS', event: "I'm a Mastercard Scholar.", role: "I'M A RECIPIENT", name: 'Joseph Mensah', initials: 'JM', title: 'Cohort 2026 · Ashesi', date: 'AUG 2026', location: 'ACCRA', tilt: 3 },
      { variant: 'gold',   org: 'UNIVERSITY OF NAIROBI ALUMNI', event: "Class of '08, still here.", role: "I'M ALUMNI", name: 'Dr. Nadia Hassan', initials: 'NH', title: 'MD · Public Health', date: 'REUNION 2026', location: 'NAIROBI', tilt: -2 },
    ],
    problems: [
      "Graduation week is your best alumni-recruiting tool. Nobody captures it.",
      "Alumni want to represent the school. Give them a way that doesn't look like clipart.",
      "Scholarship recipients become advocates if you let them.",
      "Class-of-X cards are the gateway to a 20-year relationship.",
    ],
    quote: { text: "We launched Cardly with our December graduation. 60% of graduates posted a card. The alumni office is calling it the most-engaged campaign in a decade.", who: 'Director of Communications · University of Nairobi' },
    template: 'Graduation template · 3 variants',
  },
];

/* ── TabBar ──────────────────────────────────────────────── */
function TabBar({ active, setActive }: { active: string; setActive: (id: string) => void }) {
  return (
    <div className="sticky top-[68px] z-30 border-b" style={{ background: 'rgba(250,246,238,0.90)', backdropFilter: 'blur(12px)', borderColor: '#E5E0D4' }}>
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10">
        <div
          className="flex items-center gap-1 py-3 overflow-x-auto"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {USE_CASES.map((u) => {
            const isActive = active === u.id;
            return (
              <button
                key={u.id}
                onClick={() => setActive(u.id)}
                className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium transition-all border ${
                  isActive
                    ? 'bg-primary text-cream border-primary shadow-sm'
                    : 'bg-surface text-ink-soft border-border hover:text-primary'
                }`}
                style={!isActive ? { borderColor: '#E5E0D4' } : undefined}
              >
                {u.icon}
                <span className="whitespace-nowrap">{u.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── UseCaseSection ──────────────────────────────────────── */
function UseCaseSection({ u }: { u: UseCase }) {
  return (
    <section>
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-16 lg:py-24">
        {/* Header */}
        <Reveal>
          <div className="max-w-[820px] mb-12 lg:mb-16">
            <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5 inline-flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary-soft text-primary grid place-items-center shrink-0">
                {u.icon}
              </span>
              {u.label}
            </div>
            <h2 className="font-display font-bold text-ink text-[32px] sm:text-[42px] lg:text-[52px] leading-[1.02] tracking-[-0.03em]">
              {u.headline}
            </h2>
            <p className="mt-5 text-ink-soft text-[16px] lg:text-[18px] leading-[1.6]">
              {u.intro}
            </p>
          </div>
        </Reveal>

        {/* Two-col layout */}
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-start">

          {/* LEFT — card fan */}
          <Reveal delay={0}>
          <div
            className="relative rounded-3xl overflow-hidden p-6 sm:p-8 lg:p-10"
            style={{
              background: 'rgba(232,239,235,0.4)',
              border: '1px solid #E5E0D4',
              minHeight: 440,
            }}
          >
            {/* dot grid */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(31,77,58,0.08) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
            <div className="relative font-mono text-[10px] tracking-[0.22em] uppercase text-primary mb-8">
              Example variants
            </div>

            {/* Card fan — 3 cards side by side with individual tilts */}
            <div className="relative grid grid-cols-3 gap-3 sm:gap-4 items-end">
              {u.cards.map((c, i) => (
                <div
                  key={i}
                  style={{
                    transform: `rotate(${c.tilt}deg) translateY(${i === 1 ? -10 : 0}px)`,
                    transformOrigin: i === 0 ? 'bottom right' : i === 2 ? 'bottom left' : 'center',
                  }}
                >
                  <CardMockup
                    width={160}
                    variant={c.variant}
                    org={c.org}
                    event={c.event}
                    role={c.role}
                    name={c.name}
                    initials={c.initials}
                    title={c.title}
                    date={c.date}
                    location={c.location}
                  />
                </div>
              ))}
            </div>

            <div className="relative mt-8 flex items-center gap-4">
              <a
                href="/signup"
                className="inline-flex items-center gap-2 text-primary font-medium text-[14px] hover:gap-3 transition-all"
              >
                See template <ArrowRight size={14} strokeWidth={2} />
              </a>
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted">
                {u.template}
              </span>
            </div>
          </div>
          </Reveal>

          {/* RIGHT — problems + quote */}
          <Reveal delay={120}>
          <div>
            <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-5">
              What Cardly fixes
            </div>
            <ol className="space-y-5">
              {u.problems.map((p, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="shrink-0 font-mono text-[12px] font-semibold bg-primary text-cream w-7 h-7 rounded-full grid place-items-center mt-0.5">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="text-ink text-[16px] lg:text-[17px] leading-[1.5] tracking-[-0.005em]">
                    {p}
                  </p>
                </li>
              ))}
            </ol>

            {/* Quote card */}
            <figure
              className="relative mt-10 rounded-2xl p-6 lg:p-7 bg-surface"
              style={{ border: '1px solid #E5E0D4' }}
            >
              <span className="absolute -top-3.5 left-6 text-accent bg-surface px-1">
                <Quote size={22} strokeWidth={1.5} />
              </span>
              <blockquote className="font-display text-ink text-[17px] lg:text-[19px] leading-[1.4] tracking-[-0.01em] italic">
                &ldquo;{u.quote.text}&rdquo;
              </blockquote>
              <figcaption className="mt-4 font-mono text-[10px] tracking-[0.18em] uppercase text-muted">
                {u.quote.who}
              </figcaption>
              <div className="mt-1 font-mono text-[9px] tracking-[0.18em] uppercase" style={{ color: 'rgba(107,122,114,0.6)' }}>
                [placeholder]
              </div>
            </figure>
          </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Main export (tabbed content only) ──────────────────── */
export function UseCasesContent() {
  const [active, setActive] = useState('conferences');
  const u = USE_CASES.find((x) => x.id === active)!;

  return (
    <>
      <TabBar active={active} setActive={setActive} />
      <UseCaseSection u={u} />
    </>
  );
}
