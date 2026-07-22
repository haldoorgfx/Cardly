'use client';

import { useState, useEffect } from 'react';
import { Star, Check, X, Download, Plus } from 'lucide-react';
import type { QAQuestion } from '@/types/database';
import { escapeCsvCell } from '@/lib/csv';

type QAStatus = 'pending' | 'answered' | 'hidden';
type FilterTab = 'all' | QAStatus;

interface Poll {
  id: string;
  question: string;
  is_active: boolean;
  is_closed: boolean;
  poll_options?: { id: string; text: string; votes_count: number; position: number }[];
}

interface Props {
  eventId: string;
  eventSlug: string;
  initialQuestions: QAQuestion[];
  sessions: { id: string; title: string }[];
  initialPolls?: Poll[];
}

export default function QAModerationClient({ eventId, eventSlug, initialQuestions, initialPolls = [] }: Props) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [polls, setPolls] = useState(initialPolls);
  const [tab, setTab] = useState<FilterTab>('all');
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/q-and-a`);
        const data = await res.json() as { questions: QAQuestion[] };
        if (data.questions) setQuestions(data.questions);
      } catch {}
      try {
        const res = await fetch(`/api/events/${eventId}/polls?active=true`);
        const data = await res.json() as { polls: Poll[] };
        if (data.polls) setPolls(prev => {
          // Refresh vote counts on active polls; keep any already-closed ones as-is.
          const activeIds = new Set(data.polls.map(p => p.id));
          const untouched = prev.filter(p => !activeIds.has(p.id));
          return [...data.polls, ...untouched];
        });
      } catch {}
    }, 15000);
    return () => clearInterval(iv);
  }, [eventId]);

  const filtered = questions.filter(q => tab === 'all' || q.status === tab);
  const pendingCount = questions.filter(q => q.status === 'pending').length;
  const answeredCount = questions.filter(q => q.status === 'answered').length;
  const hiddenCount = questions.filter(q => q.status === 'hidden').length;

  const activePoll = polls.find(p => p.is_active && !p.is_closed);

  const update = async (qId: string, updates: { status?: QAStatus; is_featured?: boolean }) => {
    setActing(qId);
    try {
      const res = await fetch(`/api/events/${eventId}/q-and-a`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: qId, ...updates }),
      });
      const data = await res.json() as { question: QAQuestion };
      if (data.question) setQuestions(prev => prev.map(q => q.id === qId ? data.question : q));
    } finally {
      setActing(null);
    }
  };

  const closePoll = async (pollId: string) => {
    try {
      await fetch(`/api/events/${eventId}/polls`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, is_closed: true }),
      });
      setPolls(prev => prev.map(p => p.id === pollId ? { ...p, is_closed: true } : p));
    } catch {}
  };

  const downloadCSV = () => {
    const rows = [['Question', 'Asker', 'Votes', 'Status', 'Time']];
    questions.forEach(q => {
      const name = q.is_anonymous ? 'Anonymous' : (q.registrations as { attendee_name: string } | null)?.attendee_name ?? 'Attendee';
      rows.push([q.question, name, String(q.upvotes_count), q.status, new Date(q.created_at).toLocaleString()]);
    });
    const csv = rows.map(r => r.map(v => escapeCsvCell(v)).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `qa-${eventId}.csv`;
    a.click();
  };

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: questions.length },
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'answered', label: 'Answered', count: answeredCount },
    { key: 'hidden', label: 'Hidden', count: hiddenCount },
  ];

  return (
    <div
      className="flex flex-col lg:grid"
      style={{
        gridTemplateColumns: '440px 1fr',
        minHeight: 480,
        border: '1px solid #E5E0D4',
        borderRadius: 16,
        overflow: 'hidden',
        background: 'white',
      }}
    >
      {/* ── Left: Question queue ── */}
      <aside className="max-h-[50vh] lg:max-h-full" style={{ borderRight: '1px solid #E5E0D4', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Queue header */}
        <div className="px-6 pt-5 pb-3 shrink-0">
          <div className="font-display font-medium text-[18px]" style={{ color: '#0F1F18' }}>Q&amp;A Moderation</div>
          <div className=" text-[12px] mt-1" style={{ color: '#65736B' }}>
            {questions.length} question{questions.length !== 1 ? 's' : ''} · sorted by votes
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-5 pb-3 shrink-0" style={{ borderBottom: '1px solid #E5E0D4' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
              style={{
                background: tab === t.key ? '#E8EFEB' : 'transparent',
                color: tab === t.key ? '#1F4D3A' : '#65736B',
              }}
            >
              {t.label}
              {t.count > 0 && t.key !== 'all' && (
                <span className="ml-1.5  text-[11px] opacity-70">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Scrollable question list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-[13px]" style={{ color: '#65736B' }}>No questions in this filter.</p>
            </div>
          ) : (
            filtered.map(q => {
              const asker = q.is_anonymous
                ? 'Anonymous'
                : (q.registrations as { attendee_name: string } | null)?.attendee_name ?? 'Attendee';
              const timeAgo = (() => {
                const diff = Date.now() - new Date(q.created_at).getTime();
                const mins = Math.floor(diff / 60000);
                return mins < 1 ? 'just now' : `${mins}m ago`;
              })();
              return (
                <div
                  key={q.id}
                  className="rounded-xl p-4"
                  style={{
                    border: `1px solid ${q.is_featured ? '#E8C57E' : '#E5E0D4'}`,
                    background: '#FAF6EE',
                    opacity: q.status === 'hidden' ? 0.5 : 1,
                  }}
                >
                  <div className="flex gap-3">
                    {/* Vote count */}
                    <span
                      className=" font-semibold text-[17px] w-7 text-right shrink-0 pt-0.5"
                      style={{ color: '#0F1F18' }}
                    >
                      {q.upvotes_count}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] leading-snug" style={{ color: '#0F1F18' }}>{q.question}</p>
                      <p className="text-[12px] mt-1.5" style={{ color: '#65736B' }}>
                        {asker} · {timeAgo}
                      </p>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 mt-2.5">
                        {/* Feature / un-feature */}
                        <button
                          onClick={() => update(q.id, { is_featured: !q.is_featured })}
                          disabled={acting === q.id}
                          title="Feature"
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{
                            background: q.is_featured ? '#E8C57E' : 'white',
                            border: `1px solid ${q.is_featured ? '#E8C57E' : '#E5E0D4'}`,
                            color: q.is_featured ? '#0F1F18' : '#65736B',
                          }}
                        >
                          <Star size={13} fill={q.is_featured ? 'currentColor' : 'none'} />
                        </button>

                        {/* Mark answered */}
                        <button
                          onClick={() => update(q.id, { status: q.status === 'answered' ? 'pending' : 'answered' })}
                          disabled={acting === q.id}
                          title="Answered"
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{
                            background: q.status === 'answered' ? '#1F4D3A' : 'white',
                            border: `1px solid ${q.status === 'answered' ? '#1F4D3A' : '#E5E0D4'}`,
                            color: q.status === 'answered' ? 'white' : '#65736B',
                          }}
                        >
                          <Check size={13} />
                        </button>

                        {/* Hide */}
                        <button
                          onClick={() => update(q.id, { status: q.status === 'hidden' ? 'pending' : 'hidden' })}
                          disabled={acting === q.id}
                          title={q.status === 'hidden' ? 'Restore' : 'Hide'}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{
                            background: q.status === 'hidden' ? 'rgba(184,66,60,0.10)' : 'white',
                            border: `1px solid ${q.status === 'hidden' ? 'rgba(184,66,60,0.3)' : '#E5E0D4'}`,
                            color: q.status === 'hidden' ? '#B8423C' : '#65736B',
                          }}
                        >
                          <X size={13} />
                        </button>

                        {q.status === 'answered' && (
                          <span
                            className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                            style={{ background: '#E8EFEB', color: '#1F4D3A' }}
                          >
                            <Check size={9} strokeWidth={2.5} /> Answered
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Right: Status panel ── */}
      <section className="overflow-y-auto p-8" style={{ background: '#FAF6EE' }}>
        {/* Live indicator */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{
              background: '#1F4D3A',
              boxShadow: '0 0 0 3px rgba(31,77,58,0.2)',
              animation: 'pulse 1.4s infinite',
            }}
          />
          <span className="font-display font-medium text-[16px]" style={{ color: '#1F4D3A' }}>
            Session live
          </span>
        </div>
        <div className=" text-[13px] mb-6" style={{ color: '#65736B' }}>
          {questions.length} questions · {pendingCount} pending
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Total', value: questions.length },
            { label: 'Pending', value: pendingCount },
            { label: 'Answered', value: answeredCount },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-xl p-4 text-center"
              style={{ background: 'white', border: '1px solid #E5E0D4' }}
            >
              <div className=" font-semibold text-[24px]" style={{ color: '#0F1F18' }}>{s.value}</div>
              <div className="text-[12px] mt-1" style={{ color: '#65736B' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Active poll card */}
        {activePoll && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
            <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#E8C57E' }}>
              ● Active poll
            </div>
            <div className="font-display font-medium text-[15px] mb-4" style={{ color: '#0F1F18' }}>
              {activePoll.question}
            </div>
            <div className="space-y-2.5">
              {(activePoll.poll_options ?? [])
                .sort((a, b) => a.position - b.position)
                .map(opt => {
                  const total = (activePoll.poll_options ?? []).reduce((s, o) => s + o.votes_count, 0);
                  const pct = total > 0 ? Math.round((opt.votes_count / total) * 100) : 0;
                  return (
                    <div key={opt.id}>
                      <div className="flex justify-between text-[12px] mb-1" style={{ color: '#3A4A42' }}>
                        <span>{opt.text}</span>
                        <span className=" font-medium" style={{ color: '#0F1F18' }}>{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E8EFEB' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: '#1F4D3A' }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
            <button
              onClick={() => closePoll(activePoll.id)}
              className="mt-4 px-4 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
              style={{ background: '#E8EFEB', color: '#1F4D3A' }}
            >
              Close poll
            </button>
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-2.5">
          <a
            href={`/events/${eventSlug}/polls`}
            className="flex items-center gap-2 justify-center w-full py-3 rounded-xl text-[13px] font-medium"
            style={{ background: '#1F4D3A', color: 'white' }}
          >
            <Plus size={14} /> Launch new poll
          </a>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 justify-center w-full py-2.5 rounded-xl text-[13px] font-medium"
            style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
          >
            <Download size={14} /> Download questions CSV
          </button>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(31,77,58,0.4); }
            50% { box-shadow: 0 0 0 6px rgba(31,77,58,0); }
          }
        `}</style>
      </section>
    </div>
  );
}
