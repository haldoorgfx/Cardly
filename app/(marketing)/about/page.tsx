import Link from 'next/link';
import { ArrowRight, Globe, Share2, Layers } from 'lucide-react';
import Reveal from '@/components/marketing/Reveal';

export const metadata = {
  title: 'About — Cardly',
  description:
    'Cardly is designing the tool organizers wished existed — Africa-first, mobile-first, link-first.',
};

/* ── Shared ──────────────────────────────────────────────── */
const BORDER = { border: '1px solid #E5E0D4' };

/* ── Founder portrait (placeholder until real photo) ────── */
function FounderPortrait() {
  return (
    <div className="relative" style={{ width: 320 }}>
      <div
        className="relative overflow-hidden rounded-3xl"
        style={{
          aspectRatio: '4 / 5',
          background: 'linear-gradient(165deg, #163828 0%, #1F4D3A 55%, #2A6A50 100%)',
          border: '1px solid #E5E0D4',
          boxShadow: '0 30px 60px -20px rgba(15,31,24,0.45), 0 12px 24px -12px rgba(15,31,24,0.35)',
        }}
      >
        {/* Gold dot grid */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(232,197,126,0.18) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Abstract portrait SVG */}
        <svg
          viewBox="0 0 320 400"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 w-full h-full"
          aria-hidden
        >
          <defs>
            <radialGradient id="halo" cx="50%" cy="35%" r="50%">
              <stop offset="0%" stopColor="rgba(232,197,126,0.5)" />
              <stop offset="100%" stopColor="rgba(232,197,126,0)" />
            </radialGradient>
            <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F3E4C1" />
              <stop offset="100%" stopColor="#C9A45E" />
            </linearGradient>
          </defs>
          <rect width="320" height="400" fill="url(#halo)" />
          <path d="M 30 400 Q 30 280 100 260 L 220 260 Q 290 280 290 400 Z" fill="#0F1F18" opacity="0.55" />
          <path d="M 60 400 Q 70 295 120 280 L 200 280 Q 250 295 260 400 Z" fill="#163828" />
          <circle cx="160" cy="180" r="78" fill="url(#skin)" />
          <circle cx="160" cy="200" r="70" fill="rgba(15,31,24,0.06)" />
        </svg>

        {/* Name strip */}
        <div
          className="absolute bottom-0 left-0 right-0 p-4 lg:p-5"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)', backdropFilter: 'blur(4px)' }}
        >
          <div className="font-mono text-[9px] tracking-[0.22em] uppercase" style={{ color: '#E8C57E' }}>
            Founder &amp; CEO
          </div>
          <div className="font-display font-semibold text-cream text-[20px] tracking-tight mt-1">Adam Hassan</div>
        </div>
      </div>
      <div className="font-mono text-[9px] tracking-[0.18em] uppercase mt-3 text-center" style={{ color: 'rgba(107,122,114,0.7)' }}>
        [placeholder — replace with founder photo]
      </div>
    </div>
  );
}

