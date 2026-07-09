'use client';

import { useState, useMemo } from 'react';
import { ChevronUp } from 'lucide-react';

export interface QAQuestion {
  id: string;
  event_id: string;
  session_id: string | null;
  registration_id: string | null;
  question_text: string;
  asker_name: string | null;
  is_anonymous: boolean;
  upvotes_count: number;
  is_featured: boolean;
  status: 'pending' | 'answered' | 'hidden';
  created_at: string;
}

interface Props {
  eventId: string;
  registrationId: string | null;
  initialQuestions: QAQuestion[];
  sessions: { id: string; title: string }[];
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function QandAClient({ eventId, registrationId, initialQuestions, sessions }: Props) {
  const [questions, setQuestions] = useState<QAQuestion[]>(initialQuestions);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [sessionFilter, setSessionFilter] = useState<string>('all');
  const [askText, setAskText] = useState('');
  const [isAnon, setIsAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    let list = questions.filter((q) => q.status !== 'hidden');
    if (sessionFilter !== 'all') {
      list = list.filter((q) => q.session_id === sessionFilter);
    }
    return [...list].sort((a, b) => b.upvotes_count - a.upvotes_count);
  }, [questions, sessionFilter]);

  async function handleUpvote(questionId: string) {
    if (!registrationId) return;
    const voted = votedIds.has(questionId);
    const delta = voted ? -1 : 1;
    setVotedIds((prev) => {
      const next = new Set(prev);
      if (voted) next.delete(questionId); else next.add(questionId);
      return next;
    });
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, upvotes_count: q.upvotes_count + delta } : q
      )
    );
    try {
      await fetch(`/api/events/${eventId}/q-and-a`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: questionId, registration_id: registrationId }),
      });
    } catch {
      // revert
      setVotedIds((prev) => {
        const next = new Set(prev);
        if (voted) next.add(questionId); else next.delete(questionId);
        return next;
      });
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, upvotes_count: q.upvotes_count - delta } : q
        )
      );
    }
  }

  async function handleSubmit() {
    if (!askText.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/q-and-a`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: askText.trim(),
          registration_id: registrationId,
          is_anonymous: isAnon,
          session_id: sessionFilter !== 'all' ? sessionFilter : null,
        }),
      });
      if (!res.ok) throw new Error('Submission failed.');
      const data = await res.json();
      setQuestions((prev) => [data.question, ...prev]);
      setAskText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-40">
      {/* Session filter */}
      {sessions.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSessionFilter('all')}
            className="px-3.5 py-1.5 rounded-full text-[13px] font-medium border transition-colors"
            style={
              sessionFilter === 'all'
                ? { background: '#1F4D3A', color: '#fff', borderColor: '#1F4D3A' }
                : { background: '#fff', color: '#6B7A72', borderColor: '#E5E0D4' }
            }
          >
            All sessions
          </button>
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setSessionFilter(s.id)}
              className="px-3.5 py-1.5 rounded-full text-[13px] font-medium border transition-colors"
              style={
                sessionFilter === s.id
                  ? { background: '#1F4D3A', color: '#fff', borderColor: '#1F4D3A' }
                  : { background: '#fff', color: '#6B7A72', borderColor: '#E5E0D4' }
              }
            >
              {s.title}
            </button>
          ))}
        </div>
      )}

      {/* Question list */}
      {visible.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[14px]" style={{ color: '#6B7A72' }}>
            No questions yet. Be the first to ask.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((q) => {
            const voted = votedIds.has(q.id);
            return (
              <div
                key={q.id}
                className="bg-white border rounded-xl p-4 flex gap-4"
                style={{
                  borderColor: '#E5E0D4',
                  borderLeft: q.is_featured ? '2px solid #E8C57E' : undefined,
                  opacity: q.status === 'answered' ? 0.7 : 1,
                }}
              >
                {/* Upvote column */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleUpvote(q.id)}
                    disabled={!registrationId}
                    className="p-1 rounded transition-colors disabled:cursor-not-allowed"
                    style={{ color: voted ? '#1F4D3A' : '#6B7A72' }}
                  >
                    <ChevronUp
                      size={20}
                      strokeWidth={voted ? 2.5 : 1.8}
                      fill={voted ? '#1F4D3A' : 'none'}
                    />
                  </button>
                  <span
                    className="font-mono font-medium"
                    style={{ fontSize: 16, color: '#1F4D3A' }}
                  >
                    {q.upvotes_count}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  {q.is_featured && (
                    <p
                      className="text-[11px] font-medium uppercase tracking-wider"
                      style={{ color: '#E8C57E' }}
                    >
                      Featured by moderator
                    </p>
                  )}
                  <p className="text-[15px]" style={{ color: '#0F1F18' }}>
                    {q.question_text}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px]" style={{ color: '#6B7A72' }}>
                      {q.is_anonymous ? 'Anonymous' : (q.asker_name ?? 'Attendee')}
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: '#6B7A72' }}>
                      {timeAgo(q.created_at)}
                    </span>
                    {q.status === 'answered' && (
                      <span
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: '#E8EFEB', color: '#2D7A4F' }}
                      >
                        Answered ✓
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ask form — fixed at bottom */}
      {registrationId && (
        <div
          className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 border-t"
          style={{ background: '#FAF6EE', borderColor: '#E5E0D4' }}
        >
          <div className="max-w-[700px] mx-auto space-y-2">
            {error && (
              <p className="text-[12px] px-3 py-1.5 rounded-lg" style={{ background: '#FEE2E2', color: '#B8423C' }}>
                {error}
              </p>
            )}
            <textarea
              value={askText}
              onChange={(e) => setAskText(e.target.value)}
              placeholder="Ask a question…"
              rows={2}
              className="w-full border rounded-xl px-4 py-2.5 text-[14px] resize-none outline-none"
              style={{ borderColor: '#E5E0D4', color: '#0F1F18', background: '#fff' }}
            />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-[13px] cursor-pointer select-none" style={{ color: '#6B7A72' }}>
                <input
                  type="checkbox"
                  checked={isAnon}
                  onChange={(e) => setIsAnon(e.target.checked)}
                  className="rounded"
                />
                Post anonymously
              </label>
              <button
                onClick={handleSubmit}
                disabled={!askText.trim() || submitting}
                className="ml-auto px-5 py-2 rounded-lg text-[14px] font-medium text-white disabled:opacity-50 transition-opacity"
                style={{ background: '#1F4D3A' }}
              >
                {submitting ? 'Posting…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
