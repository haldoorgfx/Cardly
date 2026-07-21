'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronUp, AlertTriangle } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Question = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Poll = any;

interface Props {
  eventId: string;
  eventName: string;
  sessionLabel: string;
  /** IANA zone of the EVENT, so the venue clock never follows the driving laptop. */
  eventTimezone: string;
  /** Real, domain-derived link attendees use to submit a question. */
  submitUrl: string;
  initialQuestions: Question[];
  activePoll: Poll | null;
}

type Mode = 'qa' | 'poll';

const MODES: { id: Mode; label: string }[] = [
  { id: 'qa',     label: 'Q&A Wall' },
  { id: 'poll',   label: 'Poll Results' },
];

const REFRESH_MS = 15_000;
/** After this long with no successful refresh, the screen must say so out loud. */
const STALE_AFTER_MS = 60_000;
const MODERATED_KEY = 'eventera:live:moderated';

/**
 * Wall clock in the event's own time zone.
 *
 * `toLocaleTimeString()` with no zone renders in the time zone of whatever
 * machine is plugged into the projector, which is wrong the moment the event is
 * run from a travelling laptop.
 */
function useLiveClock(timeZone: string) {
  const [time, setTime] = useState('');
  useEffect(() => {
    let fmt: Intl.DateTimeFormat;
    try {
      fmt = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timeZone || 'UTC',
      });
    } catch {
      // A bad/unknown zone string must not throw and blank the whole display.
      fmt = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timeZone]);
  return time;
}

/**
 * Keep the projector awake. An unattended display that lets the laptop sleep
 * shows a black screen to the room. Best-effort: unsupported browsers and
 * rejected requests are ignored, and the lock is re-acquired after the OS drops
 * it (which it does on every tab-visibility change).
 */
function useWakeLock() {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any;
    if (!nav?.wakeLock?.request) return;
    let released = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lock: any = null;

    const acquire = async () => {
      if (released || document.visibilityState !== 'visible') return;
      try {
        lock = await nav.wakeLock.request('screen');
      } catch { /* denied or unsupported — nothing else to do */ }
    };
    const onVisible = () => { if (document.visibilityState === 'visible') void acquire(); };

    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      released = true;
      document.removeEventListener('visibilitychange', onVisible);
      try { void lock?.release?.(); } catch { /* already gone */ }
    };
  }, []);
}

