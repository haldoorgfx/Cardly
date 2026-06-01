'use client';

import { useState, useEffect } from 'react';
import { Star, Check, X, Download } from 'lucide-react';
import type { QAQuestion } from '@/types/database';

type QAStatus = 'pending' | 'answered' | 'hidden';
type Tab = 'all' | QAStatus;

interface Props {
  eventId: string;
  initialQuestions: QAQuestion[];
  sessions: { id: string; title: string }[];
}

export default function QAModerationClient({ eventId, initialQuestions }: Props) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [tab, setTab] = useState<Tab>('all');
  const [acting, setActing] = useState<string | null>(null);

  // Auto-refresh every 15s
  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/q-and-a`);
        const data = await res.json() as { questions: QAQuestion[] };
        if (data.questions) setQuestions(data.questions);
      } catch {}
    }, 15000);
    return () => clearInterval(iv);
  }, [eventId]);

  const filtered = questions.filter(q => tab === 'all' || q.status === tab);
  const pendingCount = questions.filter(q => q.status === 'pending').length;
  const answeredCount = questions.filter(q => q.status === 'answered').length;

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

  const downloadCSV = () => {
    const rows = [['Question', 'Asker', 'Votes', 'Status', 'Time']];
    questions.forEach(q => {
      const name = q.is_anonymous ? 'Anonymous' : (q.registrations as { attendee_name: string } | null)?.attendee_name ?? 'Attendee';
      rows.push([q.question, name, String(q.upvotes_count), q.status, new Date(q.created_at).toLocaleString()]);
    });
    const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `qa-${eventId}.csv`;
    a.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      {/* Question queue */}
      <div>
        {/* Tabs */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1">
            {(['all', 'pending', 'answered', 'hidden'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                style={{ background: tab === t ? '#1F4D3A' : 'transparent', color: tab === t ? 'white' : '#6B7A72' }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <span className="font-mono text-[12px]" style={{ color: '#6B7A72' }}>{filtered.length} question{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl py-12 text-center" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
            <p className="text-[14px]" style={{ color: '#6B7A72' }}>No questions in this filter.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(q => (
              <div
                key={q.id}
                className="rounded-xl p-4 flex gap-3"
                style={{ background: 'white', border: `1px solid ${q.is_featured ? '#E8C57E' : '#E5E0D4'}`, opacity: q.status === 'hidden' ? 0.5 : 1 }}
              >
                <span className="font-mono text-[16px] font-semibold w-8 shrink-0 text-right" style={{ color: '#1F4D3A' }}>{q.upvotes_count}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px]" style={{ color: '#0F1F18' }}>{q.question}</p>
                  <p className="text-[12px] mt-1" style={{ color: '#6B7A72' }}>
                    {q.is_anonymous ? 'Anonymous' : (q.registrations as { attendee_name: string } | null)?.attendee_name ?? 'Attendee'} · {new Date(q.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => update(q.id, { is_featured: !q.is_featured })}
                    disabled={acting === q.id}
                    title="Feature"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ background: q.is_featured ? '#FEF3C7' : '#FAF6EE', color: q.is_featured ? '#E8C57E' : '#6B7A72' }}
                  >
                    <Star size={14} fill={q.is_featured ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => update(q.id, { status: q.status === 'answered' ? 'pending' : 'answered' })}
                    disabled={acting === q.id}
                    title="Answered"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ background: q.status === 'answered' ? '#E8EFEB' : '#FAF6EE', color: q.status === 'answered' ? '#1F4D3A' : '#6B7A72' }}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => update(q.id, { status: q.status === 'hidden' ? 'pending' : 'hidden' })}
                    disabled={acting === q.id}
                    title="Hide"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ background: q.status === 'hidden' ? '#FEE2E2' : '#FAF6EE', color: q.status === 'hidden' ? '#B8423C' : '#6B7A72' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats panel */}
      <div className="space-y-4">
        <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
          <h3 className="font-display font-medium text-[15px] mb-3" style={{ color: '#1F4D3A' }}>Stats</h3>
          {[
            { label: 'Total questions', value: questions.length },
            { label: 'Pending', value: pendingCount },
            { label: 'Answered', value: answeredCount },
          ].map(s => (
            <div key={s.label} className="flex justify-between py-2" style={{ borderBottom: '1px solid #F0EBE3' }}>
              <span className="text-[13px]" style={{ color: '#6B7A72' }}>{s.label}</span>
              <span className="font-mono text-[13px] font-medium" style={{ color: '#1F4D3A' }}>{s.value}</span>
            </div>
          ))}
        </div>
        <button
          onClick={downloadCSV}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium"
          style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
        >
          <Download size={14} /> Download CSV
        </button>
      </div>
    </div>
  );
}
