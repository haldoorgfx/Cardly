'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Attendee = any;

interface Props {
  eventName: string;
  eventSlug: string;
  attendees: Attendee[];
}

type Stage = 'lobby' | 'round' | 'between';

const DEMO_ATTENDEES: Attendee[] = [
  { id: '1', attendee_name: 'Samuel Okoro' },
  { id: '2', attendee_name: 'Mariam Diallo' },
  { id: '3', attendee_name: 'Leila Hassan' },
  { id: '4', attendee_name: 'Kwame Asante' },
  { id: '5', attendee_name: 'Fatima Balde' },
];

const ICEBREAKERS = [
  'You both work on payments infrastructure — what\'s the one thing about cross-border rails you\'d fix tomorrow?',
  'What\'s the biggest misconception people in your industry have about what you actually do?',
  'If you could only bring one thing from your current project to a new company, what would it be?',
  'What\'s a trend in your space that excites you and one that worries you?',
];

const ROUND_SECONDS = 5 * 60;

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export function SpeedNetworkingClient({ eventName, eventSlug, attendees: dbAttendees }: Props) {
  const attendees = dbAttendees.length >= 2 ? dbAttendees : DEMO_ATTENDEES;
  const [stage, setStage] = useState<Stage>('lobby');
  const [roundIdx, setRoundIdx] = useState(0);
  const [matchIdx, setMatchIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [betweenSeconds, setBetweenSeconds] = useState(30);
  const [exchanged, setExchanged] = useState(0);

  const totalRounds = Math.min(4, Math.floor(attendees.length / 2));
  const currentMatch = attendees[matchIdx % attendees.length];
  const nextMatch = attendees[(matchIdx + 1) % attendees.length];
  const icebreaker = ICEBREAKERS[roundIdx % ICEBREAKERS.length];

  useEffect(() => {
    if (stage !== 'round') return;
    const t = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(t);
          setBetweenSeconds(30);
          setStage('between');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [stage, roundIdx]);

  useEffect(() => {
    if (stage !== 'between') return;
    const t = setInterval(() => {
      setBetweenSeconds(s => {
        if (s <= 1) { clearInterval(t); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [stage]);

  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const secs = (secondsLeft % 60).toString().padStart(2, '0');
  const warn = secondsLeft < 60;

  function startRound() {
    setSecondsLeft(ROUND_SECONDS);
    setStage('round');
  }

  function nextRound() {
    if (roundIdx + 1 >= totalRounds) {
      setStage('lobby');
      setRoundIdx(0);
      setMatchIdx(0);
      return;
    }
    setRoundIdx(r => r + 1);
    setMatchIdx(m => m + 1);
    setSecondsLeft(ROUND_SECONDS);
    setStage('round');
  }

  function confirmMove() {
    setRoundIdx(r => r + 1);
    setMatchIdx(m => m + 1);
    setSecondsLeft(ROUND_SECONDS);
    setStage('round');
  }

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center gap-3" style={{ background: '#FFFFFF', borderColor: '#E5E0D4' }}>
        <Link href={`/e/${eventSlug}`} className="flex items-center gap-1.5 text-[13px] transition hover:opacity-70"
          style={{ color: '#6B7A72', textDecoration: 'none' }}>
          <ArrowLeft size={15} /> {eventName}
        </Link>
      </div>

      <div className="max-w-sm mx-auto px-5 py-10">

        {/* LOBBY */}
        {stage === 'lobby' && (
          <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <h1 className="font-display font-bold text-[22px] mb-2" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
              Speed networking
            </h1>
            <p className="text-[13px] mb-5" style={{ color: '#6B7A72', lineHeight: 1.5 }}>
              {attendees.length} people checked in · {totalRounds} rounds × 5 minutes · pairs by shared interests. Stay near the gold lounge.
            </p>

            {/* Avatar stack */}
            <div className="flex items-center mb-5">
              {attendees.slice(0, 5).map((a: Attendee, i: number) => (
                <div key={a.id}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold"
                  style={{
                    background: `hsl(${140 + i * 20},35%,38%)`,
                    color: '#FAF6EE',
                    border: '2px solid #FAF6EE',
                    marginLeft: i > 0 ? -12 : 0,
                    zIndex: 5 - i,
                    position: 'relative',
                  }}>
                  {initials(a.attendee_name)}
                </div>
              ))}
              {attendees.length > 5 && (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-semibold"
                  style={{ background: '#E8EFEB', color: '#1F4D3A', border: '2px solid #FAF6EE', marginLeft: -12, position: 'relative', zIndex: 0 }}>
                  +{attendees.length - 5}
                </div>
              )}
            </div>

            <button onClick={startRound}
              className="w-full py-3.5 rounded-xl text-[14px] font-semibold transition hover:opacity-90"
              style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
              I&rsquo;m here — pair me
            </button>
          </div>
        )}

        {/* LIVE ROUND */}
        {stage === 'round' && (
          <div className="rounded-2xl overflow-hidden relative"
            style={{ background: '#0F1F18' }}>
            {/* Mesh bg */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse at 20% 25%, rgba(31,77,58,0.85), transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(232,197,126,0.14), transparent 60%)',
            }} />

            <div className="relative p-6">
              {/* Top row */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-[11px] font-bold tracking-widest" style={{ color: '#E8C57E' }}>
                  ROUND {roundIdx + 1} OF {totalRounds} · TABLE {roundIdx + 1}
                </span>
                <span className={` font-bold text-[38px] leading-none ${warn ? 'text-[#E8C57E]' : 'text-white'}`}>
                  {mins}:{secs}
                </span>
              </div>

              {/* Match */}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-[22px] shrink-0"
                  style={{ background: 'linear-gradient(135deg,#1F4D3A,#2A6A50)', color: '#E8C57E', border: '3px solid #E8C57E' }}>
                  {initials(currentMatch.attendee_name)}
                </div>
                <div>
                  <div className="font-display font-semibold text-[20px]" style={{ color: '#FAF6EE' }}>
                    {currentMatch.attendee_name}
                  </div>
                  <div className="text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    91% match
                  </div>
                </div>
              </div>

              {/* Icebreaker */}
              <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: '#E8C57E' }}>ICEBREAKER</div>
                <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.88)', lineHeight: 1.5 }}>{icebreaker}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button onClick={() => { setExchanged(e => e + 1); nextRound(); }}
                  className="w-full py-3 rounded-xl text-[14px] font-semibold transition hover:opacity-90"
                  style={{ background: '#E8C57E', color: '#0F1F18' }}>
                  Exchange contacts
                </button>
                <button onClick={nextRound}
                  className="w-full py-3 rounded-xl text-[13px] font-medium transition hover:opacity-80"
                  style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.3)' }}>
                  Skip to next round
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BETWEEN ROUNDS */}
        {stage === 'between' && (
          <div className="rounded-2xl p-6 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <h2 className="font-display font-bold text-[20px] mb-2" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
              Round {roundIdx + 1} done — move tables
            </h2>
            <p className="text-[13px] mb-5" style={{ color: '#6B7A72', lineHeight: 1.5 }}>
              Next round starts in <strong className="">0:{betweenSeconds.toString().padStart(2, '0')}</strong> ·
              you&rsquo;ve exchanged contacts with <strong>{exchanged}</strong> of {roundIdx + 1} matches so far
            </p>

            {/* Next pair preview */}
            <div className="inline-flex items-center gap-2.5 px-4 py-3 rounded-full mb-5"
              style={{ background: '#E8EFEB', border: '1px solid #C9E0D4' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg,#1F4D3A,#2A6A50)', color: '#FAF6EE' }}>
                {initials(nextMatch.attendee_name)}
              </div>
              <span className="font-display font-semibold text-[14px]" style={{ color: '#1F4D3A' }}>
                Next: {nextMatch.attendee_name}
              </span>
              <span className="text-[12px] ml-auto" style={{ color: '#6B7A72' }}>
                Table {roundIdx + 2}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <button onClick={confirmMove}
                className="w-full py-3 rounded-xl text-[14px] font-semibold transition hover:opacity-90"
                style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
                I&rsquo;m at table {roundIdx + 2}
              </button>
              <Link href={`/e/${eventSlug}`}
                className="block w-full py-3 rounded-xl text-[13px] font-medium border text-center transition hover:opacity-80"
                style={{ borderColor: '#1F4D3A', color: '#1F4D3A', textDecoration: 'none' }}>
                Leave the rotation
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
