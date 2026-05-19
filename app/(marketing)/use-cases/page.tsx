'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Mic2, Heart, Vote, Church, Zap, GraduationCap, ArrowRight, Check } from 'lucide-react';

type Example = { event: string; badge: string; name: string; role: string; date: string };
type Tab = {
  id: string;
  label: string;
  iconName: string;
  headline: string;
  blurb: string;
  color: string;
  problems: string[];
  examples: Example[];
};

const TABS: Tab[] = [
  {
    id: 'conferences',
    label: 'Conferences',
    iconName: 'mic',
    headline: 'Conference attendees and speakers.',
    blurb: 'Every speaker, sponsor, and attendee gets their own branded variant of your event card — one design, multiple roles, one link per segment.',
    color: 'linear-gradient(135deg,#1F4D3A 0%,#2A6A50 100%)',
    problems: [
      "Speakers want a card that says \"I'm speaking at\" — not \"I'm attending\"",
      'Attendees each need their own name and company on the card',
      "Organizers can't manually make 500 individual cards",
      'The WhatsApp Canva template gets used incorrectly by half the recipients',
    ],
    examples: [
      { event: 'Africa Tech Festival 2026', badge: "I'M SPEAKING AT", name: 'Kwame Mensah', role: 'Product Engineer · Paystack', date: '12 MAR 2026 · LAGOS' },
      { event: '5th Pan-African Youth Forum', badge: "I'M ATTENDING", name: 'Aisha Ahmed', role: 'Climate Policy Lead', date: 'NOV 2025 · DJIBOUTI' },
    ],
  },
  {
    id: 'ngos',
    label: 'NGOs',
    iconName: 'heart',
    headline: 'Awareness and fundraising campaigns.',
    blurb: "Your supporters announce they're backing your cause — branded to your campaign. One link shared in a WhatsApp group becomes hundreds of authentic posts.",
    color: 'linear-gradient(135deg,#163828 0%,#1F4D3A 100%)',
    problems: [
      'Supporters post off-brand content that undermines campaign messaging',
      'Designing individual supporter cards is not scalable',
      "Canva templates require accounts and editing skills most supporters don't have",
      'No way to track how many people are sharing campaign content',
    ],
    examples: [
      { event: 'United for East Africa', badge: "I'M SUPPORTING", name: 'Liya Tesfaye', role: 'Campaign Lead', date: 'OCT 2025 · ADDIS ABABA' },
      { event: 'Pan-African Climate Summit', badge: "I'M PLEDGING", name: 'Omar Diallo', role: 'Environmental Advocate', date: 'JAN 2026 · DAKAR' },
    ],
  },
  {
    id: 'political',
    label: 'Political',
    iconName: 'vote',
    headline: 'Endorsement and rally cards.',
    blurb: 'Volunteers, endorsers, and supporters generate cards that look professional and personal at once — consistent branding across thousands of organic posts.',
    color: 'linear-gradient(135deg,#1F4D3A 0%,#E8C57E 100%)',
    problems: [
      'Volunteer cards look amateurish and hurt credibility',
      'Endorsers need a card with their name, not a generic one',
      "Campaign teams can't track how many supporters are sharing",
      'Inconsistent messaging dilutes the campaign image on social media',
    ],
    examples: [
      { event: 'National Youth Rally 2026', badge: "I'M VOTING", name: 'Fatima Hassan', role: 'Community Organizer', date: 'MAR 2026 · NAIROBI' },
      { event: 'Change Campaign', badge: 'I ENDORSE', name: 'James Mwangi', role: 'Ward Representative', date: 'APR 2026 · KAMPALA' },
    ],
  },
  {
    id: 'religious',
    label: 'Religious',
    iconName: 'church',
    headline: 'Event registration and community drives.',
    blurb: 'Members announce attendance at your conference, fast, or fundraiser. Cards respect your visual identity and go straight to WhatsApp Status.',
    color: 'linear-gradient(135deg,#163828 0%,#2A6A50 100%)',
    problems: [
      "Members want to share they're attending but don't know how to make it look good",
      'Different events (conferences, charity drives, fasts) need different card designs',
      'Community WhatsApp groups share blurry, off-brand announcements',
      'No consistent visual identity across member-generated posts',
    ],
    examples: [
      { event: 'Global Halal Summit 2026', badge: "I'M ATTENDING", name: 'Mariam Al-Rashid', role: 'Community Leader', date: 'FEB 2026 · DUBAI' },
      { event: 'East Africa Christian Forum', badge: "I'M PARTICIPATING", name: 'Samuel Kipkoech', role: 'Youth Pastor', date: 'JUN 2026 · KIGALI' },
    ],
  },
  {
    id: 'brand',
    label: 'Brand',
    iconName: 'zap',
    headline: 'Product launches and store openings.',
    blurb: "Your customers and partners share branded launch announcements that drive real organic reach — all from one design your team uploads once.",
    color: 'linear-gradient(135deg,#0F1F18 0%,#1F4D3A 100%)',
    problems: [
      'UGC from customers looks off-brand and inconsistent',
      'Partners and ambassadors post without brand guidelines',
      "Marketing team can't scale individual card creation for thousands of customers",
      'Launch buzz fades because sharing is too complicated for most people',
    ],
    examples: [
      { event: 'MTN Brand Activation 2026', badge: "I'M PART OF", name: 'Ife Adeyemi', role: 'Brand Ambassador', date: 'MAY 2026 · LAGOS' },
      { event: 'Safaricom Product Launch', badge: "I'M LAUNCHING", name: 'Wanjiru Kariuki', role: 'Product Team', date: 'APR 2026 · NAIROBI' },
    ],
  },
  {
    id: 'education',
    label: 'Education',
    iconName: 'graduation',
    headline: 'Graduations, alumni, and scholarship campaigns.',
    blurb: 'Graduates, alumni, and scholarship recipients each get their own moment to share — on the day that matters most to them.',
    color: 'linear-gradient(135deg,#1F4D3A 0%,#163828 100%)',
    problems: [
      'Graduation cards are made manually by the comms team — one per student',
      'Alumni events get low social engagement because sharing is too much effort',
      "Scholarship announcements don't reach the audience they deserve",
      'University branding breaks down when students make their own announcement graphics',
    ],
    examples: [
      { event: 'University of Nairobi Class of 2026', badge: "I'M GRADUATING", name: 'Diana Otieno', role: 'BSc Computer Science', date: 'JUL 2026 · NAIROBI' },
      { event: 'ALX Africa Scholarship', badge: "I'M A SCHOLAR", name: 'Moussa Coulibaly', role: 'Software Engineering Cohort', date: '2026 · BAMAKO' },
    ],
  },
];