export function LiveDisplayClient({ eventId, sessionLabel, eventTimezone, submitUrl, initialQuestions, activePoll: initialActivePoll }: Props) {
  const [mode, setMode] = useState<Mode>('qa');
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [activePoll, setActivePoll] = useState<Poll | null>(initialActivePoll);
  // Default to the moderated wall — see the note in the live page's server fetch.
  const [moderated, setModerated] = useState(true);
  const [lastOk, setLastOk] = useState(() => Date.now());
  const [authExpired, setAuthExpired] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const time = useLiveClock(eventTimezone);
  useWakeLock();

  // Restore the operator's moderated/unmoderated choice, so a mid-event reload
  // or a laptop restart doesn't silently flip what the room is looking at.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(MODERATED_KEY);
      if (saved === '0') setModerated(false);
    } catch { /* private mode / storage disabled */ }
  }, []);
  const toggleModerated = useCallback(() => {
    setModerated(prev => {
      const next = !prev;
      try { window.localStorage.setItem(MODERATED_KEY, next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    // Every branch below must be reached — an uncaught throw here would leave
    // the interval running against a promise nobody observes, and the screen
    // would keep rendering hours-old questions while the clock ticked happily.
    try {
      const res = await fetch(`/api/events/${eventId}/live/questions`, { cache: 'no-store' });
      if (res.status === 401 || res.status === 403) { setAuthExpired(true); return; }
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;
      setQuestions(data);
      setAuthExpired(false);
      setLastOk(Date.now());
    } catch { /* offline — the staleness banner is what surfaces this */ }
  }, [eventId]);

  const refreshPoll = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/polls?active=true`, { cache: 'no-store' });
      if (res.status === 401 || res.status === 403) { setAuthExpired(true); return; }
      if (!res.ok) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { polls } = await res.json() as { polls: any[] };
      const p = polls?.[0];
      if (p) {
        setActivePoll({
          id: p.id,
          question: p.question,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          options: (p.poll_options ?? [])
            .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
            .map((o: { text: string; votes_count: number }) => ({ label: o.text, votes: o.votes_count })),
        });
      } else {
        setActivePoll(null);
      }
      setAuthExpired(false);
      setLastOk(Date.now());
    } catch { /* offline — see above */ }
  }, [eventId]);

  // Auto-refresh. Also refresh immediately when the tab comes back to the
  // foreground or the machine reports it is online again: browsers throttle
  // background timers hard, so a display that was backgrounded or asleep would
  // otherwise sit on stale data until the next lazy tick fires.
  useEffect(() => {
    const id = setInterval(() => { void refresh(); void refreshPoll(); }, REFRESH_MS);
    const wake = () => {
      if (document.visibilityState !== 'visible') return;
      void refresh();
      void refreshPoll();
    };
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('online', wake);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('online', wake);
    };
  }, [refresh, refreshPoll]);

  // Drives the staleness readout only.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(id);
  }, []);

  const staleMs = now - lastOk;
  const isStale = authExpired || staleMs > STALE_AFTER_MS;
  const staleLabel = authExpired
    ? 'Session expired — sign in again on this machine to resume live updates'
    : `Not updating — last refreshed ${Math.floor(staleMs / 60_000)} min ago`;

  const visible = moderated ? questions.filter((q: Question) => q.is_featured) : questions;
  const top4 = visible.slice(0, 4);

  return (
    <div className="fixed inset-0 overflow-hidden flex flex-col" style={{ background: 'linear-gradient(135deg, #0F1F18 0%, #1F4D3A 60%, #163828 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-8 py-4 sm:py-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="font-display font-bold text-[18px] sm:text-[22px]" style={{ color: '#FAF6EE', letterSpacing: '-0.02em' }}>
            eventera
          </div>
          <div className="h-5 w-px shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <div className="text-[11px] sm:text-[13px] font-semibold tracking-[0.12em] uppercase truncate" style={{ color: '#E8C57E', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {mode === 'qa' ? 'LIVE Q&A' : 'POLL RESULTS'} · {sessionLabel}
          </div>
        </div>
        <div className="text-[20px] sm:text-[28px] font-display font-bold tabular-nums shrink-0" style={{ color: '#FAF6EE', letterSpacing: '-0.02em' }}>
          {time}
        </div>
      </div>

      {/* Staleness banner.
          The clock is rendered from the local machine, so it keeps ticking even
          when the network is gone — which makes a frozen display look perfectly
          alive. This is the only thing on screen that tells the room, and the
          operator, that what they are reading is no longer current. */}
      {isStale && (
        <div
          className="flex items-center justify-center gap-2 px-4 py-2 shrink-0 text-[13px] sm:text-[15px] font-semibold"
          role="status"
          aria-live="polite"
          style={{ background: 'rgba(201,122,45,0.22)', borderBottom: '1px solid rgba(201,122,45,0.45)', color: '#FAF6EE', fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          <AlertTriangle size={16} style={{ color: '#E8C57E', flexShrink: 0 }} aria-hidden />
          <span className="text-center">{staleLabel}</span>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden p-4 sm:p-8">
        {mode === 'qa' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {top4.length === 0 ? (
              <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center text-center px-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {moderated && questions.length > 0 ? (
                  <>
                    <div className="text-[20px] mb-2">No approved questions yet</div>
                    <div className="text-[14px] max-w-md">
                      {questions.length} question{questions.length === 1 ? '' : 's'} waiting. Star one in Q&amp;A moderation to put it on screen.
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[20px] mb-2">No questions yet</div>
                    <div className="text-[14px]">Ask attendees to submit questions</div>
                  </>
                )}
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

      </div>

      {/* Footer with CTA + mode switcher */}
      <div className="shrink-0 px-4 sm:px-8 pb-4 sm:pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="rounded-2xl px-4 sm:px-5 py-3 min-w-0" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-[12px] mb-0.5" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.08em' }}>
            SUBMIT YOUR QUESTION
          </div>
          <div className="text-[16px] sm:text-[20px] font-display font-bold break-all" style={{ color: '#E8C57E' }}>
            {submitUrl}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === 'qa' && (
            <button
              onClick={toggleModerated}
              className="px-4 py-2 rounded-xl text-[12px] font-semibold transition min-h-[40px]"
              title={moderated
                ? 'Only starred questions are on screen. Switch to show every submission unmoderated.'
                : 'Every submission goes straight to the screen. Switch back to starred-only.'}
              style={{
                background: moderated ? 'rgba(45,122,79,0.25)' : 'rgba(184,66,60,0.25)',
                color: '#FAF6EE',
                border: `1px solid ${moderated ? 'rgba(45,122,79,0.5)' : 'rgba(184,66,60,0.5)'}`,
              }}>
              {moderated ? 'Moderated' : 'Unmoderated'}
            </button>
          )}
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className="px-4 py-2 rounded-xl text-[12px] font-semibold transition min-h-[40px]"
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
