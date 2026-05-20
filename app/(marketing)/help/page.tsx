import Link from 'next/link';
import { ArrowRight, BookOpen, Layers, CreditCard, Share2, Zap, HelpCircle } from 'lucide-react';
import Reveal from '@/components/marketing/Reveal';

export const metadata = {
  title: 'Help Center — Karta',
  description:
    'Guides and answers for Karta — getting started, the editor, sharing, billing, and more.',
};

const CATEGORIES = [
  {
    icon: <BookOpen size={22} strokeWidth={1.8} />,
    title: 'Getting started',
    desc: 'Create your first campaign in under 10 minutes.',
    articles: ['Creating your first event', 'Uploading a background design', 'Defining zones', 'Publishing and sharing'],
  },
  {
    icon: <Layers size={22} strokeWidth={1.8} />,
    title: 'Editor',
    desc: 'Zones, handles, fonts, and how the canvas works.',
    articles: ['Adding a text zone', 'Adding a photo zone', 'Resizing and repositioning', 'Undo and redo'],
  },
  {
    icon: <Share2 size={22} strokeWidth={1.8} />,
    title: 'Sharing & attendees',
    desc: 'How the attendee page works and how to distribute it.',
    articles: ['The attendee link explained', 'WhatsApp & QR sharing', 'Download quality', 'Watermark behavior'],
  },
  {
    icon: <CreditCard size={22} strokeWidth={1.8} />,
    title: 'Billing',
    desc: 'Plans, upgrades, invoices, and cancellation.',
    articles: ['Plan comparison', 'Upgrading to Pro', 'Downloading invoices', 'Cancelling your plan'],
  },
  {
    icon: <Zap size={22} strokeWidth={1.8} />,
    title: 'Advanced',
    desc: 'Variants, analytics, and white-label options.',
    articles: ['Using card variants', 'View and download analytics', 'Custom domain for campaign links', 'White-label output (Studio)'],
  },
  {
    icon: <HelpCircle size={22} strokeWidth={1.8} />,
    title: 'Troubleshooting',
    desc: 'Common issues and how to fix them.',
    articles: ['Card not rendering', 'Photo upload errors', 'Slow download', 'Contacting support'],
  },
];

const POPULAR = [
  { title: 'How do I remove the "Made with Karta" watermark?', category: 'Billing' },
  { title: 'Can attendees edit their card after downloading?', category: 'Sharing' },
  { title: 'What image size should I upload as the background?', category: 'Getting started' },
  { title: 'How do I set a photo zone to circle crop?', category: 'Editor' },
  { title: 'Can I have multiple variants of the same event?', category: 'Advanced' },
  { title: 'How do I add a custom logo to the attendee page?', category: 'Advanced' },
];

