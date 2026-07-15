'use client';

import { useState } from 'react';
import { Plus, X, Radio, XCircle } from 'lucide-react';
import type { Poll, PollOption } from '@/types/database';
import { Modal } from '@/components/ui/Modal';

interface Props {
  eventId: string;
  initialPolls: Poll[];
}

const INPUT = 'w-full rounded-lg px-3 py-2.5 text-[14px] outline-none';
const INPUT_STYLE = { background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' };

export default function PollsManagerClient({ eventId, initialPolls }: Props) {
  const [polls, setPolls] = useState(initialPolls);
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [launchNow, setLaunchNow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const addOption = () => { if (options.length < 6) setOptions(o => [...o, '']); };
  const removeOption = (i: number) => setOptions(o => o.filter((_, idx) => idx !== i));
  const setOption = (i: number, val: string) => setOptions(o => o.map((v, idx) => idx === i ? val : v));

  const handleCreate = async () => {
    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), options: validOptions, is_active: launchNow }),
      });
      const data = await res.json() as { poll: Poll };
      if (data.poll) {
        setPolls(p => [{ ...data.poll, poll_options: validOptions.map((text, i) => ({ id: `tmp${i}`, poll_id: data.poll.id, text, votes_count: 0, position: i })) }, ...p]);
        setShowForm(false);
        setQuestion('');
        setOptions(['', '']);
        setLaunchNow(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (pollId: string, key: 'is_active' | 'is_closed', val: boolean) => {
    setActing(pollId);
    try {
      const res = await fetch(`/api/events/${eventId}/polls`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, [key]: val }),
      });
      const data = await res.json() as { poll: Poll };
      if (data.poll) setPolls(prev => prev.map(p => p.id === pollId ? { ...p, ...data.poll } : p));
    } finally {
      setActing(null);
    }
  };

  return (
    <div>
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium mb-6"
          style={{ background: '#1F4D3A', color: 'white' }}
        >
          <Plus size={15} /> Create poll
        </button>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New poll"
        footer={
          <>
            <button onClick={() => setShowForm(false)} className="h-10 px-4 rounded-xl text-[13px] font-medium border" style={{ borderColor: '#E5E0D4', color: '#65736B' }}>Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="h-10 px-5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-60" style={{ background: '#1F4D3A' }}>
              {saving ? 'Creating…' : 'Create poll'}
            </button>
          </>
        }
      >
        <div className="mb-4">
          <label className="block text-[12px] mb-1.5" style={{ color: '#65736B' }}>Question *</label>
          <input className={INPUT} style={INPUT_STYLE} placeholder="What topic resonates most?" value={question} onChange={e => setQuestion(e.target.value)} />
        </div>
        <div className="mb-4 space-y-2">
          <label className="block text-[12px] mb-1.5" style={{ color: '#65736B' }}>Options (2–6)</label>
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input className={`${INPUT} flex-1`} style={INPUT_STYLE} placeholder={`Option ${i + 1}`} value={opt} onChange={e => setOption(i, e.target.value)} />
              {options.length > 2 && (
                <button onClick={() => removeOption(i)} className="p-2 rounded-lg" style={{ color: '#B8423C' }}><XCircle size={16} /></button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <button onClick={addOption} className="text-[13px] flex items-center gap-1 mt-1" style={{ color: '#1F4D3A' }}>
              <Plus size={13} /> Add option
            </button>
          )}
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <div className="w-9 h-5 rounded-full transition-colors" style={{ background: launchNow ? '#1F4D3A' : '#E5E0D4' }} onClick={() => setLaunchNow(v => !v)}>
            <div className="w-4 h-4 rounded-full bg-white m-0.5 transition-transform" style={{ transform: launchNow ? 'translateX(16px)' : 'none' }} />
          </div>
          <span className="text-[13px]" style={{ color: '#65736B' }}>Launch immediately</span>
        </label>
      </Modal>

      {polls.length === 0 ? (
        <div className="rounded-2xl py-16 text-center" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
          <p className="text-[14px]" style={{ color: '#65736B' }}>No polls yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {polls.map(poll => {
            const totalVotes = (poll.poll_options ?? []).reduce((s: number, o: PollOption) => s + o.votes_count, 0);
            return (
              <div key={poll.id} className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {poll.is_active && !poll.is_closed && <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#E8C57E' }}>LIVE</span>}
                      {poll.is_closed && <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#65736B' }}>CLOSED</span>}
                    </div>
                    <p className="font-display font-medium text-[15px]" style={{ color: '#0F1F18' }}>{poll.question}</p>
                    <p className=" text-[12px] mt-1" style={{ color: '#65736B' }}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!poll.is_closed && (
                      <button
                        onClick={() => toggle(poll.id, 'is_active', !poll.is_active)}
                        disabled={acting === poll.id}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-medium"
                        style={{ background: poll.is_active ? 'rgba(201,122,45,0.12)' : '#E8EFEB', color: poll.is_active ? '#C97A2D' : '#1F4D3A' }}
                      >
                        <Radio size={12} className="inline mr-1" />{poll.is_active ? 'Pause' : 'Launch'}
                      </button>
                    )}
                    {!poll.is_closed && (
                      <button
                        onClick={() => toggle(poll.id, 'is_closed', true)}
                        disabled={acting === poll.id}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-medium"
                        style={{ background: 'rgba(184,66,60,0.10)', color: '#B8423C' }}
                      >
                        <X size={12} className="inline mr-1" />Close
                      </button>
                    )}
                  </div>
                </div>
                {(poll.poll_options ?? []).sort((a: PollOption, b: PollOption) => a.position - b.position).map((opt: PollOption) => {
                  const pct = totalVotes > 0 ? Math.round((opt.votes_count / totalVotes) * 100) : 0;
                  return (
                    <div key={opt.id} className="flex items-center gap-3 mb-1.5">
                      <div className="text-[13px] min-w-[100px] truncate" style={{ color: '#3A4A42' }}>{opt.text}</div>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E0D4' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#1F4D3A' }} />
                      </div>
                      <span className=" text-[12px] w-10 text-right" style={{ color: '#65736B' }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
