'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import Link from 'next/link';

// ── types ──────────────────────────────────────────────────────────────────

type EventType =
  | 'Tech conference'
  | 'Festival'
  | 'Corporate'
  | 'NGO'
  | 'Religious'
  | 'Something else';

type Theme = 'forest' | 'plum' | 'clay' | 'ocean';

interface FormValues {
  eventType: EventType | null;
  orgName: string;
  region: string;
  currency: string;
  theme: Theme;
  eventName: string;
  eventStart: string;
  eventEnd: string;
  venue: string;
  inviteEmails: string[];
  inviteInput: string;
}

// ── constants ──────────────────────────────────────────────────────────────

const STEPS = [
  'Welcome',
  'Organization',
  'Brand',
  'First event',
  'Invite team',
] as const;

const EVENT_TYPES: { label: EventType; icon: React.ReactNode }[] = [
  {
    label: 'Tech conference',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5 14h6M8 11v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Festival',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2l1.5 3.5L13 6l-2.5 2.5.6 3.5L8 10.5 4.9 12l.6-3.5L3 6l3.5-.5L8 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Corporate',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="3" y="7" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'NGO',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 13C8 13 2.5 9.5 2.5 5.5a3 3 0 015.5-1.7A3 3 0 0113.5 5.5C13.5 9.5 8 13 8 13z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Religious',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2v12M4.5 6h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Something else',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 8.5a.5.5 0 100-1 .5.5 0 000 1zM12 8.5a.5.5 0 100-1 .5.5 0 000 1zM4 8.5a.5.5 0 100-1 .5.5 0 000 1z" fill="currentColor" />
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
];

const THEMES: {
  key: Theme;
  label: string;
  sub: string;
  gradient: string;
  cardBg: string;
  barColor: string;
}[] = [
  {
    key: 'forest',
    label: 'Forest & Gold',
    sub: 'Deep green with warm gold accents',
    gradient: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)',
    cardBg: '#1F4D3A',
    barColor: '#E8C57E',
  },
  {
    key: 'plum',
    label: 'Plum',
    sub: 'Rich purple with silver highlights',
    gradient: 'linear-gradient(135deg, #4A2D6B 0%, #6B3FA0 60%, #C9A0DC 100%)',
    cardBg: '#4A2D6B',
    barColor: '#C9A0DC',
  },
  {
    key: 'clay',
    label: 'Clay',
    sub: 'Warm terracotta tones',
    gradient: 'linear-gradient(135deg, #7A3F2D 0%, #B05A38 60%, #E8C57E 100%)',
    cardBg: '#7A3F2D',
    barColor: '#E8B87E',
  },
  {
    key: 'ocean',
    label: 'Ocean',
    sub: 'Deep teal and sky blue',
    gradient: 'linear-gradient(135deg, #1A4A5C 0%, #2E728A 60%, #7ECDE8 100%)',
    cardBg: '#1A4A5C',
    barColor: '#7ECDE8',
  },
];

// ── shared input style ─────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#FFFFFF',
  border: '1px solid #E5E0D4',
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 14,
  fontFamily: 'Inter, sans-serif',
  color: '#0F1F18',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: '#3A4A42',
  marginBottom: 6,
  letterSpacing: '0.01em',
};

// ── step content components ────────────────────────────────────────────────