/* ── Hero ────────────────────────────────────────────────── */
function HelpHero() {
  return (
    <section
      className="relative overflow-hidden border-b"
      style={{ borderColor: '#E5E0D4' }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            'radial-gradient(65% 55% at 50% 0%, rgba(31,77,58,0.09), transparent 60%)',
            'radial-gradient(50% 45% at 90% 100%, rgba(232,197,126,0.10), transparent 65%)',
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
      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 pt-14 lg:pt-20 pb-14 lg:pb-20 text-center">
        <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">
          Help center
        </div>
        <h1 className="font-display font-bold text-ink text-[44px] sm:text-[60px] lg:text-[72px] leading-[0.95] tracking-[-0.035em] max-w-[720px] mx-auto">
          How can we help?
        </h1>
        <p className="mt-5 text-ink-soft text-[17px] lg:text-[18px] leading-[1.55] max-w-[500px] mx-auto">
          Guides, answers, and everything you need to run a successful campaign with Karta.
        </p>

        {/* Decorative search bar — links to contact */}
        <Reveal>
          <div className="mt-8 max-w-[520px] mx-auto">
            <a
              href="#categories"
              className="flex items-center gap-3 w-full px-5 py-4 rounded-full text-left transition-shadow hover:shadow-md"
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E0D4',
                boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6B7A72', flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <span className="text-[14px]" style={{ color: '#6B7A72' }}>Search for help…</span>
              <span
                className="ml-auto font-mono text-[10px] tracking-[0.18em] px-2 py-0.5 rounded"
                style={{ background: 'rgba(229,224,212,0.7)', color: '#6B7A72' }}
              >
                Browse ↓
              </span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Categories ──────────────────────────────────────────── */
function Categories() {
  return (
    <section id="categories" className="mx-auto max-w-[1200px] px-5 lg:px-10 py-14 lg:py-20">
      <Reveal>
        <div className="mb-10">
          <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-2">Browse by topic</div>
          <h2 className="font-display font-bold text-ink text-[28px] sm:text-[36px] tracking-[-0.03em]">
            Everything in one place
          </h2>
        </div>
      </Reveal>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {CATEGORIES.map((cat, i) => (
          <Reveal key={cat.title} delay={i * 70}>
            <div
              className="bg-surface rounded-2xl p-6 lg:p-7 flex flex-col h-full transition-shadow hover:shadow-md"
              style={{ border: '1px solid #E5E0D4' }}
            >
              <div
                className="w-11 h-11 rounded-xl grid place-items-center mb-5 text-primary"
                style={{ background: 'rgba(31,77,58,0.08)', border: '1px solid rgba(31,77,58,0.12)' }}
              >
                {cat.icon}
              </div>
              <h3 className="font-display font-bold text-ink text-[18px] lg:text-[20px] tracking-tight mb-2">
                {cat.title}
              </h3>
              <p className="text-ink-soft text-[13px] leading-[1.55] mb-5">
                {cat.desc}
              </p>
              <ul className="space-y-2 mt-auto">
                {cat.articles.map((art) => (
                  <li key={art}>
                    <a
                      href="#"
                      className="flex items-center gap-2 text-[13px] text-ink-soft hover:text-primary transition-colors group"
                    >
                      <ArrowRight size={12} strokeWidth={2} className="text-primary shrink-0 translate-x-0 group-hover:translate-x-0.5 transition-transform" />
                      {art}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── Popular ─────────────────────────────────────────────── */
function Popular() {
  return (
    <section style={{ borderTop: '1px solid #E5E0D4', background: 'rgba(250,246,238,0.5)' }}>
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-14 lg:py-20">
        <Reveal>
          <div className="mb-8">
            <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-2">Most asked</div>
            <h2 className="font-display font-bold text-ink text-[28px] sm:text-[36px] tracking-[-0.03em]">
              Popular questions
            </h2>
          </div>
        </Reveal>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid #E5E0D4' }}
        >
          {POPULAR.map((q, i) => (
            <Reveal key={i} delay={i * 50} distance={12}>
              <a
                href="#"
                className="flex items-center justify-between px-6 py-4 bg-surface hover:bg-cream transition-colors group"
                style={i < POPULAR.length - 1 ? { borderBottom: '1px solid #E5E0D4' } : {}}
              >
                <div className="flex items-center gap-4">
                  <span
                    className="font-mono text-[9px] tracking-[0.18em] uppercase shrink-0 px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(31,77,58,0.08)', color: '#1F4D3A' }}
                  >
                    {q.category}
                  </span>
                  <span className="text-ink text-[14px] lg:text-[15px]">{q.title}</span>
                </div>
                <ArrowRight size={15} strokeWidth={2} className="text-muted shrink-0 ml-3 translate-x-0 group-hover:translate-x-0.5 group-hover:text-primary transition" />
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Contact CTA ─────────────────────────────────────────── */
function ContactCTA() {
  return (
    <section className="bg-primary text-cream relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(232,197,126,0.10) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="relative mx-auto max-w-[860px] px-5 lg:px-10 py-16 lg:py-20 text-center">
        <h2 className="font-display font-bold text-cream text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.0] tracking-[-0.035em]">
          Still stuck?
        </h2>
        <p className="mt-4 text-[16px] lg:text-[17px] leading-[1.55] max-w-[500px] mx-auto" style={{ color: 'rgba(250,246,238,0.75)' }}>
          We read every email. Usually reply within a few hours during business days.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:hello@cre8so.com"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-medium transition-colors bg-accent text-primary-dark hover:bg-accent-dark"
          >
            Email us <ArrowRight size={16} strokeWidth={2} />
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-medium transition-colors"
            style={{ border: '1px solid rgba(250,246,238,0.25)', color: '#FAF6EE' }}
          >
            Contact form <ArrowRight size={15} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HelpPage() {
  return (
    <>
      <HelpHero />
      <Categories />
      <Popular />
      <Reveal><ContactCTA /></Reveal>
    </>
  );
}
