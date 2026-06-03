'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FeedbackSession {
  id: string;
  title: string;
  starts_at: string;
}

interface Props {
  sessions: FeedbackSession[];
  eventName: string;
  registrationId: string;
  eventSlug: string;
  onSubmit?: () => void;
}

const HIGHLIGHT_OPTIONS = [
  'The speakers',
  'The networking',
  'The sessions',
  'The venue',
  'The Karta Card 😄',
];

function StarIcon({
  filled,
  size = 40,
}: {
  filled: boolean;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? '#E8C57E' : 'none'}
      stroke="#E8C57E"
      strokeWidth={1.5}
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function StarRow({
  rating,
  onRate,
  size = 40,
  gap = 12,
}: {
  rating: number;
  onRate: (n: number) => void;
  size?: number;
  gap?: number;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || rating;

  return (
    <div
      style={{ display: 'flex', gap }}
      role="group"
      aria-label="Star rating"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onRate(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${n} star${n !== 1 ? 's' : ''}`}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            lineHeight: 0,
            transition: 'transform 0.12s ease',
            transform: hover === n ? 'scale(1.12)' : 'scale(1)',
          }}
        >
          <StarIcon filled={n <= active} size={size} />
        </button>
      ))}
    </div>
  );
}

export default function FeedbackClient({
  sessions,
  eventName,
  registrationId: _registrationId,
  eventSlug,
  onSubmit,
}: Props) {
  const [eventRating, setEventRating] = useState(0);
  const [sessionRatings, setSessionRatings] = useState<Record<string, number>>({});
  const [highlights, setHighlights] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [noteVisible, setNoteVisible] = useState(false);

  function handleEventRating(n: number) {
    setEventRating(n);
    if (!noteVisible) setNoteVisible(true);
  }

  function handleSessionRating(sessionId: string, n: number) {
    setSessionRatings((prev) => ({ ...prev, [sessionId]: n }));
  }

  function toggleHighlight(label: string) {
    setHighlights((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function handleSubmit() {
    setSubmitted(true);
    onSubmit?.();
  }

  if (submitted) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 20,
          textAlign: 'center',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#E8EFEB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width={28}
            height={28}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1F4D3A"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 22,
            fontWeight: 400,
            color: '#1F4D3A',
            margin: 0,
          }}
        >
          Thanks! Your feedback has been submitted.
        </p>
        <Link
          href={`/c/${eventSlug}`}
          style={{
            fontSize: 14,
            color: '#6B7A72',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Back to event
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: '48px 24px 80px',
      }}
    >
      {/* Header */}
      <h1
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 28,
          fontWeight: 400,
          color: '#1F4D3A',
          margin: '0 0 10px',
          letterSpacing: '-0.02em',
        }}
      >
        How was {eventName}?
      </h1>
      <p
        style={{
          fontSize: 16,
          color: '#6B7A72',
          margin: 0,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        Your feedback helps organizers improve.
      </p>

      {/* Section 1 — Rate the event */}
      <section style={{ marginTop: 44 }}>
        <h2
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 22,
            fontWeight: 400,
            color: '#1F4D3A',
            margin: '0 0 20px',
            letterSpacing: '-0.01em',
          }}
        >
          Rate the event
        </h2>

        <StarRow rating={eventRating} onRate={handleEventRating} size={40} gap={12} />

        {/* Slide-in note area */}
        <div
          style={{
            overflow: 'hidden',
            maxHeight: noteVisible ? 220 : 0,
            opacity: noteVisible ? 1 : 0,
            transition: 'max-height 0.3s ease, opacity 0.25s ease',
            marginTop: noteVisible ? 20 : 0,
          }}
        >
          <p
            style={{
              fontSize: 16,
              color: '#6B7A72',
              margin: '0 0 10px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Thanks — tell us more (optional)
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What stood out?"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              border: '1px solid #E5E0D4',
              borderRadius: 12,
              padding: '14px 16px',
              fontSize: 14,
              fontFamily: 'Inter, sans-serif',
              color: '#0F1F18',
              background: '#FFFFFF',
              minHeight: 90,
              resize: 'vertical',
              outline: 'none',
              lineHeight: 1.5,
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#E8C57E';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#E5E0D4';
            }}
          />
        </div>
      </section>

      {/* Section 2 — Sessions you attended */}
      {sessions.length > 0 && (
        <section style={{ marginTop: 44 }}>
          <h2
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 20,
              fontWeight: 400,
              color: '#1F4D3A',
              margin: '0 0 4px',
              letterSpacing: '-0.01em',
            }}
          >
            Sessions you attended
          </h2>

          <div>
            {sessions.map((session, idx) => {
              const sessionRating = sessionRatings[session.id] ?? 0;
              const rated = sessionRating > 0;
              return (
                <div
                  key={session.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 16,
                    paddingBottom: 16,
                    borderBottom:
                      idx < sessions.length - 1 ? '1px solid #E5E0D4' : 'none',
                    gap: 16,
                  }}
                >
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: '#1F4D3A',
                      fontFamily: 'Inter, sans-serif',
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {session.title}
                  </span>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      flexShrink: 0,
                    }}
                  >
                    <StarRow
                      rating={sessionRating}
                      onRate={(n) => handleSessionRating(session.id, n)}
                      size={22}
                      gap={4}
                    />
                    {rated ? (
                      <span
                        style={{
                          fontSize: 15,
                          color: '#1F4D3A',
                          fontWeight: 700,
                          lineHeight: 1,
                          width: 32,
                          textAlign: 'center',
                        }}
                        aria-label="Rated"
                      >
                        ✓
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSessionRating(session.id, 0)}
                        style={{
                          fontSize: 13,
                          color: '#6B7A72',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          fontFamily: 'Inter, sans-serif',
                          width: 32,
                          textAlign: 'center',
                        }}
                      >
                        Skip
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section 3 — Best part */}
      <section style={{ marginTop: 44 }}>
        <h2
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 20,
            fontWeight: 400,
            color: '#1F4D3A',
            margin: '0 0 16px',
            letterSpacing: '-0.01em',
          }}
        >
          What was the best part?
        </h2>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {HIGHLIGHT_OPTIONS.map((label) => {
            const active = highlights.has(label);
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleHighlight(label)}
                style={{
                  height: 40,
                  padding: '0 18px',
                  borderRadius: 9999,
                  fontSize: 14,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: active ? '#1F4D3A' : '#E5E0D4',
                  background: active ? '#1F4D3A' : '#FFFFFF',
                  color: active ? '#FAF6EE' : '#3A4A42',
                  transition:
                    'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <div
        style={{
          marginTop: 52,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <button
          type="button"
          onClick={handleSubmit}
          style={{
            width: 280,
            height: 48,
            borderRadius: 9999,
            background: '#1F4D3A',
            color: '#FAF6EE',
            fontSize: 15,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.01em',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#163828';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#1F4D3A';
          }}
        >
          Submit feedback
        </button>
        <Link
          href={`/c/${eventSlug}`}
          style={{
            fontSize: 14,
            color: '#6B7A72',
            textDecoration: 'none',
            fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.textDecoration =
              'underline';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none';
          }}
        >
          Skip for now
        </Link>
      </div>
    </div>
  );
}
