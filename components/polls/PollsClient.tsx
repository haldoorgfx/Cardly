'use client';

import { useState, useEffect } from 'react';
import type { Poll, PollOption } from '@/types/database';

interface Props {
  eventId: string;
  registrationId: string | null;
  initialPolls: Poll[];
  myVotes: Record<string, string>;
}

function PollCard({ poll, eventId, registrationId, initialVote }: { poll: Poll; eventId: string; registrationId: string | null; initialVote: string | null }) {
  const [voted, setVoted] = useState<string | null>(initialVote);
  const [options, setOptions] = useState<PollOption[]>(poll.poll_options ?? []);
  const [voting, setVoting] = useState(false);

  const totalVotes = options.reduce((s, o) => s + o.votes_count, 0);

  const handleVote = async (optionId: string) => {
    if (!registrationId || voted || voting || poll.is_closed) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/polls`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poll_id: poll.id, option_id: optionId, registration_id: registrationId }),
      });
      const data = await res.json() as { options: { id: string; votes_count: number }[] };
      if (data.options) {
        setOptions(prev => prev.map(o => {
          const updated = data.options.find((d: { id: string; votes_count: number }) => d.id === o.id);
          return updated ? { ...o, votes_count: updated.votes_count } : o;
        }));
      }
      setVoted(optionId);
    } finally {
      setVoting(false);
    }
  };

  const showBars = !!voted || poll.is_closed;

  return (
    <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
      {poll.is_active && !poll.is_closed && (
        <div className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: '#E8C57E' }}>LIVE POLL</div>
      )}
      {poll.is_closed && (
        <div className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: '#6B7A72' }}>CLOSED</div>
      )}
      <p className="font-display font-normal text-[20px] mb-4" style={{ color: '#1F4D3A', letterSpacing: '-0.015em' }}>{poll.question}</p>

      <div className="space-y-2.5">
        {options.sort((a, b) => a.position - b.position).map(opt => {
          const pct = totalVotes > 0 ? Math.round((opt.votes_count / totalVotes) * 100) : 0;
          const isWinner = showBars && opt.votes_count === Math.max(...options.map(o => o.votes_count));
          return (
            <div key={opt.id}>
              {!showBars ? (
                <button
                  onClick={() => handleVote(opt.id)}
                  disabled={voting}
                  className="w-full text-left px-4 py-3.5 rounded-xl text-[15px] font-medium transition-all"
                  style={{ background: '#FAF6EE', border: `1.5px solid ${voted === opt.id ? '#1F4D3A' : '#E5E0D4'}`, color: '#0F1F18' }}
                >
                  {opt.text}
                </button>
              ) : (
                <div className="relative overflow-hidden rounded-xl" style={{ background: '#FAF6EE', border: `1.5px solid ${voted === opt.id ? '#1F4D3A' : '#E5E0D4'}` }}>
                  <div
                    className="absolute inset-0 rounded-xl transition-all"
                    style={{ width: `${pct}%`, background: isWinner ? 'rgba(31,77,58,0.12)' : 'rgba(31,77,58,0.06)', transitionDuration: '600ms' }}
                  />
                  <div className="relative flex items-center justify-between px-4 py-3.5">
                    <span className="text-[14px] font-medium" style={{ color: '#0F1F18' }}>{opt.text}</span>
                    <span className="font-mono text-[14px] font-semibold" style={{ color: isWinner ? '#1F4D3A' : '#6B7A72' }}>{pct}%</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="font-mono text-[12px] mt-3" style={{ color: '#6B7A72' }}>{totalVotes} response{totalVotes !== 1 ? 's' : ''}</p>
    </div>
  );
}

export default function PollsClient({ eventId, registrationId, initialPolls, myVotes }: Props) {
  const [polls, setPolls] = useState(initialPolls);

  // Auto-refresh active polls every 10s
  useEffect(() => {
    const hasActive = polls.some(p => p.is_active && !p.is_closed);
    if (!hasActive) return;
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/polls`);
        const data = await res.json() as { polls: Poll[] };
        if (data.polls) setPolls(data.polls);
      } catch {}
    }, 10000);
    return () => clearInterval(iv);
  }, [eventId, polls]);

  const active = polls.filter(p => p.is_active && !p.is_closed);
  const closed = polls.filter(p => p.is_closed || !p.is_active);

  if (polls.length === 0) {
    return (
      <div className="rounded-2xl py-16 text-center" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
        <p className="text-[14px]" style={{ color: '#6B7A72' }}>No live polls right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {active.map(poll => (
        <PollCard key={poll.id} poll={poll} eventId={eventId} registrationId={registrationId} initialVote={myVotes[poll.id] ?? null} />
      ))}
      {closed.length > 0 && active.length > 0 && (
        <div className="text-[12px] font-semibold uppercase tracking-wider pt-4 pb-1" style={{ color: '#6B7A72' }}>Past polls</div>
      )}
      {closed.map(poll => (
        <PollCard key={poll.id} poll={poll} eventId={eventId} registrationId={registrationId} initialVote={myVotes[poll.id] ?? null} />
      ))}
    </div>
  );
}
