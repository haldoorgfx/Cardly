'use client';

import { useState } from 'react';
import {
  Search, Zap, Users, CalendarDays, ScanLine, CreditCard, HelpCircle,
  ArrowRight, CheckCircle2,
} from 'lucide-react';

/* ── Data ────────────────────────────────────────────────────────── */
const CATEGORIES = [
  { icon: <Zap size={20} strokeWidth={1.8} />, title: 'Getting started', desc: 'Create, set up, and publish your first event.', href: '/faq' },
  { icon: <Users size={20} strokeWidth={1.8} />, title: 'Registration & tickets', desc: 'Ticket types, promo codes, registrations, and refunds.', href: '/faq' },
  { icon: <CalendarDays size={20} strokeWidth={1.8} />, title: 'Agenda & speakers', desc: 'Build your agenda and manage speakers and sessions.', href: '/faq' },
  { icon: <ScanLine size={20} strokeWidth={1.8} />, title: 'Check-in', desc: 'QR scanning and on-site check-in on the day.', href: '/faq' },
  { icon: <CreditCard size={20} strokeWidth={1.8} />, title: 'The Eventera Card', desc: 'Design, customise, download, and share your card.', href: '/faq' },
  { icon: <HelpCircle size={20} strokeWidth={1.8} />, title: 'Billing & plans', desc: 'Plans, upgrades, invoices, and cancellation.', href: '/faq' },
];

