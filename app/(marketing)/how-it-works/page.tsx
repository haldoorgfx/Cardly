import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, ArrowRight, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How Eventera Works — The Event Platform',
  description:
    'From your first ticket sale to the last card shared. See how Eventera runs your entire event lifecycle in 5 simple steps.',
};

/* ─── Step visual mocks ──────────────────────────────────────────── */

function EventCreateMock() {
  return (
    <div className="bg-white rounded-xl border border-[#E5E0D4] p-4">
      <div className="text-[13px] font-semibold text-[#0F1F18] font-display mb-2">Event Title</div>
      <div className="h-[52px] rounded-lg bg-[#E8EFEB] mb-3" />
      <div className="flex items-center gap-1 text-[11px] text-[#6B7A72]"><MapPin size={10} />Nairobi · 14 Mar 2026</div>
    </div>
  );
}

function TicketsMock() {
  const rows: [string, string][] = [
    ['General Admission', 'Free'],
    ['Early Bird', '$25'],
    ['VIP', '$75'],
  ];
  return (
    <div className="bg-white rounded-xl border border-[#E5E0D4] p-3 flex flex-col gap-1.5">
      {rows.map(([name, price]) => (
        <div key={name} className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-2 text-[#3A4A42]">
            <span className="w-2 h-2 rounded-full bg-[#2D7A4F] shrink-0" />
            {name}
          </span>
          <span className=" text-[#0F1F18] font-semibold">{price}</span>
        </div>
      ))}
    </div>
  );
}

function AgendaMock() {
  const sessions: [string, string, string][] = [
    ['09:00', 'Opening Keynote', 'Dr. Aisha Kamau'],
    ['10:30', 'Innovation Panel', 'Kwame Mensah'],
    ['14:00', 'Breakout: Tech & Policy', 'Liya Tesfaye'],
  ];
  return (
    <div className="bg-white rounded-xl border border-[#E5E0D4] p-3 flex flex-col gap-1">
      {sessions.map(([time, title, speaker], i) => (
        <div
          key={time}
          className="flex items-start gap-2 text-[11px] rounded-md px-2 py-1.5"
          style={{ background: i % 2 === 0 ? '#F7F5F0' : 'transparent' }}
        >
          <span
            className=" text-[10px] bg-[#E8EFEB] text-[#1F4D3A] px-1.5 py-0.5 rounded shrink-0"
          >
            {time}
          </span>
          <div>
            <div className="font-medium text-[#0F1F18] leading-tight">{title}</div>
            <div className="text-[#6B7A72] text-[10px]">{speaker}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RegMock() {
  return (
    <div className="bg-white rounded-xl border border-[#E5E0D4] p-3 flex flex-col gap-2">
      <div
        className="h-6 rounded-md border border-[#E5E0D4] bg-[#FAF6EE] text-[10px] text-[#6B7A72] flex items-center px-2"
      >
        Full name
      </div>
      <div
        className="h-6 rounded-md border border-[#E5E0D4] bg-[#FAF6EE] text-[10px] text-[#6B7A72] flex items-center px-2"
      >
        Email address
      </div>
      <div
        className="mt-1 rounded-lg p-2.5 flex items-center gap-2"
        style={{ background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 100%)' }}
      >
        <Check size={11} className="text-[#E8C57E] shrink-0" />
        <span className="text-[11px] font-medium text-[#FAF6EE]">Your card is ready ✓</span>
      </div>
    </div>
  );
}

function AnalyticsMock() {
  const bars = [40, 65, 55, 80, 70];
  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-3"
      style={{ background: '#163828' }}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-[11px] text-[#FAF6EE]/80">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E8C57E] shrink-0" />
          247 checked in
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#FAF6EE]/80">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E8C57E]/60 shrink-0" />
          89 cards shared
        </div>
      </div>
      <div className="flex items-end gap-1 h-[36px]">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{ height: `${h}%`, background: '#E8C57E', opacity: 0.7 + i * 0.06 }}
          />
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  {
    id: 'create',
    n: 1,
    label: 'Create',
    title: 'Create your event',
    desc: 'Design your event page. Add cover photo, description, venue, date.',
    Mock: EventCreateMock,
  },
  {
    id: 'tickets',
    n: 2,
    label: 'Tickets',
    title: 'Set up tickets',
    desc: 'Free or paid. Early bird, VIP, general — with promo codes.',
    Mock: TicketsMock,
  },
  {
    id: 'agenda',
    n: 3,
    label: 'Agenda',
    title: 'Build your agenda',
    desc: 'Multi-track schedule, speakers, session descriptions.',
    Mock: AgendaMock,
  },
  {
    id: 'register',
    n: 4,
    label: 'Register',
    title: 'Attendees register',
    desc: 'They fill a form, pay if needed, and get their Eventera Card.',
    Mock: RegMock,
  },
  {
    id: 'track',
    n: 5,
    label: 'Track',
    title: 'Track everything',
    desc: 'Check-ins, session attendance, networking, card shares — in real time.',
    Mock: AnalyticsMock,
  },
];

/* ─── Page ───────────────────────────────────────────────────────── */

export default function HowItWorksPage() {
  return (
    <>
      {/* ── SECTION 1 · Hero ── */}
      <section className="relative overflow-hidden border-b border-[#E5E0D4]">
        <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 pt-16 lg:pt-24 pb-12 lg:pb-18">
          <div className=" text-[11px] tracking-[0.22em] uppercase text-[#1F4D3A] mb-5">
            How Eventera works
          </div>

          <h1
            className="font-title font-bold text-[#0F1F18] leading-[1.0]"
            style={{ fontSize: 'clamp(40px, 6vw, 64px)' }}
          >
            From first ticket to last card shared.
          </h1>

          <p className="mt-5 text-[#3A4A42] text-[17px] lg:text-[19px] leading-[1.55] max-w-[600px]">
            Everything your event needs, in the order you need it. Set up in minutes, run like a pro.
          </p>

          {/* Quick-jump pills */}
          <div className="mt-9 flex flex-wrap gap-2">
            {STEPS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="border border-[#E5E0D4] rounded-full px-4 py-2 text-[13px] text-[#3A4A42] hover:border-[#1F4D3A] hover:text-[#1F4D3A] transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 2 · 5-Step Lifecycle ── */}
      <section className="mx-auto max-w-[1200px] px-5 lg:px-10 py-16 lg:py-24">
        {/* Desktop: 5-col grid with gold connecting line */}
        <div className="relative">
          {/* Gold connecting line — desktop only */}
          <div
            aria-hidden
            className="hidden lg:block absolute top-[11px] h-px"
            style={{
              left: '10%',
              right: '10%',
              background:
                'linear-gradient(to right, rgba(201,164,94,0.25), #C9A45E, rgba(201,164,94,0.25))',
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-5">
            {STEPS.map((s) => {
              const { Mock } = s;
              return (
                <div
                  key={s.id}
                  id={s.id}
                  className="flex flex-col gap-3 lg:scroll-mt-8"
                >
                  {/* Gold circle number */}
                  <div className="relative z-10 self-start">
                    <div
                      className="w-[22px] h-[22px] rounded-full grid place-items-center ring-4 ring-[#FAF6EE]"
                      style={{ background: '#E8C57E' }}
                    >
                      <span className=" text-[11px] font-semibold text-[#163828] leading-none">
                        {s.n}
                      </span>
                    </div>
                  </div>

                  {/* Step title */}
                  <h3 className="font-display text-[18px] font-semibold text-[#0F1F18] leading-tight tracking-tight">
                    {s.title}
                  </h3>

                  {/* Step description */}
                  <p className="text-[#3A4A42] text-[13.5px] leading-[1.5] lg:min-h-[58px]">
                    {s.desc}
                  </p>

                  {/* Visual mock */}
                  <div className="mt-auto">
                    <Mock />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA below steps */}
        <div className="mt-14 flex justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md text-[#FAF6EE] font-medium hover:opacity-90 transition-opacity"
            style={{ background: '#1F4D3A' }}
          >
            Start your first event <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── SECTION 3 · Eventera Card callout ── */}
      <section
        className="mx-auto max-w-[1200px] px-5 lg:px-10 pb-16 lg:pb-20"
      >
        <div
          className="rounded-2xl overflow-hidden border"
          style={{
            background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 60%, #2A6A50 100%)',
            borderColor: '#C9A45E',
          }}
        >
          <div className="p-8 lg:p-12 flex flex-col lg:flex-row gap-10 items-start lg:items-center">
            {/* Left */}
            <div className="flex-1">
              <div
                className="inline-block  text-[10px] tracking-[0.2em] uppercase px-3 py-1 rounded-full mb-5"
                style={{ background: 'rgba(232,197,126,0.15)', color: '#E8C57E', border: '1px solid rgba(232,197,126,0.3)' }}
              >
                Unique to Eventera
              </div>
              <h2
                className="font-title font-bold text-[28px] sm:text-[36px] leading-tight"
                style={{ color: '#E8C57E' }}
              >
                The Eventera Card
              </h2>
              <p className="mt-4 text-[#FAF6EE]/80 text-[15px] lg:text-[16px] leading-[1.6] max-w-[460px]">
                Every attendee who registers automatically receives a personalized, branded card — ready
                to share to Instagram, WhatsApp, and LinkedIn. No other platform does this.
              </p>
              <Link
                href="/pricing"
                className="mt-6 inline-flex items-center gap-2 text-[#E8C57E] text-[14px] font-medium hover:underline"
              >
                See all features <ArrowRight size={14} />
              </Link>
            </div>

            {/* Right: card mock previews */}
            <div className="flex gap-3 shrink-0">
              {[
                { initials: 'AK', name: 'Aisha Kamau', role: 'Climate Lead', deg: '-4deg' },
                { initials: 'KM', name: 'Kwame Mensah', role: 'Product Eng.', deg: '3deg' },
              ].map((c) => (
                <div
                  key={c.initials}
                  className="rounded-xl p-4 flex flex-col gap-2 w-[140px]"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(232,197,126,0.25)',
                    transform: `rotate(${c.deg})`,
                  }}
                >
                  <div className=" text-[8px] tracking-[0.18em] text-[#FAF6EE]/50 uppercase">
                    Eventera · 2026
                  </div>
                  <div
                    className="w-8 h-8 rounded-full grid place-items-center text-[10px] font-bold"
                    style={{ background: 'rgba(232,197,126,0.25)', color: '#E8C57E' }}
                  >
                    {c.initials}
                  </div>
                  <div className="font-display font-semibold text-[11px] text-[#FAF6EE] leading-tight">
                    {c.name}
                  </div>
                  <div className=" text-[9px] text-[#FAF6EE]/55">{c.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4 · Final CTA ── */}
      <section
        style={{ background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 60%, #2A6A50 100%)' }}
      >
        <div className="mx-auto max-w-[900px] px-5 lg:px-10 py-20 lg:py-28 text-center">
          <h2
            className="font-title font-bold leading-[1.0] text-[#FAF6EE]"
            style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}
          >
            Ready to run your first event?
          </h2>
          <p className="mt-5 text-[#FAF6EE]/70 text-[16px] lg:text-[18px] leading-[1.55] max-w-[480px] mx-auto">
            Free plan. No credit card. Runs on mobile. Get your event live in 10 minutes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-medium transition-opacity hover:opacity-90"
              style={{ background: '#E8C57E', color: '#163828' }}
            >
              Start free <ArrowRight size={16} />
            </Link>
            <Link
              href="/use-cases"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[#FAF6EE] border border-[#FAF6EE]/30 hover:border-[#FAF6EE]/60 transition-colors"
            >
              Browse use cases <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
