'use client';

import { useState } from 'react';
import { ChevronUp } from 'lucide-react';
import type { QAQuestion } from '@/types/database';

interface Props {
  eventId: string;
  registrationId: string | null;
  initialQuestions: QAQuestion[];
  sessions: { id: string; title: string }[];
}

export default function QandAClient({ eventId, registrationId, initialQuestions, sessions }: Props) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [sessionFilter, setSessionFilter] = useState<string | null>(null);
  const [askText, setAskText] = useState('');
  const [isAnon, setIsAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [upvoting, setUpvoting] = useState<string | null>(null);
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());

  const filtered = questions.filter(q =>
    !sessionFilter || q.session_id === sessionFilter
  );

  const handleUpvote = async (qId: string) => {
    if (!registrationId || upvoting) return;
    setUpvoting(qId);
    try {
      const res = await fetch(`/api/events/${eventId}/q-and-a`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: qId, registration_id: registrationId }),
      });
      const data = await res.json() as { upvoted: boolean };
      const nowUpvoted = data.upvoted;
      setUpvotedIds(prev => {
        const next = new Set(prev);
        if (nowUpvoted) { next.add(qId); } else { next.delete(qId); }
        return next;
      });
      setQuestions(prev =>
        prev.map(q => q.id === qId ? { ...q, upvotes_count: q.upvotes_count + (nowUpvoted ? 1 : -1) } : q)
          .sort((a, b) => b.upvotes_count - a.upvotes_count)
      );
    } finally {
      setUpvoting(null);
    }
  };

  const handleSubmit = async () => {
    if (!askText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/q-and-a`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: askText.trim(),
          is_anonymous: isAnon,
          registration_id: registrationId ?? undefined,
          session_id: sessionFilter ?? undefined,
        }),
      });
      const data = await res.json() as { question: QAQuestion };
      if (data.question) {
        setQuestions(prev => [data.question, ...prev]);
        setAskText('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Session filter */}
      {sessions.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSessionFilter(null)}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium"
            style={{ background: !sessionFilter ? '#1F4D3A' : 'white', color: !sessionFilter ? 'white' : '#6B7A72', border: `1px solid ${!sessionFilter ? '#1F4D3A' : '#E5E0D4'}` }}
          >All sessions</button>
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => setSessionFilter(s.id)}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium"
              style={{ background: sessionFilter === s.id ? '#1F4D3A' : 'white', color: sessionFilter === s.id ? 'white' : '#6B7A72', border: `1px solid ${sessionFilter === s.id ? '#1F4D3A' : '#E5E0D4'}` }}
            >
              {s.title.length > 30 ? s.title.slice(0, 30) + '…' : s.title}
            </button>
          ))}
        </div>
      )}

      {/* Questions */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl py-12 text-center" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
          <p className="text-[14px]" style={{ color: '#6B7A72' }}>No questions yet. Be the first to ask.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => (
            <div
              key={q.id}
              className="rounded-xl p-4 flex gap-4"
              style={{
                background: 'white',
                border: `1px solid ${q.is_featured ? '#E8C57E' : '#E5E0D4'}`,
                borderLeft: q.is_featured ? '3px solid #E8C57E' : undefined,
                opacity: q.status === 'answered' ? 0.6 : 1,
              }}
            >
              {/* Upvote */}
              <button
                onClick={() => handleUpvote(q.id)}
                disabled={!registrationId || upvoting === q.id}
                className="flex flex-col items-center gap-1 shrink-0 w-10"
                style={{ color: upvotedIds.has(q.id) ? '#1F4D3A' : '#6B7A72' }}
              >
                <ChevronUp size={20} strokeWidth={upvotedIds.has(q.id) ? 2.5 : 1.8} />
                <span className="font-mono text-[14px] font-semibold">{q.upvotes_count}</span>
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {q.is_featured && (
                  <div className="text-[11px] font-medium mb-1" style={{ color: '#E8C57E' }}>Featured by moderator</div>
                )}
                <p className="text-[15px]" style={{ color: '#0F1F18' }}>{q.question}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[12px]" style={{ color: '#6B7A72' }}>
                    {q.is_anonymous ? 'Anonymous' : (q.registrations as { attendee_name: string } | null)?.attendee_name ?? 'Attendee'}
                  </span>
                  {q.status === 'answered' && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>Answered ✓</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ask form */}
      {registrationId && (
        <div className="sticky bottom-4 mt-4">
          <div className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 4px 20px rgba(15,31,24,0.08)' }}>
            <textarea
              value={askText}
              onChange={e => setAskText(e.target.value)}
              placeholder="Ask a question…"
              rows={2}
              className="w-full rounded-xl px-3 py-2.5 text-[14px] resize-none outline-none mb-3"
              style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  className="w-9 h-5 rounded-full transition-colors"
                  style={{ background: isAnon ? '#1F4D3A' : '#E5E0D4' }}
                  onClick={() => setIsAnon(v => !v)}
                >
                  <div className="w-4 h-4 rounded-full bg-white m-0.5 transition-transform" style={{ transform: isAnon ? 'translateX(16px)' : 'none' }} />
                </div>
                <span className="text-[12px]" style={{ color: '#6B7A72' }}>Post anonymously</span>
              </label>
              <button
                onClick={handleSubmit}
                disabled={!askText.trim() || submitting}
                className="px-5 py-2 rounded-xl text-[13px] font-medium transition-opacity"
                style={{ background: '#1F4D3A', color: 'white', opacity: !askText.trim() || submitting ? 0.5 : 1 }}
              >
                {submitting ? 'Submitting…' : 'Submit question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
