import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

function FounderPortrait() {
  return (
    <div className="relative" style={{ width: 300 }}>
      <div className="relative overflow-hidden rounded-3xl border border-border" style={{
        aspectRatio: '4 / 5',
        background: 'linear-gradient(165deg, #163828 0%, #1F4D3A 55%, #2A6A50 100%)',
        boxShadow: '0 30px 60px -20px rgba(15,31,24,0.45), 0 12px 24px -12px rgba(15,31,24,0.35)',
      }}>
        {/* dot grid */}
        <div aria-hidden className="absolute inset-0 opacity-[0.18]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #E8C57E 1px, transparent 0)', backgroundSize: '20px 20px' }} />
        {/* stylized portrait */}
        <svg viewBox="0 0 300 375" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full" aria-hidden>
          <defs>
            <radialGradient id="halo" cx="50%" cy="35%" r="50%">
              <stop offset="0%" stopColor="rgba(232, 197, 126, 0.5)" />
              <stop offset="100%" stopColor="rgba(232, 197, 126, 0)" />
            </radialGradient>
            <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F3E4C1" />
              <stop offset="100%" stopColor="#C9A45E" />
            </linearGradient>
          </defs>
          <rect width="300" height="375" fill="url(#halo)" />
          <path d="M 20 375 Q 20 260 90 242 L 210 242 Q 280 260 280 375 Z" fill="#0F1F18" opacity="0.55" />
          <path d="M 50 375 Q 60 275 110 260 L 190 260 Q 240 275 250 375 Z" fill="#163828" />
          <circle cx="150" cy="168" r="72" fill="url(#skin)" />
          <circle cx="150" cy="186" r="65" fill="rgba(15,31,24,0.06)" />
        </svg>
        {/* caption */}
        <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)', backdropFilter: 'blur(4px)' }}>
          <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-accent">Founder</div>
          <div className="font-display font-semibold text-cream text-[18px] tracking-tight mt-1">Abdalla</div>
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase mt-1" style={{ color: 'rgba(250,246,238,0.65)' }}>Djibouti</div>
        </div>
      </div>
      <div className="font-mono text-[9px] tracking-[0.18em] uppercase text-muted/70 mt-3 text-center">
        [placeholder — replace with founder photo]
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 pt-16 lg:pt-24 pb-16 lg:pb-24 grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-16 items-center">
          <div>
            <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">
              About Karta
            </div>
            <h1 className="font-display font-bold text-ink text-[42px] sm:text-[58px] lg:text-[72px] leading-[0.94] tracking-tight">
              Built in Djibouti.{' '}
              <span className="text-primary">For the world.</span>
            </h1>
            <p className="mt-6 text-ink-soft text-[17px] lg:text-[19px] leading-[1.55] max-w-[520px]">
              Karta is the tool we wished existed when we ran campaigns ourselves.
              Built Africa-first — but the problem is global.
            </p>
            {/* Stats */}
            <div className="mt-8 grid grid-cols-3 gap-px rounded-2xl overflow-hidden border border-border max-w-[440px]"
              style={{ background: '#E5E0D4' }}>
              {([['2024', 'Founded'], ['8', 'Countries served'], ['1', 'Coffee per feature']] as [string, string][]).map(([n, l], i) => (
                <div key={i} className="bg-cream px-4 py-3.5">
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

      {/* Founder story */}
      <section className="relative">
        <div className="mx-auto max-w-[760px] px-5 lg:px-10 py-20 lg:py-28">
          <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">The story</div>
          <h2 className="font-display font-bold text-ink text-[32px] sm:text-[42px] lg:text-[48px] leading-[1.0] tracking-tight">
            A tool I wish I&apos;d had.
          </h2>
          <div className="mt-9 space-y-6 text-ink text-[17px] lg:text-[18px] leading-[1.7]">
            <p>
              I kept seeing the same problem at events. An organizer hires a designer to make beautiful &ldquo;I&apos;m attending&rdquo; social cards. The design is done. It looks great. Then the question comes: how do 400 attendees get their own version?
            </p>
            <p>
              The answer, every time, was the same: a Canva template, a Dropbox link, and a voice note explaining how to edit it. Half the attendees couldn&apos;t figure it out. The other half did it wrong. The designer ended up making 80 individual versions manually, the night before the event.
            </p>
            <p>
              Karta is the fix. You upload your design — the real one, the one your designer spent time on — mark which parts attendees can personalize, and share one link. Attendees open it on their phone, fill in their name, upload a photo, and download their own version in under a minute. No Canva. No voice notes. No designer doing it manually at midnight.
            </p>
            <p>
              Built in Djibouti, for organizers running campaigns across Africa, the Middle East, and increasingly the world. One flat link. Works on any phone. And when the day comes, every supporter, speaker and attendee has their own branded moment to share.
            </p>
          </div>
          <div className="mt-10 flex items-center gap-4 pt-7 border-t border-border">
            <div className="w-12 h-12 rounded-full grid place-items-center font-display font-semibold"
              style={{ background: 'radial-gradient(120% 120% at 30% 25%, #f3e4c1 0%, #c9a45e 55%, #8a6f3a 100%)', color: '#163828' }}>
              A
            </div>
            <div>
              <div className="font-display font-semibold text-ink text-[15px] tracking-tight">Abdalla</div>
              <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mt-0.5">Founder · Karta</div>
            </div>
            <div className="ml-auto font-display italic text-muted text-[14px]">Djibouti, 2024</div>
          </div>
        </div>
      </section>

      {/* Values — dark section */}
      <section className="relative bg-primary text-cream overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #E8C57E 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
          <div className="max-w-[760px] mb-14 lg:mb-16">
            <div className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase mb-5">
              What Karta stands for
            </div>
            <h2 className="font-display font-bold text-cream text-[32px] sm:text-[42px] lg:text-[48px] leading-[1.02] tracking-tight">
              Three things we&apos;ll never water down.
            </h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-px rounded-2xl overflow-hidden border" style={{ background: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.15)' }}>
            {[
              {
                label: 'Design',
                title: 'African-modern, not African-themed.',
                body: 'We design for how Africa actually scrolls — fast feeds, WhatsApp Status, mobile-first phones. Not a stereotyped version of it.',
              },
              {
                label: 'Product',
                title: 'The link is the product.',
                body: 'No accounts, no apps, no funnels for the attendees. One tap is the bar. If we ever raise that bar by a millimeter, something has gone wrong.',
              },
              {
                label: 'Brand',
                title: 'Consistency at scale.',
                body: 'Your design system survives 10,000 supporters posting from 40 phones. That\'s the whole reason we built this.',
              },
            ].map((v, i) => (
              <div key={i} className="bg-primary hover:bg-primary-dark transition-colors p-7 lg:p-8 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <span className="w-11 h-11 rounded-lg grid place-items-center border"
                    style={{ background: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.15)', color: '#E8C57E' }}>
                    <span className="font-mono text-[13px] font-semibold">{String(i + 1).padStart(2, '0')}</span>
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">
                    {v.label}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-cream text-[20px] lg:text-[24px] tracking-tight leading-[1.1]">
                  {v.title}
                </h3>
                <p className="mt-3 text-[15px] leading-[1.6]" style={{ color: 'rgba(250,246,238,0.70)' }}>
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="relative">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-10 lg:mb-12">
            <div className="max-w-[600px]">
              <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">Team</div>
              <h2 className="font-display font-bold text-ink text-[30px] sm:text-[40px] lg:text-[44px] leading-[1.02] tracking-tight">
                A small team. A clear remit.
              </h2>
              <p className="mt-4 text-ink-soft text-[16px] lg:text-[17px] leading-[1.6]">
                Building Karta alone for now. If you&apos;ve worked on African campaigns and want to build the tool you wish existed — let&apos;s talk.
              </p>
            </div>
            <a href="mailto:hello@cre8so.com"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-cream font-medium text-[14px] hover:bg-primary-dark transition-colors">
              Get in touch <ArrowRight size={14} />
            </a>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Abdalla', role: 'Founder', initials: 'A', location: 'Djibouti', active: true },
              { name: 'Open role', role: 'Founding Engineer', initials: '+', location: 'Remote · Africa', active: false },
              { name: 'Open role', role: 'Designer', initials: '+', location: 'Remote · Africa', active: false },
              { name: 'Open role', role: 'Community', initials: '+', location: 'Remote · Africa', active: false },
            ].map((m, i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl p-6 flex flex-col">
                {m.active ? (
                  <div className="w-14 h-14 rounded-full grid place-items-center font-display font-semibold text-[18px]"
                    style={{
                      background: 'radial-gradient(120% 120% at 30% 25%, #f3e4c1 0%, #c9a45e 55%, #8a6f3a 100%)',
                      color: '#163828',
                      boxShadow: '0 0 0 3px rgba(232, 197, 126, 0.25)',
                    }}>
                    {m.initials}
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full grid place-items-center font-display font-semibold text-[22px] text-primary border-2 border-dashed border-primary/30">
                    +
                  </div>
                )}
                <div className="mt-4 font-display font-semibold text-ink text-[16px] tracking-tight">{m.name}</div>
                <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-primary mt-1.5">{m.role}</div>
                <div className="mt-1 text-[12px] text-muted">{m.location}</div>
                {!m.active && (
                  <a href="mailto:hello@cre8so.com" className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-primary">
                    Apply <ArrowRight size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press / mentions */}
      <section className="border-y border-border" style={{ background: 'rgba(250,246,238,0.4)' }}>
        <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-16 lg:py-20">
          <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-8 text-center">
            Talked about in
          </div>
          <div className="grid md:grid-cols-3 gap-4 lg:gap-5">
            {[
              {
                who: 'Disrupt Africa',
                date: 'MAR 2026',
                quote: 'A small Djibouti-based team is quietly fixing the most common comms failure on the continent\'s event circuit.',
              },
              {
                who: 'TechCabal',
                date: 'APR 2026',
                quote: 'Karta\'s WhatsApp-first share flow is exactly the kind of design African startups should be exporting.',
              },
              {
                who: 'Rest of World',
                date: 'MAY 2026',
                quote: 'Built for low-bandwidth, mobile-first audiences — and increasingly used by global brands running campaigns there.',
              },
            ].map((m, i) => (
              <article key={i} className="bg-surface border border-border rounded-2xl p-6 lg:p-7">
                <div className="flex items-center justify-between mb-5">
                  <div className="font-display font-bold text-ink text-[17px] tracking-tight">{m.who}</div>
                  <div className="font-mono text-[9px] tracking-[0.18em] uppercase text-muted">{m.date}</div>
                </div>
                <blockquote className="text-ink-soft text-[14px] lg:text-[15px] leading-[1.6] italic">
                  &ldquo;{m.quote}&rdquo;
                </blockquote>
                <div className="mt-4 font-mono text-[9px] tracking-[0.18em] uppercase text-muted/70">[placeholder]</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden pb-28">
        <div className="relative mx-auto max-w-[860px] px-5 lg:px-10 py-20 lg:py-24 text-center">
          <h2 className="font-display font-bold text-ink text-[36px] sm:text-[50px] lg:text-[60px] leading-[0.98] tracking-tight">
            Want to talk?
          </h2>
          <p className="mt-5 text-ink-soft text-[16px] lg:text-[18px] leading-[1.55] max-w-[520px] mx-auto">
            We read every email. Press, partnerships, weird ideas, hard problems.
            Especially the hard problems.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="mailto:hello@cre8so.com"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-cream font-medium hover:bg-primary-dark transition-colors">
              hello@cre8so.com <ArrowRight size={16} />
            </a>
            <Link href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-border text-ink font-medium hover:border-primary hover:text-primary transition-colors">
              Try the product first <ArrowRight size={14} />
            </Link>
          </div>
          {/* Made in Djibouti flag */}
          <div className="mt-12 flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-muted">
            <span aria-hidden className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-2 rounded-sm" style={{ background: 'linear-gradient(to bottom, #6AB04C 33%, #FFFFFF 33% 66%, #44A5E0 66%)' }} />
              <span className="inline-block w-2 h-2" style={{ background: '#D62828', clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} />
            </span>
            Made in Djibouti
          </div>
        </div>
      </section>
    </>
  );
}
