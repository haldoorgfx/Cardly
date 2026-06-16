'use client';

import { useState } from 'react';
import type { Session } from '@/types/database';

interface Props {
  eventId: string;
  eventTitle: string;
  registrationId: string;
  attendedSessions: Partial<Session>[];
}

const HIGHLIGHTS = [
  'The speakers',
  'The networking',
  'The sessions',
  'The venue',
  'The Eventera Card',
];

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      fill={filled ? '#E8C57E' : 'none'}
      stroke={filled ? '#E8C57E' : '#C9C3B1'}
      strokeWidth="1.5"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function SmallStarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      fill={filled ? '#E8C57E' : 'none'}
      stroke={filled ? '#E8C57E' : '#C9C3B1'}
      strokeWidth="1.5"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export default function FeedbackClient({ eventId, eventTitle, registrationId, attendedSessions }: Props) {
  const [overallRating, setOverallRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedHighlights, setSelectedHighlights] = useState<string[]>([]);
  const [sessionRatings, setSessionRatings] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleHighlight(h: string) {
    setSelectedHighlights((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]
    );
  }

  async function rateSession(sessionId: string, rating: number) {
    setSessionRatings((prev) => ({ ...prev, [sessionId]: rating }));
    try {
      await fetch(`/api/sessions/${sessionId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_id: registrationId, rating }),
      });
    } catch {
      // no-op
    }
  }

  async function handleSubmit() {
    if (overallRating === 0) { setError('Please select an overall rating.'); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: registrationId,
          overall_rating: overallRating,
          highlights: selectedHighlights,
          comment,
        }),
      });
      if (!res.ok) throw new Error('Submission failed.');
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-20 gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
          style={{ background: '#E8EFEB' }}
        >
          ✓
        </div>
        <h2 className="font-display text-[22px] font-normal" style={{ color: '#1F4D3A' }}>
          Thank you for your feedback!
        </h2>
        <p className="text-[15px]" style={{ color: '#6B7A72' }}>
          Your response has been recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto px-5 py-10 space-y-10">
      {/* Heading */}
      <h1
        className="font-display font-normal"
        style={{ fontSize: 28, color: '#1F4D3A' }}
      >
        How was {eventTitle}?
      </h1>

      {/* Overall rating */}
      <section className="space-y-3">
        <p className="text-[15px] font-medium" style={{ color: '#0F1F18' }}>Overall rating</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setOverallRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="w-10 h-10 transition-transform hover:scale-110"
              aria-label={`${star} star`}
            >
              <StarIcon filled={star <= (hoverRating || overallRating)} />
            </button>
          ))}
        </div>

        {overallRating > 0 && (
          <div className="space-y-1.5">
            <p className="text-[13px]" style={{ color: '#6B7A72' }}>Tell us more (optional)</p>
            <textarea
              className="w-full border rounded-xl px-4 py-3 text-[15px] resize-none"
              style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
              rows={3}
              placeholder="What did you enjoy most? What could be improved?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        )}
      </section>

      {/* Highlights */}
      <section className="space-y-3">
        <p className="text-[15px] font-medium" style={{ color: '#0F1F18' }}>What were the highlights?</p>
        <div className="flex flex-wrap gap-2">
          {HIGHLIGHTS.map((h) => (
            <button
              key={h}
              onClick={() => toggleHighlight(h)}
              className="px-4 py-2 rounded-full text-sm font-medium border transition-colors"
              style={
                selectedHighlights.includes(h)
                  ? { background: '#1F4D3A', color: '#fff', borderColor: '#1F4D3A' }
                  : { background: '#fff', color: '#0F1F18', borderColor: '#E5E0D4' }
              }
            >
              {h}
            </button>
          ))}
        </div>
      </section>

      {/* Per-session ratings */}
      {attendedSessions.length > 0 && (
        <section className="space-y-4">
          <p className="text-[15px] font-medium" style={{ color: '#0F1F18' }}>Sessions you attended</p>
          <div className="space-y-4">
            {attendedSessions.map((session) => {
              if (!session.id || !session.title) return null;
              const rating = sessionRatings[session.id] ?? 0;
              return (
                <div key={session.id} className="flex items-center justify-between gap-4">
                  <p className="text-[15px] font-medium flex-1 min-w-0 truncate" style={{ color: '#0F1F18' }}>
                    {session.title}
                  </p>
                  <div className="flex gap-1 shrink-0">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => rateSession(session.id!, star)}
                        className="w-5 h-5 transition-transform hover:scale-110"
                        aria-label={`${star} star`}
                      >
                        <SmallStarIcon filled={star <= rating} />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm px-3 py-2 rounded-lg bg-red-50" style={{ color: '#B8423C' }}>{error}</p>
      )}

      {/* Submit */}
      <div className="flex justify-center md:justify-start">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full md:w-[280px] py-3.5 rounded-xl text-[15px] font-medium text-white disabled:opacity-60 transition-opacity"
          style={{ background: '#1F4D3A' }}
        >
          {submitting ? 'Submitting…' : 'Submit feedback'}
        </button>
      </div>
    </div>
  );
}