function TabIcon({ name, size = 15 }: { name: string; size?: number }) {
  const props = { size, strokeWidth: 1.8 };
  if (name === 'mic') return <Mic2 {...props} />;
  if (name === 'heart') return <Heart {...props} />;
  if (name === 'vote') return <Vote {...props} />;
  if (name === 'church') return <Church {...props} />;
  if (name === 'zap') return <Zap {...props} />;
  return <GraduationCap {...props} />;
}

function CardMock({ example, color }: { example: Example; color: string }) {
  const initials = example.name.split(' ').map(w => w[0]).join('');
  return (
    <div className="rounded-2xl overflow-hidden w-full max-w-[200px] shrink-0" style={{ background: color, boxShadow: '0 8px 24px rgba(15,31,24,0.2)' }}>
      <div className="p-4">
        <div className="font-mono text-[8px] tracking-[0.2em] text-white/60 uppercase mb-2">{example.event}</div>
        <div className="font-mono text-[9px] tracking-[0.14em] text-white/90 uppercase mb-3 border border-white/20 inline-block px-2 py-0.5 rounded-full">{example.badge}</div>
        <div className="flex items-center gap-2 mt-3">
          <div className="h-8 w-8 rounded-full bg-white/20 shrink-0 grid place-items-center">
            <span className="text-[9px] font-bold text-white">{initials}</span>
          </div>
          <div>
            <div className="font-display font-bold text-[11px] text-white leading-tight">{example.name}</div>
            <div className="font-mono text-[8px] text-white/60 leading-tight mt-0.5">{example.role}</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-white/10 font-mono text-[8px] text-white/50">{example.date}</div>
      </div>
    </div>
  );
}

