'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Mail, MessageSquare, Handshake, Bug } from 'lucide-react';
import Reveal from '@/components/marketing/Reveal';

const TOPICS = [
  { value: 'general',      label: 'General question' },
  { value: 'support',      label: 'Technical support' },
  { value: 'billing',      label: 'Billing / plans' },
  { value: 'partnership',  label: 'Partnership' },
  { value: 'press',        label: 'Press inquiry' },
  { value: 'other',        label: 'Something else' },
];

const CONTACTS = [
  {
    icon: <Mail size={20} strokeWidth={1.8} />,
    title: 'General',
    value: 'hello@cardly.app',
    href: 'mailto:hello@cardly.app',
    desc: 'Questions, feedback, anything.',
  },
  {
    icon: <Bug size={20} strokeWidth={1.8} />,
    title: 'Support',
    value: 'support@cardly.app',
    href: 'mailto:support@cardly.app',
    desc: 'Technical issues and bug reports.',
  },
  {
    icon: <Handshake size={20} strokeWidth={1.8} />,
    title: 'Partnerships',
    value: 'partners@cardly.app',
    href: 'mailto:partners@cardly.app',
    desc: 'Integrations, reseller, co-marketing.',
  },
  {
    icon: <MessageSquare size={20} strokeWidth={1.8} />,
    title: 'Press',
    value: 'press@cardly.app',
    href: 'mailto:press@cardly.app',
    desc: 'Media inquiries and assets.',
  },
];

/* ── Hero ────────────────────────────────────────────────── */
function ContactHero() {
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
            'radial-gradient(65% 55% at 10% 0%, rgba(31,77,58,0.09), transparent 65%)',
            'radial-gradient(50% 45% at 90% 100%, rgba(232,197,126,0.11), transparent 65%)',
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
      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 pt-14 lg:pt-20 pb-12 lg:pb-16">
        <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">
          Contact
        </div>
        <h1 className="font-display font-bold text-ink text-[44px] sm:text-[60px] lg:text-[72px] leading-[0.95] tracking-[-0.035em] max-w-[700px]">
          We read every message.
        </h1>
        <p className="mt-5 text-ink-soft text-[17px] lg:text-[18px] leading-[1.55] max-w-[520px]">
          Support, partnerships, press — drop us a line. We reply within one business day, usually faster.
        </p>
      </div>
    </section>
  );
}

/* ── Contact form ────────────────────────────────────────── */
function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [topic, setTopic] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="mx-auto max-w-[1200px] px-5 lg:px-10 py-14 lg:py-20 grid lg:grid-cols-[1fr_380px] gap-12 lg:gap-16 items-start">

      {/* Form */}
      <div>
        <Reveal>
          <div className="mb-8">
            <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-2">Send a message</div>
            <h2 className="font-display font-bold text-ink text-[28px] sm:text-[34px] tracking-[-0.03em]">
              Tell us what&apos;s on your mind
            </h2>
          </div>
        </Reveal>

        {submitted ? (
          <Reveal>
            <div
              className="rounded-2xl px-8 py-12 text-center"
              style={{ background: 'rgba(45,122,79,0.06)', border: '1px solid rgba(45,122,79,0.18)' }}
            >
              <div className="w-12 h-12 rounded-full bg-primary grid place-items-center mx-auto mb-4">
                <ArrowRight size={20} strokeWidth={2} className="text-cream" />
              </div>
              <div className="font-display font-bold text-ink text-[22px] tracking-tight mb-2">Message sent</div>
              <p className="text-ink-soft text-[15px] leading-[1.6] max-w-[400px] mx-auto">
                We&apos;ll get back to you within one business day. Check your inbox for a confirmation.
              </p>
            </div>
          </Reveal>
        ) : (
          <Reveal delay={60}>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name + email */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] tracking-[0.18em] uppercase text-muted mb-2">
                    Your name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Adam Hassan"
                    className="w-full px-4 py-3 rounded-xl text-[14px] text-ink placeholder:text-muted transition-shadow outline-none focus:ring-2"
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E5E0D4',
                      boxShadow: '0 1px 2px rgba(15,31,24,0.04)',
                    }}
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] tracking-[0.18em] uppercase text-muted mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl text-[14px] text-ink placeholder:text-muted transition-shadow outline-none"
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E5E0D4',
                      boxShadow: '0 1px 2px rgba(15,31,24,0.04)',
                    }}
                  />
                </div>
              </div>

              {/* Topic */}
              <div>
                <label className="block font-mono text-[10px] tracking-[0.18em] uppercase text-muted mb-2">
                  Topic
                </label>
                <select
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-[14px] text-ink transition-shadow outline-none appearance-none"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E0D4',
                    boxShadow: '0 1px 2px rgba(15,31,24,0.04)',
                    color: topic ? '#0F1F18' : '#6B7A72',
                  }}
                >
                  <option value="" disabled>Select a topic…</option>
                  {TOPICS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block font-mono text-[10px] tracking-[0.18em] uppercase text-muted mb-2">
                  Message
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Describe your question or issue in as much detail as you like…"
                  className="w-full px-4 py-3 rounded-xl text-[14px] text-ink placeholder:text-muted resize-none outline-none"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E0D4',
                    boxShadow: '0 1px 2px rgba(15,31,24,0.04)',
                  }}
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-medium text-[14px] transition-colors bg-primary text-cream hover:bg-primary-dark"
              >
                Send message <ArrowRight size={15} strokeWidth={2} />
              </button>
            </form>
          </Reveal>
        )}
      </div>

      {/* Sidebar */}
      <aside>
        <Reveal delay={100}>
          <div className="mb-6">
            <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-2">Direct contacts</div>
            <h3 className="font-display font-bold text-ink text-[20px] tracking-tight">
              Reach the right team
            </h3>
          </div>
        </Reveal>

        <div className="space-y-3">
          {CONTACTS.map((c, i) => (
            <Reveal key={c.title} delay={120 + i * 60}>
              <a
                href={c.href}
                className="flex items-start gap-4 p-4 rounded-xl bg-surface hover:bg-cream transition-colors group"
                style={{ border: '1px solid #E5E0D4' }}
              >
                <div
                  className="w-10 h-10 rounded-lg grid place-items-center shrink-0 text-primary"
                  style={{ background: 'rgba(31,77,58,0.07)', border: '1px solid rgba(31,77,58,0.10)' }}
                >
                  {c.icon}
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-[9px] tracking-[0.18em] uppercase text-muted mb-0.5">{c.title}</div>
                  <div className="font-medium text-ink text-[13px] group-hover:text-primary transition-colors truncate">{c.value}</div>
                  <div className="text-muted text-[12px] mt-0.5">{c.desc}</div>
                </div>
              </a>
            </Reveal>
          ))}
        </div>

        {/* Response time callout */}
        <Reveal delay={360}>
          <div
            className="mt-5 rounded-xl p-4"
            style={{ background: 'rgba(31,77,58,0.05)', border: '1px solid rgba(31,77,58,0.10)' }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-primary">Response time</span>
            </div>
            <p className="text-ink-soft text-[13px] leading-[1.55]">
              We aim to reply within <span className="text-ink font-medium">1 business day</span>. For urgent issues, include &quot;urgent&quot; in your subject line.
            </p>
          </div>
        </Reveal>
      </aside>
    </section>
  );
}

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <ContactForm />
    </>
  );
}
