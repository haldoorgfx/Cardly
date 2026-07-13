'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, ArrowRight } from 'lucide-react';
import Pricing from './Pricing';

/* ─────────────────────────────────────────────────────────────
   Brand tokens (inline — no Tailwind custom colours needed)
───────────────────────────────────────────────────────────── */
const C = {
  primary:      '#1F4D3A',
  primaryDark:  '#163828',
  primarySoft:  '#E8EFEB',
  accent:       '#E8C57E',
  accentDark:   '#C9A45E',
  ink:          '#0F1F18',
  inkSoft:      '#3A4A42',
  muted:        '#6B7A72',
  cream:        '#FAF6EE',
  surface:      '#FFFFFF',
  border:       '#E5E0D4',
  borderStrong: '#C9C3B1',
  success:      '#2D7A4F',
};

/* ─────────────────────────────────────────────────────────────
   Comparison table data
───────────────────────────────────────────────────────────── */
type Cell = string | boolean;
interface ComparisonGroup {
  title: string;
  rows: [string, Cell, Cell, Cell][];
}

const COMPARISON_GROUPS: ComparisonGroup[] = [
  {
    title: 'Registration & ticketing',
    rows: [
      ['Active events',                         '1',         'Unlimited',  'Unlimited'],
      ['Registrations',                          '50',        '500 / mo',   'Unlimited'],
      ['Free & paid tickets',                    true,        true,         true],
      ['Early-bird, VIP & promo codes',          false,       true,         true],
      ['Custom registration forms',              false,       true,         true],
      ['Stripe, Flutterwave, Paystack, M-Pesa',  true,        true,         true],
    ],
  },
  {
    title: 'Event experience',
    rows: [
      ['Public event page',            true,  true,  true],
      ['QR check-in (offline-ready)',  true,  true,  true],
      ['Multi-track agenda builder',   false, true,  true],
      ['Speaker directory & portals',  false, true,  true],
      ['Live Q&A & polls',             false, false, true],
      ['Gamification & leaderboard',   false, false, true],
    ],
  },
  {
    title: 'Networking',
    rows: [
      ['Attendee profiles & directory',   false, true,  true],
      ['1:1 messaging',                   false, true,  true],
      ['AI matchmaking suggestions',      false, false, true],
    ],
  },
  {
    title: 'The Eventera Card',
    rows: [
      ['Personalized card for every attendee',   true,  true,  true],
      ['Variants (attendee / speaker / sponsor)', true,  true,  true],
      ['Remove Eventera watermark',                  false, true,  true],
      ['Multiple brand kits',                     false, false, true],
      ['Card download as animated video',         false, false, true],
    ],
  },
  {
    title: 'Sponsors & analytics',
    rows: [
      ['Basic analytics',                    false, true,  true],
      ['Registration funnel & card virality', false, true,  true],
      ['Sponsor tools & lead retrieval',      false, false, true],
      ['CSV export',                          false, false, true],
      ['API access & webhooks',               false, false, true],
    ],
  },
  {
    title: 'Team & support',
    rows: [
      ['Team seats',                    '1',   '1',   '3'],
      ['Email support',                 true,  true,  true],
      ['Priority support',              false, false, true],
      ['Onboarding call with our team', false, false, true],
    ],
  },
];

/* ─────────────────────────────────────────────────────────────
   FAQ data
───────────────────────────────────────────────────────────── */
interface FAQ { q: string; a: string }

const FAQS: FAQ[] = [
  {
    q: 'Can I switch plans anytime?',
    a: 'Yes. Upgrade and the change takes effect immediately, prorated for the rest of your billing cycle. Downgrade and it kicks in at the end of the current period — your data and events stay untouched.',
  },
  {
    q: 'What happens to my event if I downgrade?',
    a: 'Your event pages, registrations and the cards your attendees generated stay live forever. Once you drop below the plan limits, you\'ll be prompted to archive older events before creating new ones.',
  },
  {
    q: 'Do you offer discounts for nonprofits, students, or political campaigns?',
    a: 'Yes. Registered nonprofits get 40% off Pro and Studio. Verified educational institutions get 30% off. Email us with a letterhead or domain proof and we\'ll set you up within 24 hours.',
  },
  {
    q: 'What counts as a registration?',
    a: 'One registration = one attendee signing up for your event. Each registrant automatically gets their personalized Eventera Card. Re-downloads by the same person don\'t count as new registrations.',
  },
  {
    q: 'Can I pay annually by bank transfer or mobile money?',
    a: 'Yes. Studio annual plans accept SWIFT bank transfer (USD/EUR/GBP), M-Pesa, MTN MoMo, and Paystack. Email billing@eventera.so to set it up.',
  },
  {
    q: 'Do you have an enterprise plan?',
    a: 'Studio is our top tier and works for almost everyone. If you need volume seat licensing, custom MSA, or SSO via SAML, email us and we\'ll cut a custom Studio agreement — the feature surface is the same.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Yes — within the first 14 days of a paid plan, no questions asked. After that we\'ll prorate any unused billing period if you cancel mid-cycle.',
  },
];