export default function UseCasesPage() {
  const [active, setActive] = useState('conferences');
  const tab = TABS.find(t => t.id === active)!;

  return (
    <>
      {/* Hero */}
      <section className="max-w-[1240px] mx-auto px-6 pt-20 pb-12">
        <div className="max-w-2xl">
          <div className="text-[11px] tracking-[0.18em] font-mono text-brand-primary mb-4">USE CASES</div>
          <h1 className="font-display font-bold text-[48px] sm:text-[60px] leading-[1.02] tracking-tight">
            Cardly works for every kind of campaign.
          </h1>
          <p className="mt-5 text-[17px] text-brand-ink/65 max-w-[520px] leading-relaxed">
            Conferences, NGOs, political campaigns, brands, religious organizations, universities — any campaign where people want to share they&apos;re part of something.
          </p>
        </div>
      </section>

      {/* Tab nav */}
      <section className="max-w-[1240px] mx-auto px-6 pb-8">
        <div className="flex flex-wrap gap-2">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all"
              style={active === t.id
                ? { background: '#1F4D3A', color: '#FAF6EE' }
                : { background: '#FFFFFF', color: '#3A4A42', border: '1px solid #E5E0D4' }}
            >
              <TabIcon name={t.iconName} />
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Active tab content */}
      <section className="max-w-[1240px] mx-auto px-6 pb-16">
        <div className="rounded-3xl overflow-hidden border" style={{ borderColor: '#E5E0D4' }}>
          {/* Header */}
          <div className="p-8 lg:p-10 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start" style={{ background: tab.color }}>
            <div className="flex-1">
              <div className="font-mono text-[10px] tracking-[0.2em] text-white/60 uppercase mb-3">{tab.label}</div>
              <h2 className="font-display font-bold text-[28px] sm:text-[36px] text-white leading-tight tracking-tight">
                {tab.headline}
              </h2>
              <p className="mt-3 text-[16px] text-white/75 leading-relaxed max-w-[480px]">{tab.blurb}</p>
            </div>
            <div className="flex gap-3 shrink-0 flex-wrap lg:flex-nowrap">
              {tab.examples.map(ex => (
                <CardMock key={ex.name} example={ex} color="rgba(255,255,255,0.12)" />
              ))}
            </div>
          </div>

          {/* Problems solved */}
          <div className="bg-white p-8 lg:p-10">
            <div className="font-mono text-[10px] tracking-[0.2em] text-brand-primary uppercase mb-5">Problems Cardly solves</div>
            <ul className="grid sm:grid-cols-2 gap-3">
              {tab.problems.map(p => (
                <li key={p} className="flex items-start gap-3 text-[14px] text-brand-ink/75 leading-relaxed">
                  <span className="mt-0.5 shrink-0 h-5 w-5 rounded-full grid place-items-center" style={{ background: '#E8EFEB' }}>
                    <Check size={11} strokeWidth={2.5} style={{ color: '#1F4D3A' }} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* All use case thumbnails */}
      <section className="max-w-[1240px] mx-auto px-6 pb-16">
        <div className="font-mono text-[10px] tracking-[0.2em] text-brand-ink/40 uppercase mb-5">All use cases</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className="rounded-2xl p-4 text-left transition-all border hover:shadow-md"
              style={active === t.id
                ? { background: '#1F4D3A', color: '#FAF6EE', borderColor: '#1F4D3A' }
                : { background: '#FFFFFF', color: '#3A4A42', borderColor: '#E5E0D4' }}
            >
              <div className="mb-2" style={{ color: active === t.id ? '#E8C57E' : '#1F4D3A' }}>
                <TabIcon name={t.iconName} />
              </div>
              <div className="font-display font-semibold text-[13px] leading-tight">{t.label}</div>
            </button>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1240px] mx-auto px-6 pb-28">
        <div className="rounded-3xl p-10 lg:p-14 flex flex-col sm:flex-row items-center justify-between gap-8"
          style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
          <div>
            <h2 className="font-display font-bold text-[28px] sm:text-[32px] text-brand-ink">
              Don&apos;t see your use case?
            </h2>
            <p className="mt-2 text-[16px] text-brand-ink/65">
              Email us — if your campaign has a design and needs people to share it, Cardly can probably do it.
            </p>
          </div>
          <div className="flex gap-3 shrink-0 flex-wrap">
            <a href="mailto:hello@cardly.app"
              className="inline-flex items-center gap-2 text-[14px] font-medium text-brand-ink border border-brand-border rounded-xl px-5 py-3 hover:bg-white transition">
              Email us
            </a>
            <Link href="/signup"
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-white rounded-xl px-5 py-3 hover:opacity-90 transition"
              style={{ background: '#1F4D3A' }}>
              Try it free <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