function StepWelcome({
  values,
  onChange,
}: {
  values: FormValues;
  onChange: (v: Partial<FormValues>) => void;
}) {
  return (
    <div>
      <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 600, color: '#1F4D3A', letterSpacing: '-0.02em', marginBottom: 6 }}>
        Welcome to Karta 👋
      </h2>
      <p style={{ fontSize: 15, color: '#6B7A72', marginBottom: 32, lineHeight: 1.6 }}>
        What kind of events do you run?
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {EVENT_TYPES.map(({ label, icon }) => {
          const selected = values.eventType === label;
          return (
            <button
              key={label}
              onClick={() => onChange({ eventType: label })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 16px',
                borderRadius: 10,
                border: selected ? '1.5px solid #1F4D3A' : '1.5px solid #E5E0D4',
                background: selected ? '#E8EFEB' : '#FFFFFF',
                cursor: 'pointer',
                fontSize: 14,
                color: selected ? '#1F4D3A' : '#3A4A42',
                fontFamily: 'Inter, sans-serif',
                fontWeight: selected ? 500 : 400,
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ color: selected ? '#1F4D3A' : '#6B7A72', flexShrink: 0 }}>{icon}</span>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepOrganization({
  values,
  onChange,
}: {
  values: FormValues;
  onChange: (v: Partial<FormValues>) => void;
}) {
  return (
    <div>
      <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 600, color: '#1F4D3A', letterSpacing: '-0.02em', marginBottom: 6 }}>
        Set up your organization
      </h2>
      <p style={{ fontSize: 15, color: '#6B7A72', marginBottom: 32, lineHeight: 1.6 }}>
        This helps us personalize your workspace.
      </p>

      {/* Logo upload */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Logo</label>
        <div
          style={{
            border: '1.5px dashed #C9C3B1',
            borderRadius: 10,
            padding: '28px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            color: '#6B7A72',
            fontSize: 13,
            background: '#FAF6EE',
          }}
        >
          <div style={{ fontSize: 22, marginBottom: 6 }}>+</div>
          <div>Click to upload logo</div>
          <div style={{ fontSize: 11, marginTop: 4, color: '#A9BDB2' }}>PNG or SVG, max 2 MB</div>
        </div>
      </div>

      {/* Org name */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Organization name</label>
        <input
          style={inputStyle}
          placeholder="e.g. Nairobi Tech Week"
          value={values.orgName}
          onChange={(e) => onChange({ orgName: e.target.value })}
        />
      </div>

      {/* Region + Currency */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Region</label>
          <input
            style={inputStyle}
            placeholder="e.g. East Africa"
            value={values.region}
            onChange={(e) => onChange({ region: e.target.value })}
          />
        </div>
        <div>
          <label style={labelStyle}>Currency</label>
          <input
            style={inputStyle}
            placeholder="KES, USD, NGN…"
            value={values.currency}
            onChange={(e) => onChange({ currency: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function MiniCard({ theme }: { theme: typeof THEMES[number] }) {
  return (
    <div
      style={{
        width: 168,
        height: 235,
        borderRadius: 12,
        background: theme.cardBg,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(15,31,24,0.18), 0 24px 60px rgba(31,77,58,0.16)',
      }}
    >
      {/* gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: theme.gradient,
          opacity: 0.7,
        }}
      />
      {/* content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '16px 14px 14px',
        }}
      >
        <div
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '0.04em',
          }}
        >
          KARTA
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.6)',
              marginBottom: 3,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Attendee
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#FFFFFF',
              fontFamily: 'DM Sans, sans-serif',
              letterSpacing: '-0.01em',
            }}
          >
            Your Name
          </div>
          <div
            style={{
              height: 2,
              background: theme.barColor,
              borderRadius: 1,
              marginTop: 8,
              width: '60%',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function StepBrand({
  values,
  onChange,
}: {
  values: FormValues;
  onChange: (v: Partial<FormValues>) => void;
}) {
  const selectedTheme = THEMES.find((t) => t.key === values.theme) ?? THEMES[0];

  return (
    <div>
      <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 600, color: '#1F4D3A', letterSpacing: '-0.02em', marginBottom: 6 }}>
        Pick your brand look
      </h2>
      <p style={{ fontSize: 15, color: '#6B7A72', marginBottom: 32, lineHeight: 1.6 }}>
        Choose a theme for your event cards. You can always change this later.
      </p>

      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
        {/* Theme list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {THEMES.map((t) => {
            const active = values.theme === t.key;
            return (
              <button
                key={t.key}
                onClick={() => onChange({ theme: t.key })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: active ? '1.5px solid #1F4D3A' : '1.5px solid #E5E0D4',
                  background: active ? '#E8EFEB' : '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* gradient swatch */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: t.gradient,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: active ? '#1F4D3A' : '#0F1F18', fontFamily: 'Inter, sans-serif' }}>
                    {t.label}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7A72', marginTop: 2 }}>{t.sub}</div>
                </div>
                {active && (
                  <div style={{ marginLeft: 'auto', color: '#1F4D3A' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 5" stroke="#1F4D3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Mini card preview */}
        <div style={{ display: 'none' }} className="sm:flex items-start pt-2">
          <MiniCard theme={selectedTheme} />
        </div>
        {/* Visible on sm+ via inline fallback — show always for simplicity */}
        <div style={{ flexShrink: 0 }}>
          <MiniCard theme={selectedTheme} />
        </div>
      </div>
    </div>
  );
}

function StepFirstEvent({
  values,
  onChange,
}: {
  values: FormValues;
  onChange: (v: Partial<FormValues>) => void;
}) {
  return (
    <div>
      <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 600, color: '#1F4D3A', letterSpacing: '-0.02em', marginBottom: 6 }}>
        Create your first event
      </h2>
      <p style={{ fontSize: 15, color: '#6B7A72', marginBottom: 32, lineHeight: 1.6 }}>
        You can fill in the details properly later — just give us a name to get started.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Event name</label>
          <input
            style={inputStyle}
            placeholder="e.g. Nairobi Tech Week 2026"
            value={values.eventName}
            onChange={(e) => onChange({ eventName: e.target.value })}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Starts</label>
            <input
              style={inputStyle}
              type="date"
              value={values.eventStart}
              onChange={(e) => onChange({ eventStart: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Ends</label>
            <input
              style={inputStyle}
              type="date"
              value={values.eventEnd}
              onChange={(e) => onChange({ eventEnd: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Venue</label>
          <input
            style={inputStyle}
            placeholder="e.g. KICC, Nairobi"
            value={values.venue}
            onChange={(e) => onChange({ venue: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function StepInviteTeam({
  values,
  onChange,
}: {
  values: FormValues;
  onChange: (v: Partial<FormValues>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function addEmail() {
    const email = values.inviteInput.trim();
    if (!email || values.inviteEmails.includes(email)) return;
    onChange({ inviteEmails: [...values.inviteEmails, email], inviteInput: '' });
  }

  function removeEmail(email: string) {
    onChange({ inviteEmails: values.inviteEmails.filter((e) => e !== email) });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail();
    }
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 26, fontWeight: 600, color: '#1F4D3A', letterSpacing: '-0.02em', marginBottom: 6 }}>
        Invite your team
      </h2>
      <p style={{ fontSize: 15, color: '#6B7A72', marginBottom: 32, lineHeight: 1.6 }}>
        Optional. Add colleagues who will help manage events and check in attendees.
      </p>

      {/* Email chips */}
      {values.inviteEmails.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 14,
          }}
        >
          {values.inviteEmails.map((email) => (
            <div
              key={email}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#E8EFEB',
                border: '1px solid #C9C3B1',
                borderRadius: 9999,
                padding: '4px 12px',
                fontSize: 13,
                color: '#1F4D3A',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {email}
              <button
                onClick={() => removeEmail(email)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#6B7A72', lineHeight: 1, display: 'flex', alignItems: 'center' }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div>
        <label style={labelStyle}>Email address</label>
        <input
          ref={inputRef}
          style={inputStyle}
          type="email"
          placeholder="colleague@company.com"
          value={values.inviteInput}
          onChange={(e) => onChange({ inviteInput: e.target.value })}
          onKeyDown={handleKeyDown}
        />
      </div>

      <button
        onClick={addEmail}
        style={{
          marginTop: 10,
          background: 'none',
          border: 'none',
          padding: 0,
          fontSize: 13,
          color: '#1F4D3A',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          textDecoration: 'underline',
          textUnderlineOffset: 3,
        }}
      >
        + Add another
      </button>
    </div>
  );
}

function StepDone() {
  return (
    <div style={{ textAlign: 'center', paddingTop: 16 }}>
      {/* Checkmark circle */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: '#E8EFEB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 28px',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M7 16l6 6L25 10" stroke="#1F4D3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 28, fontWeight: 600, color: '#1F4D3A', letterSpacing: '-0.02em', marginBottom: 10 }}>
        You&apos;re all set!
      </h2>
      <p style={{ fontSize: 15, color: '#6B7A72', marginBottom: 40, lineHeight: 1.6, maxWidth: 380, margin: '0 auto 40px' }}>
        Your workspace is ready. Here&apos;s what you can do next.
      </p>

      {/* 3 action cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, textAlign: 'left', maxWidth: 440, margin: '0 auto' }}>
        {[
          {
            icon: '📢',
            title: 'Publish event page',
            sub: 'Make your event visible to attendees',
            href: '/events/new',
          },
          {
            icon: '🎟',
            title: 'Set up tickets',
            sub: 'Add free or paid ticket tiers',
            href: '/events',
          },
          {
            icon: '📅',
            title: 'Build your agenda',
            sub: 'Add sessions, speakers and schedule',
            href: '/events',
          },
        ].map((card) => (
          <a
            key={card.title}
            href={card.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '16px 18px',
              background: '#FFFFFF',
              border: '1px solid #E5E0D4',
              borderRadius: 12,
              textDecoration: 'none',
              transition: 'border-color 0.15s ease',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                background: '#E8EFEB',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#0F1F18', fontFamily: 'Inter, sans-serif' }}>
                {card.title}
              </div>
              <div style={{ fontSize: 12, color: '#6B7A72', marginTop: 2 }}>{card.sub}</div>
            </div>
            <div style={{ marginLeft: 'auto', color: '#A9BDB2' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────

const INITIAL_FORM: FormValues = {
  eventType: null,
  orgName: '',
  region: '',
  currency: '',
  theme: 'forest',
  eventName: '',
  eventStart: '',
  eventEnd: '',
  venue: '',
  inviteEmails: [],
  inviteInput: '',
};

export default function OnboardingClient() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormValues>(INITIAL_FORM);

  function updateForm(values: Partial<FormValues>) {
    setForm((prev) => ({ ...prev, ...values }));
  }

  const isDone = step === 5;
  const progress = ((step + 1) / 6) * 100;

  const stepContent = [
    <StepWelcome key="welcome" values={form} onChange={updateForm} />,
    <StepOrganization key="org" values={form} onChange={updateForm} />,
    <StepBrand key="brand" values={form} onChange={updateForm} />,
    <StepFirstEvent key="event" values={form} onChange={updateForm} />,
    <StepInviteTeam key="invite" values={form} onChange={updateForm} />,
    <StepDone key="done" />,
  ];

  const ctaLabel =
    step === 0
      ? 'Get started'
      : step === 5
      ? 'Enter your dashboard'
      : 'Continue';

  function handleCta() {
    if (step === 5) {
      window.location.href = '/dashboard';
    } else {
      setStep((s) => Math.min(s + 1, 5));
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#FAF6EE',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Mobile progress bar */}
      <div
        className="md:hidden"
        style={{
          height: '1.5px',
          background: '#E5E0D4',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${progress}%`,
            background: '#1F4D3A',
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* ── Left sidebar ── */}
        <div
          className="hidden md:flex"
          style={{
            width: 300,
            minHeight: '100vh',
            background: 'linear-gradient(165deg, #0D1F17, #1F4D3A 65%, #235741)',
            padding: '40px 32px',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
          }}
        >
          {/* Logo */}
          <div
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 22,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              marginBottom: 40,
            }}
          >
            Karta
          </div>

          {/* GET SET UP label */}
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.12em',
              color: 'rgba(232,197,126,0.8)',
              marginBottom: 20,
              textTransform: 'uppercase',
            }}
          >
            GET SET UP
          </div>

          {/* Step indicators */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            {STEPS.map((label, idx) => {
              const done = step > idx;
              const active = step === idx;
              return (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 0',
                    cursor: done ? 'pointer' : 'default',
                  }}
                  onClick={() => done && setStep(idx)}
                >
                  {/* Circle */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: done
                        ? '#E8C57E'
                        : active
                        ? '#FFFFFF'
                        : 'rgba(255,255,255,0.08)',
                      border: done || active ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {done ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l2.5 2.5L10 3.5" stroke="#1F4D3A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: active ? '#1F4D3A' : 'rgba(255,255,255,0.4)',
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                      >
                        {idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: active ? 500 : 400,
                      color: done
                        ? 'rgba(255,255,255,0.7)'
                        : active
                        ? '#FFFFFF'
                        : 'rgba(255,255,255,0.35)',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <p
            style={{
              fontSize: 12.5,
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Takes about 2 minutes. You can change anything later.
          </p>
        </div>

        {/* ── Right content area ── */}
        <div
          style={{
            flex: 1,
            marginLeft: 0,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
          }}
          className="md:ml-[300px]"
        >
          {/* Step content */}
          <div
            style={{
              flex: 1,
              padding: '56px 48px 120px',
              maxWidth: 640,
            }}
          >
            {stepContent[step]}
          </div>

          {/* ── Footer nav ── */}
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              right: 0,
              left: 0,
              background: '#FAF6EE',
              borderTop: '1px solid #E5E0D4',
              padding: '16px 48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 20,
            }}
            className="md:left-[300px]"
          >
            {/* Back */}
            <div>
              {step > 0 && step < 5 && (
                <button
                  onClick={() => setStep((s) => Math.max(s - 1, 0))}
                  style={{
                    background: 'none',
                    border: '1px solid #E5E0D4',
                    borderRadius: 8,
                    padding: '10px 20px',
                    fontSize: 14,
                    color: '#3A4A42',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Back
                </button>
              )}
            </div>

            {/* Right actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Skip — only on invite step */}
              {step === 4 && (
                <button
                  onClick={() => setStep(5)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '10px 4px',
                    fontSize: 14,
                    color: '#6B7A72',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Skip
                </button>
              )}

              {/* Primary CTA */}
              {step === 5 ? (
                <a
                  href="/dashboard"
                  style={{
                    display: 'inline-block',
                    background: '#1F4D3A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 24px',
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'background 0.15s ease',
                  }}
                >
                  Enter your dashboard
                </a>
              ) : (
                <button
                  onClick={handleCta}
                  style={{
                    background: '#1F4D3A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 24px',
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                >
                  {ctaLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