/* ─────────────────────────────────────────────────────────────
   Small helpers
───────────────────────────────────────────────────────────── */
function CellValue({ value, isProCol }: { value: Cell; isProCol?: boolean }) {
  if (value === true) {
    return (
      <span style={{ color: isProCol ? C.primary : C.success, display: 'inline-flex', justifyContent: 'center' }}>
        <Check size={17} strokeWidth={2.5} />
      </span>
    );
  }
  if (value === false) {
    return <span style={{ color: 'rgba(107,122,114,0.45)' }}>—</span>;
  }
  return (
    <span style={{ fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontWeight: 500, fontSize: 14, color: C.ink }}>
      {value}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   Section — TrustStrip
───────────────────────────────────────────────────────────── */
const TRUST_TILES: [string, string][] = [
  ['14-day refund',      'No questions. Cancel within 14 days for a full refund.'],
  ['Cards live forever', 'Even if you cancel — your attendee links never expire.'],
  ['40% off for NGOs',   'Verified nonprofits and registered campaigns get a discount.'],
  ['Pay how you want',   'Card, M-Pesa, MoMo, Paystack, SWIFT — we accept it.'],
];

function TrustStrip() {
  return (
    <section style={{ background: C.cream, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 20px' }}>
        <div
          className="grid grid-cols-2 lg:grid-cols-4"
          style={{
            gap: 1,
            background: C.border,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {TRUST_TILES.map(([title, body]) => (
            <div key={title} style={{ background: C.cream, padding: '20px 24px' }}>
              <div style={{
                fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
                fontWeight: 600,
                fontSize: 18,
                letterSpacing: '-0.015em',
                color: C.ink,
              }}>
                {title}
              </div>
              <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: C.inkSoft }}>
                {body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Section — ComparisonTable
───────────────────────────────────────────────────────────── */
function ComparisonTable() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section style={{ borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            fontFamily: 'var(--theme-font-body, "Inter"), sans-serif',
            fontSize: 11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: C.primary,
            marginBottom: 16,
          }}>
            Full comparison
          </div>
          <h2 style={{
            fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(28px, 4vw, 44px)',
            lineHeight: 1.04,
            letterSpacing: '-0.03em',
            color: C.ink,
            margin: 0,
          }}>
            Compare every feature, side by side.
          </h2>
        </div>

        {/* Table wrapper */}
        <div style={{ overflowX: 'auto', borderRadius: 16 }}>
        <div style={{
          position: 'relative',
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          overflow: 'hidden',
          maxHeight: expanded ? undefined : 480,
          minWidth: 480,
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{
              position: 'sticky',
              top: 0,
              background: 'rgba(250,246,238,0.92)',
              backdropFilter: 'blur(8px)',
              borderBottom: `1px solid ${C.border}`,
            }}>
              <tr>
                <th style={{ padding: '16px 28px', fontFamily: 'var(--theme-font-body, "Inter"), sans-serif', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.muted, width: '40%' }}>
                  Feature
                </th>
                <th style={{ padding: '16px 12px', textAlign: 'center', fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontSize: 14, fontWeight: 600, color: C.ink }}>
                  Free
                </th>
                <th style={{ padding: '16px 12px', textAlign: 'center', fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontSize: 14, fontWeight: 600, color: C.primary, background: 'rgba(232,239,235,0.35)' }}>
                  Pro
                </th>
                <th style={{ padding: '16px 12px', textAlign: 'center', fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontSize: 14, fontWeight: 600, color: C.ink }}>
                  Studio
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_GROUPS.map((group, gi) => (
                <React.Fragment key={`g-${gi}`}>
                  <tr style={{ background: 'rgba(250,246,238,0.45)' }}>
                    <td
                      colSpan={4}
                      style={{
                        padding: '12px 28px',
                        fontFamily: 'var(--theme-font-body, "Inter"), sans-serif',
                        fontSize: 10,
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        color: C.primary,
                        borderTop: `1px solid ${C.border}`,
                      }}
                    >
                      {group.title}
                    </td>
                  </tr>
                  {group.rows.map(([label, free, pro, studio], ri) => (
                    <tr key={`r-${gi}-${ri}`} style={{ borderTop: `1px solid rgba(229,224,212,0.55)` }}>
                      <td style={{ padding: '14px 28px', fontSize: 14, color: C.inkSoft, lineHeight: 1.4 }}>
                        {label}
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                        <CellValue value={free} />
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'center', background: 'rgba(232,239,235,0.28)' }}>
                        <CellValue value={pro} isProCol />
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                        <CellValue value={studio} />
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Fade overlay */}
          {!expanded && (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: '0 0 0 0',
                top: 'auto',
                height: 120,
                background: `linear-gradient(to bottom, rgba(255,255,255,0), ${C.surface} 88%)`,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
        </div>

        {/* Toggle */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 999,
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.ink,
              fontWeight: 500,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {expanded ? 'Collapse comparison' : 'Show all features'}
            <ChevronDown
              size={15}
              strokeWidth={2}
              style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Section — FAQ Accordion
───────────────────────────────────────────────────────────── */
function PricingFAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section style={{ borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '80px 20px' }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{
            fontFamily: 'var(--theme-font-body, "Inter"), sans-serif',
            fontSize: 11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: C.primary,
            marginBottom: 16,
          }}>
            Pricing FAQ
          </div>
          <h2 style={{
            fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(26px, 3.5vw, 38px)',
            lineHeight: 1.06,
            letterSpacing: '-0.03em',
            color: C.ink,
            margin: 0,
          }}>
            Money questions, answered.
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {FAQS.map((faq, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={i}
                style={{ borderTop: `1px solid ${C.border}`, ...(i === FAQS.length - 1 ? { borderBottom: `1px solid ${C.border}` } : {}) }}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    padding: '20px 0',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
                    fontWeight: 500,
                    fontSize: 16,
                    color: C.ink,
                    letterSpacing: '-0.01em',
                  }}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={18}
                    strokeWidth={2}
                    style={{
                      flexShrink: 0,
                      color: C.muted,
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>
                {isOpen && (
                  <div style={{
                    padding: '0 0 20px',
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: C.inkSoft,
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main export — default (matches page.tsx import)
   The plan cards + billing toggle now live in the shared, data-driven
   <Pricing /> section (components/marketing/Pricing.tsx).
───────────────────────────────────────────────────────────── */
export default function PricingContent() {
  return (
    <>
      {/* ── Plan cards + billing toggle (shared handoff section) ─ */}
      <Pricing />

      {/* ── Trust strip ─────────────────────────────────────── */}
      <TrustStrip />

      {/* ── Comparison table ────────────────────────────────── */}
      <ComparisonTable />

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <PricingFAQ />

      {/* ── Bottom CTA ──────────────────────────────────────── */}
      <section style={{ borderTop: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(36px, 5vw, 62px)',
            lineHeight: 1.0,
            letterSpacing: '-0.035em',
            color: C.ink,
            margin: 0,
          }}>
            Start free. Upgrade when you&rsquo;re ready.
          </h2>
          <p style={{
            marginTop: 20,
            fontSize: 'clamp(15px, 1.7vw, 17px)',
            lineHeight: 1.6,
            color: C.inkSoft,
            maxWidth: 540,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Most teams ship their first event on the Free plan, then upgrade the day they pass
            50 registrations.
          </p>
          <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Link
              href="/signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 28px',
                borderRadius: 999,
                background: C.primary,
                color: C.cream,
                fontWeight: 500,
                fontSize: 15,
                textDecoration: 'none',
              }}
            >
              Start free <ArrowRight size={16} strokeWidth={2} />
            </Link>
            <Link
              href="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 15,
                color: C.ink,
                textDecoration: 'underline',
                textDecorationColor: 'rgba(15,31,24,0.3)',
                textUnderlineOffset: 4,
              }}
            >
              Talk to sales <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
