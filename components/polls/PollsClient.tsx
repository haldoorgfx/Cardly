'use client';

import { useState, useEffect } from 'react';

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  votes_count: number;
  position: number;
}

export interface Poll {
  id: string;
  event_id: string;
  question: string;
  is_active: boolean;
  is_closed: boolean;
  total_votes: number;
  created_at: string;
  options: PollOption[];
}

interface Props {
  eventId: string;
  registrationId: string | null;
  initialPolls: Poll[];
  myVotes: Record<string, string>; // poll_id → option_id
}

export default function PollsClient({ eventId, registrationId, initialPolls, myVotes: initialMyVotes }: Props) {
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [myVotes, setMyVotes] = useState<Record<string, string>>(initialMyVotes);
  const [voting, setVoting] = useState<string | null>(null); // poll_id being voted on

  const activePolls = polls.filter((p) => p.is_active && !p.is_closed);
  const closedPolls = polls.filter((p) => p.is_closed || !p.is_active);

  // Auto-refresh if active polls exist
  useEffect(() => {
    if (activePolls.length === 0) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/polls`);
        if (res.ok) {
          const data = await res.json();
          setPolls(data.polls ?? []);
        }
      } catch { /* no-op */ }
    }, 10000);
    return () => clearInterval(id);
  }, [eventId, activePolls.length]);

  async function handleVote(pollId: string, optionId: string) {
    if (!registrationId || voting === pollId) return;
    setVoting(pollId);

    // Optimistic update
    const prevVote = myVotes[pollId];
    setMyVotes((prev) => ({ ...prev, [pollId]: optionId }));
    setPolls((prev) =>
      prev.map((p) => {
        if (p.id !== pollId) return p;
        const opts = p.options.map((o) => {
          let delta = 0;
          if (o.id === optionId) delta += 1;
          if (prevVote && o.id === prevVote) delta -= 1;
          return { ...o, votes_count: o.votes_count + delta };
        });
        return { ...p, options: opts, total_votes: p.total_votes + (prevVote ? 0 : 1) };
      })
    );

    try {
      await fetch(`/api/events/${eventId}/polls`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poll_id: pollId, option_id: optionId, registration_id: registrationId }),
      });
    } catch {
      // revert
      setMyVotes((prev) => {
        const next = { ...prev };
        if (prevVote) next[pollId] = prevVote; else delete next[pollId];
        return next;
      });
    } finally {
      setVoting(null);
    }
  }

  function PollCard({ poll, showBadge }: { poll: Poll; showBadge: boolean }) {
    const voted = myVotes[poll.id];
    const maxVotes = Math.max(...poll.options.map((o) => o.votes_count), 1);

    return (
      <div
        className="bg-white border rounded-2xl p-5 mb-4"
        style={{ borderColor: '#E5E0D4' }}
      >
        {showBadge && (
          <p
            className="text-[10px] font-medium uppercase tracking-widest mb-2"
            style={{ color: '#E8C57E' }}
          >
            Live Poll
          </p>
        )}

        <p
          className="font-display font-normal mb-4"
          style={{ fontSize: 22, color: '#1F4D3A' }}
        >
          {poll.question}
        </p>

        {/* Options */}
        <div className="space-y-2.5">
          {poll.options
            .sort((a, b) => a.position - b.position)
            .map((option) => {
              const pct = poll.total_votes > 0 ? Math.round((option.votes_count / poll.total_votes) * 100) : 0;
              const isVoted = voted === option.id;
              const isWinner = option.votes_count === maxVotes && poll.total_votes > 0;

              if (voted || !registrationId || poll.is_closed) {
                // Show result bar
                return (
                  <div key={option.id} className="space-y-1">
                    <div className="flex items-center justify-between text-[13px]">
                      <span
                        className={isWinner ? 'font-medium' : ''}
                        style={{ color: '#0F1F18' }}
                      >
                        {option.text}
                        {isVoted && (
                          <span className="ml-1.5 font-mono text-[11px]" style={{ color: '#2D7A4F' }}>
                            ✓ your vote
                          </span>
                        )}
                      </span>
                      <span
                        className="font-mono font-medium"
                        style={{ color: '#1F4D3A', fontSize: 14 }}
                      >
                        {pct}%
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: '#FAF6EE' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: isVoted ? '#1F4D3A' : '#2A6A50',
                        }}
                      />
                    </div>
                  </div>
                );
              }

              // Voting button
              return (
                <button
                  key={option.id}
                  onClick={() => handleVote(poll.id, option.id)}
                  disabled={voting === poll.id}
                  className="w-full h-14 px-4 border rounded-xl text-left text-[14px] transition-colors disabled:opacity-60 hover:border-[#1F4D3A]"
                  style={{
                    background: '#FAF6EE',
                    borderColor: '#E5E0D4',
                    color: '#0F1F18',
                  }}
                >
                  {option.text}
                </button>
              );
            })}
        </div>

        {/* Response count */}
        <p className="mt-3 font-mono text-[12px]" style={{ color: '#6B7A72' }}>
          {poll.total_votes} {poll.total_votes === 1 ? 'response' : 'responses'}
          {poll.is_closed && ' · Closed'}
        </p>
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px]" style={{ color: '#6B7A72' }}>
          No live polls right now.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Active polls */}
      {activePolls.length === 0 ? (
        <div className="py-10 text-center mb-6">
          <p className="text-[14px]" style={{ color: '#6B7A72' }}>
            No live polls right now.
          </p>
        </div>
      ) : (
        activePolls.map((p) => <PollCard key={p.id} poll={p} showBadge />)
      )}

      {/* Past polls */}
      {closedPolls.length > 0 && (
        <div className="mt-8">
          <h3
            className="text-[12px] font-medium uppercase tracking-wider mb-4"
            style={{ color: '#6B7A72' }}
          >
            Past polls
          </h3>
          {closedPolls.map((p) => (
            <PollCard key={p.id} poll={p} showBadge={false} />
          ))}
        </div>
      )}
    </div>
  );
}
