'use client';

import { useState, useRef, useEffect } from 'react';

interface Question {
  id: string;
  question: string;
  upvotes_count: number;
  is_anonymous: boolean;
  is_featured: boolean;
  created_at: string;
  registration?: { attendee_name: string | null } | null;
}

interface Props {
  questions: Question[];
  sessionTitle: string | null;
  sessionRoom: string | null;
  registrationId: string | null;
  eventId: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function QandAClient({
  questions: initialQuestions,
  sessionTitle,
  sessionRoom,
  registrationId,
  eventId,
}: Props) {
  const [localQuestions, setLocalQuestions] = useState<Question[]>(
    [...initialQuestions].sort((a, b) => b.upvotes_count - a.upvotes_count)
  );
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
  const [askText, setAskText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isStuck, setIsStuck] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Detect when context bar should be "stuck" (user has scrolled past it)
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  function handleUpvote(questionId: string) {
    const wasUpvoted = upvoted.has(questionId);
    // Optimistic update
    setUpvoted((prev) => {
      const next = new Set(prev);
      if (wasUpvoted) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
    setLocalQuestions((prev) =>
      [...prev]
        .map((q) =>
          q.id === questionId
            ? { ...q, upvotes_count: q.upvotes_count + (wasUpvoted ? -1 : 1) }
            : q
        )
        .sort((a, b) => b.upvotes_count - a.upvotes_count)
    );
  }

  async function handleSubmit() {
    if (!askText.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/q-and-a`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: askText.trim(),
          is_anonymous: isAnonymous,
          registration_id: registrationId,
          event_id: eventId,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit question.');
      const data = (await res.json()) as { question: Question };
      setLocalQuestions((prev) => [data.question, ...prev]);
      setAskText('');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  const topQuestion = localQuestions[0];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF6EE',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Sentinel — sits just above the sticky bar in document flow */}
      <div ref={sentinelRef} style={{ height: 1 }} />

      {/* Sticky context bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          height: 56,
          background: '#E8EFEB',
          borderBottom: '1px solid #E5E0D4',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 10,
          boxShadow: isStuck
            ? '0 1px 8px rgba(15,31,24,0.08)'
            : 'none',
          transition: 'box-shadow 0.2s ease',
        }}
      >
        {/* Left: session info */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: '#1F4D3A',
              fontFamily: 'Inter, sans-serif',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: sessionRoom ? 200 : '100%',
            }}
          >
            {sessionTitle ?? 'Live Q&A'}
          </span>

          {sessionRoom && (
            <>
              <span
                style={{
                  color: '#C9C3B1',
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                ·
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: '#6B7A72',
                  fontFamily: 'Inter, sans-serif',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  // hide on very small screens via inline trick
                  display: 'inline',
                }}
                className="hidden sm:inline"
              >
                {sessionRoom}
              </span>
            </>
          )}

          {/* LIVE badge */}
          <style>{`
            @keyframes livePulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(184,66,60,0.4); }
              50% { box-shadow: 0 0 0 5px rgba(184,66,60,0); }
            }
          `}</style>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              flexShrink: 0,
              marginLeft: 4,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#B8423C',
                animation: 'livePulse 1.4s ease infinite',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#B8423C',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Live
            </span>
          </div>
        </div>

        {/* Right: room count */}
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12,
            color: '#6B7A72',
            flexShrink: 0,
          }}
        >
          {localQuestions.length > 0
            ? `${localQuestions.length} question${localQuestions.length !== 1 ? 's' : ''}`
            : '0 questions'}
        </span>
      </div>

      {/* Main question list */}
      <div
        style={{
          maxWidth: 720,
          width: '100%',
          margin: '0 auto',
          padding: '28px 16px 140px',
          flex: 1,
        }}
      >
        {/* Meta line */}
        <p
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: '#6B7A72',
            margin: '0 0 16px',
            letterSpacing: '0.03em',
          }}
        >
          {localQuestions.length} question{localQuestions.length !== 1 ? 's' : ''} · sorted by votes
        </p>

        {localQuestions.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '56px 24px',
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E5E0D4',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
            <p
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: '#0F1F18',
                margin: '0 0 4px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              No questions yet
            </p>
            <p
              style={{
                fontSize: 13,
                color: '#6B7A72',
                margin: 0,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Be the first to ask something.
            </p>
          </div>
        ) : (
          <div>
            {localQuestions.map((q) => {
              const isTop = q.id === topQuestion?.id && localQuestions.length > 1;
              const isUpvoted = upvoted.has(q.id);

              return (
                <div
                  key={q.id}
                  style={{
                    display: 'flex',
                    gap: 16,
                    border: q.is_featured ? '1px solid #E8C57E' : '1px solid #E5E0D4',
                    borderLeft: q.is_featured ? '2px solid #E8C57E' : undefined,
                    borderRadius: 12,
                    padding: 18,
                    marginBottom: 12,
                    background: isTop
                      ? 'rgba(232,197,126,0.1)'
                      : '#FFFFFF',
                    transition: 'background 0.2s ease',
                  }}
                >
                  {/* Upvote column */}
                  <div
                    style={{
                      width: 44,
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleUpvote(q.id)}
                      aria-label={isUpvoted ? 'Remove upvote' : 'Upvote question'}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: '1px solid',
                        borderColor: isUpvoted ? '#1F4D3A' : '#E5E0D4',
                        background: isUpvoted ? '#1F4D3A' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition:
                          'background 0.15s ease, border-color 0.15s ease',
                        padding: 0,
                      }}
                    >
                      <svg
                        width={16}
                        height={16}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={isUpvoted ? '#FFFFFF' : '#6B7A72'}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </button>
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#1F4D3A',
                      }}
                    >
                      {q.upvotes_count}
                    </span>
                  </div>

                  {/* Question body */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {q.is_featured && (
                      <p
                        style={{
                          fontSize: 11,
                          color: '#C9A45E',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          margin: '0 0 6px',
                          letterSpacing: '0.02em',
                        }}
                      >
                        ★ Featured by moderator
                      </p>
                    )}
                    <p
                      style={{
                        fontSize: 15,
                        color: '#0F1F18',
                        fontFamily: 'Inter, sans-serif',
                        lineHeight: 1.5,
                        margin: '0 0 8px',
                      }}
                    >
                      {q.question}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: '#6B7A72',
                        fontFamily: 'Inter, sans-serif',
                        margin: 0,
                        display: 'flex',
                        gap: 6,
                        alignItems: 'center',
                      }}
                    >
                      <span>
                        {q.is_anonymous
                          ? 'Anonymous'
                          : (q.registration?.attendee_name ?? 'Attendee')}
                      </span>
                      <span style={{ color: '#C9C3B1' }}>·</span>
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 11,
                        }}
                      >
                        {formatTime(q.created_at)}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed ask bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          background: '#FFFFFF',
          borderTop: '1px solid #E5E0D4',
          padding: '12px 16px 20px',
        }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {/* Label */}
          <p
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              color: '#6B7A72',
              margin: '0 0 8px',
              letterSpacing: '0.03em',
            }}
          >
            Ask the speaker a question
          </p>

          {/* Textarea */}
          <textarea
            value={askText}
            onChange={(e) => setAskText(e.target.value)}
            placeholder="Type your question…"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              border: '1px solid #E5E0D4',
              borderRadius: 12,
              padding: '12px 14px',
              fontSize: 14,
              fontFamily: 'Inter, sans-serif',
              color: '#0F1F18',
              background: '#FFFFFF',
              minHeight: 48,
              resize: 'none',
              outline: 'none',
              lineHeight: 1.5,
              transition: 'border-color 0.15s ease',
              display: 'block',
              marginBottom: 10,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#E8C57E';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#E5E0D4';
            }}
          />

          {/* Bottom row: toggle + submit */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            {/* Anonymous toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <button
                type="button"
                role="switch"
                aria-checked={isAnonymous}
                onClick={() => setIsAnonymous((v) => !v)}
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 9999,
                  background: isAnonymous ? '#1F4D3A' : '#E5E0D4',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'background 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    transition: 'transform 0.2s ease',
                    transform: isAnonymous ? 'translateX(16px)' : 'translateX(0)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  }}
                />
              </button>
              <span
                style={{
                  fontSize: 13,
                  color: '#6B7A72',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Post anonymously
              </span>
            </label>

            {/* Submit button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!askText.trim() || submitting}
              style={{
                height: 38,
                padding: '0 20px',
                borderRadius: 9999,
                background:
                  !askText.trim() || submitting ? '#E8EFEB' : '#1F4D3A',
                color: !askText.trim() || submitting ? '#6B7A72' : '#FAF6EE',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                border: 'none',
                cursor: !askText.trim() || submitting ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s ease, color 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {submitting ? 'Submitting…' : 'Submit question'}
            </button>
          </div>

          {/* Inline error */}
          {submitError && (
            <p
              style={{
                fontSize: 13,
                color: '#B8423C',
                margin: '8px 0 0',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {submitError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