/* ── Help Center Tab ─────────────────────────────────────────────── */
function HelpCenter() {
  const [query, setQuery] = useState('');
  const filtered = query
    ? CATEGORIES.filter(c =>
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.desc.toLowerCase().includes(query.toLowerCase())
      )
    : CATEGORIES;

  return (
    <div>
      {/* Hero */}
      <div className="text-center py-14 px-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
        <h1 className="font-title font-bold text-[42px] sm:text-[56px] leading-tight mb-4" style={{ color: '#0F1F18' }}>
          How can we help?
        </h1>
        <p className="text-[15px] mb-8" style={{ color: '#3A4A42' }}>Search the docs, or browse by topic.</p>
        <div className="max-w-[520px] mx-auto relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#65736B' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search help articles…"
            className="w-full h-12 pl-10 pr-4 rounded-2xl text-[14px] outline-none"
            style={{ background: '#fff', border: '1px solid #E5E0D4', color: '#0F1F18', boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)' }}
            onFocus={e => (e.target.style.borderColor = '#E8C57E')}
            onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
          />
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-12 space-y-12">
        {/* Categories */}
        <div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((cat) => (
              <a key={cat.title} href={cat.href}
                className="block rounded-2xl p-6 transition hover:-translate-y-0.5"
                style={{ background: '#fff', border: '1px solid #E5E0D4' }}>
                <div className="w-10 h-10 rounded-xl grid place-items-center mb-4" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                  {cat.icon}
                </div>
                <div className="font-semibold text-[15px] mb-1" style={{ color: '#0F1F18' }}>{cat.title}</div>
                <div className="text-[12.5px] mb-4" style={{ color: '#65736B', lineHeight: 1.5 }}>{cat.desc}</div>
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium" style={{ color: '#1F4D3A' }}>
                  Read the FAQ <ArrowRight size={12} strokeWidth={2} />
                </span>
              </a>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-[14px] py-8" style={{ color: '#65736B' }}>No results for &quot;{query}&quot;</p>
          )}
        </div>

        {/* Browse all FAQs */}
        {!query && (
          <div className="rounded-2xl px-6 py-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
            style={{ background: '#fff', border: '1px solid #E5E0D4' }}>
            <div>
              <div className="font-semibold text-[15px]" style={{ color: '#0F1F18' }}>Looking for a specific answer?</div>
              <div className="text-[13px] mt-0.5" style={{ color: '#65736B' }}>Our FAQ covers the most common questions in detail.</div>
            </div>
            <a href="/faq"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-full text-[13px] font-medium shrink-0"
              style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
              Browse all FAQs <ArrowRight size={13} />
            </a>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-2xl px-6 py-8 text-center" style={{ background: '#1F4D3A' }}>
          <h3 className="font-display font-bold text-[20px] mb-2" style={{ color: '#FAF6EE' }}>Still need help?</h3>
          <p className="text-[13px] mb-5" style={{ color: 'rgba(250,246,238,0.7)' }}>We read every message. Usually reply within a few hours.</p>
          <a
            href="mailto:hello@eventera.so"
            className="inline-flex items-center gap-2 h-10 px-6 rounded-full text-[13px] font-medium"
            style={{ background: '#E8C57E', color: '#1F4D3A' }}
          >
            Email us <ArrowRight size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── Status Tab ──────────────────────────────────────────────────── */
function StatusTab() {
  return (
    <div className="max-w-[820px] mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Overall */}
      <div className="flex items-center gap-4 px-6 py-5 rounded-2xl" style={{ background: '#E8EFEB', border: '1px solid #C9C3B1' }}>
        <CheckCircle2 size={24} style={{ color: '#2D7A4F', flexShrink: 0 }} />
        <div>
          <div className="font-semibold text-[15px]" style={{ color: '#0F1F18' }}>All systems operational</div>
          <div className="text-[12px] mt-0.5" style={{ color: '#65736B' }}>No incidents reported.</div>
        </div>
      </div>

      {/* Link to full status page */}
      <div className="rounded-2xl px-6 py-6 text-center" style={{ background: '#fff', border: '1px solid #E5E0D4' }}>
        <p className="text-[14px] mb-4" style={{ color: '#3A4A42' }}>
          See the live status of every Eventera service on the full status page.
        </p>
        <a
          href="/status"
          className="inline-flex items-center gap-2 h-10 px-6 rounded-full text-[13px] font-medium"
          style={{ background: '#1F4D3A', color: '#FAF6EE' }}
        >
          View system status <ArrowRight size={13} />
        </a>
      </div>
    </div>
  );
}

/* ── Changelog Tab ───────────────────────────────────────────────── */
function ChangelogTab() {
  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-12 space-y-6">
      <div>
        <h2 className="font-display font-normal text-[26px]" style={{ color: '#0F1F18', letterSpacing: '-0.025em' }}>What&apos;s new</h2>
        <p className="text-[14px] mt-1" style={{ color: '#65736B' }}>Every release, every improvement.</p>
      </div>
      <div className="rounded-2xl px-6 py-8 text-center" style={{ background: '#fff', border: '1px solid #E5E0D4' }}>
        <p className="text-[14px] mb-5" style={{ color: '#3A4A42' }}>
          Our full changelog lives on the What&apos;s new page, updated with every release.
        </p>
        <a
          href="/whats-new"
          className="inline-flex items-center gap-2 h-10 px-6 rounded-full text-[13px] font-medium"
          style={{ background: '#1F4D3A', color: '#FAF6EE' }}
        >
          View changelog <ArrowRight size={13} />
        </a>
      </div>
    </div>
  );
}

/* ── Legal Tab ───────────────────────────────────────────────────── */
function LegalTab() {
  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-12 space-y-6">
      <div>
        <h2 className="font-display font-normal text-[26px]" style={{ color: '#0F1F18', letterSpacing: '-0.025em' }}>Legal</h2>
        <p className="text-[14px] mt-1" style={{ color: '#65736B' }}>Privacy Policy and Terms of Service.</p>
      </div>
      <div className="rounded-2xl px-6 py-8 text-center" style={{ background: '#fff', border: '1px solid #E5E0D4' }}>
        <p className="text-[14px] mb-5" style={{ color: '#3A4A42' }}>
          Read the full Privacy Policy and Terms of Service on their own pages, always kept up to date.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="/privacy"
            className="inline-flex items-center gap-2 h-10 px-6 rounded-full text-[13px] font-medium"
            style={{ background: '#1F4D3A', color: '#FAF6EE' }}
          >
            Privacy Policy <ArrowRight size={13} />
          </a>
          <a
            href="/terms"
            className="inline-flex items-center gap-2 h-10 px-6 rounded-full text-[13px] font-medium"
            style={{ background: '#fff', color: '#0F1F18', border: '1px solid #E5E0D4' }}
          >
            Terms of Service <ArrowRight size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */
const TABS = [
  { id: 'help', label: 'Help center' },
  { id: 'status', label: 'Status' },
  { id: 'changelog', label: 'Changelog' },
  { id: 'legal', label: 'Legal' },
] as const;

type HelpTab = typeof TABS[number]['id'];

export default function HelpPage() {
  const [active, setActive] = useState<HelpTab>('help');

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      {/* Sub-nav */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E0D4', position: 'sticky', top: 0, zIndex: 30 }}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 flex items-center justify-between h-12">
          <nav className="flex gap-0">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className="px-4 h-12 text-[13px] font-medium transition-colors"
                style={{
                  color: active === tab.id ? '#1F4D3A' : '#65736B',
                  borderBottom: active === tab.id ? '2px solid #1F4D3A' : '2px solid transparent',
                  background: 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <a href="/" className="text-[12px] flex items-center gap-1" style={{ color: '#65736B' }}>
            ← Product
          </a>
        </div>
      </div>

      {active === 'help' && <HelpCenter />}
      {active === 'status' && <StatusTab />}
      {active === 'changelog' && <ChangelogTab />}
      {active === 'legal' && <LegalTab />}
    </div>
  );
}
