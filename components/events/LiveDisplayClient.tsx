'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronUp } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Question = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Poll = any;

interface Props {
  eventId: string;
  eventName: string;
  sessionLabel: string;
  initialQuestions: Question[];
  activePoll: Poll | null;
}

type Mode = 'qa' | 'poll' | 'social';

const MODES: { id: Mode; label: string }[] = [
  { id: 'qa',     label: 'Q&A Wall' },
  { id: 'poll',   label: 'Poll Results' },
  { id: 'social', label: 'Social Wall' },
];

function useLiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    function tick() {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function LiveDisplayClient({ eventId, sessionLabel, initialQuestions, activePoll }: Props) {
  const [mode, setMode] = useState<Mode>('qa');
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const time = useLiveClock();

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/events/${eventId}/live/questions`);
    if (res.ok) {
      const data = await res.json();
      setQuestions(data);
    }
  }, [eventId]);

  // Auto-refresh every 15s
  useEffect(() => {
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, [refresh]);

  const top4 = questions.slice(0, 4);

  return (
    <div className="fixed inset-0 overflow-hidden flex flex-col" style={{ background: 'linear-gradient(135deg, #0F1F18 0%, #1F4D3A 60%, #163828 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-4">
          <div className="font-display font-bold text-[22px]" style={{ color: '#FAF6EE', letterSpacing: '-0.02em' }}>
            eventera
          </div>
          <div className="h-5 w-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <div className="text-[13px] font-semibold tracking-[0.12em] uppercase" style={{ color: '#E8C57E', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {mode === 'qa' ? 'LIVE Q&A' : mode === 'poll' ? 'POLL RESULTS' : 'SOCIAL WALL'} · {sessionLabel}
          </div>
        </div>
        <div className="text-[28px] font-display font-bold tabular-nums" style={{ color: '#FAF6EE', letterSpacing: '-0.02em' }}>
          {time}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden p-8">
        {mode === 'qa' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {top4.length === 0 ? (
              <div className="col-span-2 flex flex-col items-center justify-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <div className="text-[20px] mb-2">No questions yet</div>
                <div className="text-[14px]">Ask attendees to submit questions</div>
              </div>
            ) : (
              top4.map((q: Question, i: number) => (
                <div key={q.id} className="rounded-2xl p-6 flex flex-col justify-between"
                  style={{
                    background: i === 0 ? 'rgba(232,197,126,0.12)' : 'rgba(255,255,255,0.05)',
                    border: i === 0 ? '1px solid rgba(232,197,126,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  }}>
                  <p className="font-display font-semibold leading-snug mb-4"
                    style={{ fontSize: i === 0 ? 24 : 20, color: '#FAF6EE', letterSpacing: '-0.01em' }}>
                    {q.question}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      {q.asker_name && (
                        <div className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                          {q.asker_name}
                          {q.asker_affiliation && <span style={{ color: 'rgba(255,255,255,0.4)' }}> · {q.asker_affiliation}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                      style={{ background: i === 0 ? 'rgba(232,197,126,0.2)' : 'rgba(255,255,255,0.08)' }}>
                      <ChevronUp size={14} style={{ color: i === 0 ? '#E8C57E' : 'rgba(255,255,255,0.5)' }} />
                      <span className="text-[14px] font-bold tabular-nums" style={{ color: i === 0 ? '#E8C57E' : '#FAF6EE' }}>
                        {q.votes ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {mode === 'poll' && activePoll && (
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display font-semibold text-[28px] mb-8" style={{ color: '#FAF6EE', letterSpacing: '-0.02em' }}>
              {activePoll.question}
            </h2>
            {(activePoll.options ?? []).map((opt: { label: string; votes: number }, i: number) => {
              const total = (activePoll.options ?? []).reduce((s: number, o: { votes: number }) => s + (o.votes ?? 0), 0);
              const pct = total > 0 ? Math.round(((opt.votes ?? 0) / total) * 100) : 0;
              return (
                <div key={i} className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[18px] font-medium" style={{ color: '#FAF6EE' }}>{opt.label}</span>
                    <span className="text-[18px] font-bold tabular-nums" style={{ color: '#E8C57E' }}>{pct}%</span>
                  </div>
                  <div className="rounded-full overflow-hidden" style={{ height: 12, background: 'rgba(255,255,255,0.1)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #E8C57E, #C9A45E)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {mode === 'poll' && !activePoll && (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <div className="text-[20px]">No active poll</div>
          </div>
        )}

        {mode === 'social' && (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <div className="text-[20px] mb-2">Social Wall</div>
            <div className="text-[14px]">Post approved event photos appear here</div>
          </div>
        )}
      </div>

      {/* Footer with CTA + mode switcher */}
      <div className="shrink-0 px-8 pb-6 flex items-end justify-between">
        <div className="rounded-2xl px-5 py-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-[12px] mb-0.5" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.08em' }}>
            SUBMIT YOUR QUESTION
          </div>
          <div className="text-[20px] font-display font-bold" style={{ color: '#E8C57E' }}>
            karta.app/q
          </div>
        </div>
        <div className="flex gap-2">
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className="px-4 py-2 rounded-xl text-[12px] font-semibold transition"
              style={{
                background: mode === m.id ? 'rgba(232,197,126,0.2)' : 'rgba(255,255,255,0.06)',
                color: mode === m.id ? '#E8C57E' : 'rgba(255,255,255,0.5)',
                border: mode === m.id ? '1px solid rgba(232,197,126,0.3)' : '1px solid rgba(255,255,255,0.08)',
              }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
