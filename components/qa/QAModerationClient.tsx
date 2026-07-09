'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, Check, X } from 'lucide-react';
import type { QAQuestion } from './QandAClient';

type QAFilter = 'all' | 'pending' | 'answered' | 'hidden';

interface Props {
  eventId: string;
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

function downloadCSV(questions: QAQuestion[]) {
  const header = 'Question,Asker,Anonymous,Upvotes,Status,Session,Time\n';
  const rows = questions.map((q) =>
    [
      `"${q.question_text.replace(/"/g, '""')}"`,
      q.is_anonymous ? 'Anonymous' : (q.asker_name ?? 'Attendee'),
      q.is_anonymous ? 'yes' : 'no',
      q.upvotes_count,
      q.status,
      q.session_id ?? '',
      new Date(q.created_at).toLocaleString(),
    ].join(',')
  );
  const csv = header + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'qa-questions.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function QAModerationClient({ eventId, initialQuestions, sessions }: Props) {
  const [questions, setQuestions] = useState<QAQuestion[]>(initialQuestions);
  const [filter, setFilter] = useState<QAFilter>('all');
  const [patching, setPatching] = useState<string | null>(null);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/q-and-a`);
        if (res.ok) {
          const data = await res.json();
          setQuestions(data.questions ?? []);
        }
      } catch { /* no-op */ }
    }, 15000);
    return () => clearInterval(id);
  }, [eventId]);

  async function patchQuestion(
    questionId: string,
    patch: Partial<Pick<QAQuestion, 'is_featured' | 'status'>>
  ) {
    setPatching(questionId);
    try {
      const res = await fetch(`/api/events/${eventId}/q-and-a`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: questionId, ...patch }),
      });
      if (res.ok) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? { ...q, ...patch } : q))
        );
      }
    } catch { /* no-op */ }
    finally { setPatching(null); }
  }

  const visible = questions.filter((q) => {
    if (filter === 'all') return true;
    return q.status === filter;
  });

  const total = questions.length;
  const answered = questions.filter((q) => q.status === 'answered').length;
  const pending = questions.filter((q) => q.status === 'pending').length;

  const FILTERS: { key: QAFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'answered', label: 'Answered' },
    { key: 'hidden', label: 'Hidden' },
  ];

  return (
    <div className="flex gap-6 items-start">
      {/* LEFT — Question queue */}
      <div className="flex-1 min-w-0 max-w-[440px]">
        {/* Header + count */}
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-display font-medium text-[20px]" style={{ color: '#0F1F18' }}>
            Q&amp;A
          </h2>
          <span className="font-mono text-[12px]" style={{ color: '#6B7A72' }}>
            {total} questions
          </span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 border-b mb-4" style={{ borderColor: '#E5E0D4' }}>
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-3 py-2 text-[13px] font-medium border-b-2 transition-colors"
              style={
                filter === key
                  ? { color: '#1F4D3A', borderColor: '#1F4D3A', marginBottom: -1 }
                  : { color: '#6B7A72', borderColor: 'transparent', marginBottom: -1 }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Questions */}
        {visible.length === 0 ? (
          <p className="text-[13px] text-center py-10" style={{ color: '#6B7A72' }}>
            No questions in this view.
          </p>
        ) : (
          <div className="space-y-2">
            {visible
              .sort((a, b) => b.upvotes_count - a.upvotes_count)
              .map((q) => (
                <div
                  key={q.id}
                  className="bg-white border rounded-xl p-3 flex gap-3"
                  style={{ borderColor: '#E5E0D4' }}
                >
                  {/* Vote count */}
                  <span
                    className="font-mono font-medium w-8 shrink-0 text-right"
                    style={{ fontSize: 16, color: '#1F4D3A' }}
                  >
                    {q.upvotes_count}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px]" style={{ color: '#0F1F18' }}>
                      {q.question_text}
                    </p>
                    <p className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>
                      {q.is_anonymous ? 'Anonymous' : (q.asker_name ?? 'Attendee')}
                      {' · '}
                      {timeAgo(q.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Feature */}
                    <button
                      title="Feature"
                      disabled={patching === q.id}
                      onClick={() => patchQuestion(q.id, { is_featured: !q.is_featured })}
                      className="p-1.5 rounded-lg transition-colors hover:bg-amber-50"
                      style={{ color: q.is_featured ? '#E8C57E' : '#C9C3B1' }}
                    >
                      <Star size={15} fill={q.is_featured ? '#E8C57E' : 'none'} />
                    </button>
                    {/* Answered */}
                    <button
                      title="Mark answered"
                      disabled={patching === q.id}
                      onClick={() =>
                        patchQuestion(q.id, {
                          status: q.status === 'answered' ? 'pending' : 'answered',
                        })
                      }
                      className="p-1.5 rounded-lg transition-colors hover:bg-green-50"
                      style={{ color: q.status === 'answered' ? '#2D7A4F' : '#C9C3B1' }}
                    >
                      <Check size={15} strokeWidth={2.5} />
                    </button>
                    {/* Hide */}
                    <button
                      title="Hide"
                      disabled={patching === q.id}
                      onClick={() =>
                        patchQuestion(q.id, {
                          status: q.status === 'hidden' ? 'pending' : 'hidden',
                        })
                      }
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                      style={{ color: q.status === 'hidden' ? '#B8423C' : '#C9C3B1' }}
                    >
                      <X size={15} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* RIGHT — Stats panel */}
      <div className="w-[240px] shrink-0 space-y-4">
        <div
          className="bg-white border rounded-2xl p-5 space-y-4"
          style={{ borderColor: '#E5E0D4' }}
        >
          <h3 className="font-display font-medium text-[15px]" style={{ color: '#0F1F18' }}>
            Live stats
          </h3>
          <div className="space-y-2.5">
            {[
              { label: 'Total questions', value: total },
              { label: 'Answered', value: answered },
              { label: 'Pending', value: pending },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-[13px]">
                <span style={{ color: '#6B7A72' }}>{label}</span>
                <span className="font-mono font-medium" style={{ color: '#1F4D3A' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => downloadCSV(questions)}
          className="w-full px-4 py-2.5 border rounded-xl text-[13px] font-medium transition-colors hover:bg-[#E8EFEB]"
          style={{ borderColor: '#E5E0D4', color: '#1F4D3A' }}
        >
          Download CSV
        </button>

        <button
          onClick={() => {
            const featured = questions.find((q) => q.is_featured);
            if (featured) patchQuestion(featured.id, { is_featured: false });
          }}
          className="w-full px-4 py-2.5 border rounded-xl text-[13px] font-medium transition-colors hover:bg-red-50"
          style={{ borderColor: '#E5E0D4', color: '#B8423C' }}
        >
          End Q&amp;A
        </button>
      </div>
    </div>
  );
}