/* ── Hero ────────────────────────────────────────────────── */
function AboutHero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ borderBottom: '1px solid #E5E0D4' }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            'radial-gradient(70% 60% at 10% 0%, rgba(31,77,58,0.10), transparent 65%)',
            'radial-gradient(50% 50% at 90% 100%, rgba(232,197,126,0.12), transparent 65%)',
          ].join(', '),
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(15,31,24,0.045) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 pt-16 lg:pt-24 pb-16 lg:pb-24 grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-16 items-center">
        <div>
          <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">About Cardly</div>
          <h1 className="font-display font-bold text-ink text-[44px] sm:text-[60px] lg:text-[78px] leading-[0.94] tracking-[-0.035em]">
            Built for Africa.{' '}
            <span className="text-primary">Used by the world.</span>
          </h1>
          <p className="mt-6 text-ink-soft text-[18px] lg:text-[20px] leading-[1.55] max-w-[540px]">
            Cardly is a small team designing the tool we wished existed when we ran
            campaigns ourselves. We&rsquo;re building it Africa-first — but the problem
            is global.
          </p>

          {/* Stats */}
          <div
            className="mt-8 grid grid-cols-3 rounded-2xl overflow-hidden max-w-[480px]"
            style={{ gap: '1px', background: '#E5E0D4', border: '1px solid #E5E0D4' }}
          >
            {([
              ['2024', 'Founded'],
              ['8', 'Countries served'],
              ['1', 'Coffee per feature'],
            ] as [string, string][]).map(([n, l]) => (
              <div key={l} className="bg-cream px-4 py-3.5">
                <div className="font-display font-bold text-primary text-[22px] tracking-[-0.03em] leading-none">{n}</div>
                <div className="mt-1.5 font-mono text-[9px] tracking-[0.16em] uppercase text-muted">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="justify-self-center lg:justify-self-end">
          <FounderPortrait />
        </div>
      </div>
    </section>
  );
}

/* ── Founder story ───────────────────────────────────────── */
function FounderStory() {
  const paras = [
    "I spent six years running communications for events across East Africa. Every campaign hit the same wall: we'd spend months on the design system, brand the venue, hire the keynote — and on the day, every attendee posted their own off-brand selfie with our hashtag. The reach we paid for in sponsorship dollars and ticket sales evaporated in the noise of a thousand mismatched posts.",
    "The tools available either asked attendees to download an app, learn an editor, or sign up for an account. None of that survives contact with WhatsApp on a Friday night. The few products that worked were built for North American conferences — they didn't understand low-bandwidth networks, mobile-first audiences, or the particular weight an African event hashtag carries.",
    "Cardly is the tool I wished existed in 2019. It's built for organizers running campaigns across Africa, the Middle East, and increasingly the world. It's a flat link. It works on a feature phone if it has to. And when the day comes, every supporter, speaker and attendee has their own branded moment to share.",
  ];

  return (
    <section>
      <div className="mx-auto max-w-[760px] px-5 lg:px-10 py-20 lg:py-28">
        <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">The story</div>
        <h2 className="font-display font-bold text-ink text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.0] tracking-[-0.035em]">
          A tool I wish I&rsquo;d had in 2019.
        </h2>
        <div className="mt-9 space-y-6 text-ink text-[18px] lg:text-[19px] leading-[1.7]">
          {paras.map((p, i) => (
            <Reveal key={i} delay={i * 60} distance={16}>
              <p
                className={i === 0 ? 'first-letter:font-display first-letter:font-bold first-letter:text-[52px] first-letter:text-primary first-letter:float-left first-letter:mr-3 first-letter:leading-[0.85] first-letter:mt-1' : ''}
              >
                {p}
              </p>
            </Reveal>
          ))}
        </div>

        {/* Signature */}
        <div className="mt-10 flex items-center gap-4 pt-7" style={{ borderTop: '1px solid #E5E0D4' }}>
          <div
            className="w-12 h-12 rounded-full grid place-items-center font-display font-semibold text-primary-dark shrink-0"
            style={{
              background: 'radial-gradient(120% 120% at 30% 25%, #f3e4c1 0%, #c9a45e 55%, #8a6f3a 100%)',
            }}
          >
            AH
          </div>
          <div>
            <div className="font-display font-semibold text-ink text-[15px] tracking-tight">Adam Hassan</div>
            <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mt-0.5">Founder &amp; CEO · Cardly</div>
          </div>
          <div className="ml-auto font-display italic text-muted text-[14px]">Africa, 2024</div>
        </div>
      </div>
    </section>
  );
}

/* ── Values ──────────────────────────────────────────────── */
function Values() {
  const values = [
    {
      label: 'Design',
      icon: <Globe size={20} strokeWidth={1.8} />,
      title: 'African-modern, not African-themed.',
      body: 'We design for how Africa actually scrolls — fast feeds, WhatsApp Status, mobile-first phones. Not a stereotyped version of it.',
    },
    {
      label: 'Product',
      icon: <Share2 size={20} strokeWidth={1.8} />,
      title: 'The link is the product.',
      body: "No accounts, no apps, no funnels for the attendees. One tap is the bar. If we ever raise that bar by a millimeter, something’s gone wrong.",
    },
    {
      label: 'Brand',
      icon: <Layers size={20} strokeWidth={1.8} />,
      title: 'Consistency at scale.',
      body: "Your design system survives 10,000 supporters posting from 40 phones. That's the whole reason we built this.",
    },
  ];

  return (
    <section className="relative overflow-hidden" style={{ background: '#1F4D3A' }}>
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(232,197,126,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
        <Reveal>
          <div className="max-w-[760px] mb-14 lg:mb-16">
            <div className="font-mono text-[11px] tracking-[0.22em] uppercase mb-5" style={{ color: '#E8C57E' }}>
              What Cardly stands for
            </div>
            <h2 className="font-display font-bold text-cream text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.035em]">
              Three things we&rsquo;ll never water down.
            </h2>
          </div>
        </Reveal>
        <div
          className="grid lg:grid-cols-3 rounded-2xl overflow-hidden"
          style={{ gap: '1px', background: 'rgba(250,246,238,0.10)', border: '1px solid rgba(250,246,238,0.15)' }}
        >
          {values.map((v, i) => (
            <Reveal key={i} delay={i * 90}>
            <div
              className="flex flex-col p-7 lg:p-8 transition-colors h-full"
              style={{ background: '#1F4D3A' }}
            >
              <div className="flex items-center justify-between mb-6">
                <span
                  className="w-11 h-11 rounded-lg grid place-items-center"
                  style={{ background: 'rgba(250,246,238,0.10)', color: '#E8C57E', border: '1px solid rgba(250,246,238,0.15)' }}
                >
                  {v.icon}
                </span>
                <span className="font-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: '#E8C57E' }}>
                  0{i + 1} · {v.label}
                </span>
              </div>
              <h3 className="font-display font-semibold text-cream text-[22px] lg:text-[26px] tracking-[-0.025em] leading-[1.1]">
                {v.title}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.6]" style={{ color: 'rgba(250,246,238,0.70)' }}>
                {v.body}
              </p>
            </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Team ────────────────────────────────────────────────── */
function Team() {
  const team = [
    { name: 'Adam Hassan', role: 'Founder · CEO', initials: 'AH', location: 'Africa', active: true },
    { name: 'Open role', role: 'Founding Engineer', initials: '?', location: 'Remote · Africa', active: false },
    { name: 'Open role', role: 'Designer', initials: '?', location: 'Remote · Africa', active: false },
    { name: 'Open role', role: 'Community', initials: '?', location: 'Remote · Africa', active: false },
  ];

  return (
    <section>
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10 lg:mb-12">
          <div className="max-w-[640px]">
            <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">Team</div>
            <h2 className="font-display font-bold text-ink text-[32px] sm:text-[42px] lg:text-[48px] leading-[1.02] tracking-[-0.035em]">
              A small team. A clear remit.
            </h2>
            <p className="mt-4 text-ink-soft text-[16px] lg:text-[17px] leading-[1.6]">
              Cardly is a four-person company in 2026. We hire slowly and from the continent. If
              you&rsquo;ve run African campaigns and want to build the tool you wish existed &mdash;
              let&rsquo;s talk.
            </p>
          </div>
          <a
            href="mailto:hire@cardly.app"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-medium text-[14px] transition-colors bg-primary text-cream hover:bg-primary-dark"
          >
            See open roles <ArrowRight size={14} strokeWidth={2} />
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {team.map((m, i) => (
            <div key={i} className="bg-surface rounded-2xl p-6 flex flex-col" style={BORDER}>
              {m.active ? (
                <div
                  className="w-14 h-14 rounded-full grid place-items-center font-display font-semibold text-[18px] text-primary-dark"
                  style={{
                    background: 'radial-gradient(120% 120% at 30% 25%, #f3e4c1 0%, #c9a45e 55%, #8a6f3a 100%)',
                    boxShadow: '0 0 0 3px rgba(232,197,126,0.25)',
                  }}
                >
                  {m.initials}
                </div>
              ) : (
                <div
                  className="w-14 h-14 rounded-full grid place-items-center font-display font-semibold text-[22px] text-primary"
                  style={{ border: '2px dashed rgba(31,77,58,0.3)' }}
                >
                  +
                </div>
              )}
              <div className="mt-4 font-display font-semibold text-ink text-[16px] tracking-tight">{m.name}</div>
              <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-primary mt-1.5">{m.role}</div>
              <div className="mt-1 text-[12px] text-muted">{m.location}</div>
              {!m.active && (
                <a
                  href="mailto:hire@cardly.app"
                  className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-primary"
                >
                  Apply <ArrowRight size={12} strokeWidth={2} />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Press ───────────────────────────────────────────────── */
function Press() {
  const mentions = [
    { who: 'Disrupt Africa', date: 'MAR 2026', quote: "A small African team is quietly fixing the most common comms failure on the continent's event circuit." },
    { who: 'TechCabal', date: 'APR 2026', quote: "Cardly's WhatsApp-first share flow is exactly the kind of design African startups should be exporting." },
    { who: 'Rest of World', date: 'MAY 2026', quote: 'Built for low-bandwidth, mobile-first audiences — and increasingly used by global brands running campaigns there.' },
  ];

  return (
    <section style={{ borderTop: '1px solid #E5E0D4', borderBottom: '1px solid #E5E0D4', background: 'rgba(250,246,238,0.4)' }}>
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-16 lg:py-20">
        <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-8 text-center">
          Talked about in
        </div>
        <div className="grid md:grid-cols-3 gap-4 lg:gap-5">
          {mentions.map((m) => (
            <article key={m.who} className="bg-surface rounded-2xl p-6 lg:p-7" style={BORDER}>
              <div className="flex items-center justify-between mb-5">
                <div className="font-display font-bold text-ink text-[18px] tracking-tight">{m.who}</div>
                <div className="font-mono text-[9px] tracking-[0.18em] uppercase text-muted">{m.date}</div>
              </div>
              <blockquote className="text-ink-soft text-[14px] lg:text-[15px] leading-[1.6] italic">
                &ldquo;{m.quote}&rdquo;
              </blockquote>
              <div className="mt-4 font-mono text-[9px] tracking-[0.18em] uppercase" style={{ color: 'rgba(107,122,114,0.7)' }}>
                [placeholder]
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Chat CTA ────────────────────────────────────────────── */
function ChatCTA() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            'radial-gradient(65% 55% at 50% 110%, rgba(31,77,58,0.08), transparent 65%)',
          ].join(', '),
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(15,31,24,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative mx-auto max-w-[860px] px-5 lg:px-10 py-20 lg:py-24 text-center">
        <h2 className="font-display font-bold text-ink text-[40px] sm:text-[54px] lg:text-[64px] leading-[0.98] tracking-[-0.035em]">
          Want to talk?
        </h2>
        <p className="mt-5 text-ink-soft text-[17px] lg:text-[19px] leading-[1.55] max-w-[560px] mx-auto">
          We read every email. Press, partnerships, weird ideas, hard problems.
          Especially the hard problems.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:hello@cardly.app"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-medium transition-colors bg-primary text-cream hover:bg-primary-dark"
          >
            hello@cardly.app <ArrowRight size={16} strokeWidth={2} />
          </a>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-medium transition-colors text-ink hover:text-primary"
            style={{ border: '1px solid rgba(15,31,24,0.15)' }}
          >
            Try the product first <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <Reveal><FounderStory /></Reveal>
      <Values />
      <Reveal><Team /></Reveal>
      <Reveal><Press /></Reveal>
      <Reveal><ChatCTA /></Reveal>
    </>
  );
}
