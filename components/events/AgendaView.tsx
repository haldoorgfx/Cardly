'use client';

import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import SessionsManager from './SessionsManager';
import { AgendaTimeline } from './AgendaTimeline';
import type { Session, Track } from '@/types/database';

interface SpeakerOption { id: string; name: string; photo_url: string | null }

interface Props {
  eventId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialSessions: any[];
  speakers: SpeakerOption[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialTracks: any[];
}

function formatDayTab(date: Date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); // "12 Mar"
}

export function AgendaView({ eventId, initialSessions, speakers, initialTracks }: Props) {
  const [addOpen, setAddOpen] = useState(false);

  // Group sessions by calendar day
  const days = useMemo(() => {
    const map = new Map<string, Session[]>();
    const sorted = [...initialSessions as Session[]].sort(
      (a, b) => new Date(a.starts_at ?? 0).getTime() - new Date(b.starts_at ?? 0).getTime()
    );
    for (const s of sorted) {
      if (!s.starts_at) continue;
      const key = new Date(s.starts_at).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).map(([key, sessions], idx) => ({
      key,
      label: `Day ${idx + 1} · ${formatDayTab(new Date(key))}`,
      sessions,
    }));
  }, [initialSessions]);

  const [selectedDay, setSelectedDay] = useState(0);

  // Subtitle calculations
  const totalSessions = initialSessions.length;
  const totalDays     = days.length;
  const totalTracks   = initialTracks.length;

  const subtitle = totalSessions === 0
    ? 'No sessions yet — add your first one'
    : `${totalSessions} session${totalSessions !== 1 ? 's' : ''} across ${totalDays} day${totalDays !== 1 ? 's' : ''} · ${totalTracks} track${totalTracks !== 1 ? 's' : ''}`;

  const displayedSessions: Session[] = days.length > 0
    ? (days[selectedDay]?.sessions ?? [])
    : (initialSessions as Session[]);

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-semibold text-[26px] tracking-[-0.02em]" style={{ color: '#0F1F18' }}>
            Agenda
          </h1>
          <p className="text-[13.5px] mt-0.5" style={{ color: '#6B7A72' }}>{subtitle}</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90 shrink-0"
          style={{ background: '#1F4D3A' }}>
          <Plus size={14} strokeWidth={2.5} />
          Add session
        </button>
      </div>

      {/* ── Day tabs ──────────────────────────────────────────────────────── */}
      {days.length > 0 && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {days.map((day, idx) => (
            <button
              key={day.key}
              onClick={() => setSelectedDay(idx)}
              className="px-4 py-1.5 rounded-full text-[13px] font-medium transition-all"
              style={selectedDay === idx
                ? { background: '#1F4D3A', color: 'white' }
                : { background: 'white', color: '#3A4A42', border: '1px solid #E5E0D4' }}>
              {day.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Timeline grid ─────────────────────────────────────────────────── */}
      {totalSessions === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center" style={{ borderColor: '#E5E0D4' }}>
          <p className="text-[14px] mb-4" style={{ color: '#6B7A72' }}>
            No sessions yet. Add sessions with start/end times to see the timeline.
          </p>
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: '#1F4D3A' }}>
            <Plus size={14} strokeWidth={2.5} />
            Add first session
          </button>
        </div>
      ) : (
        <div className="bg-white border rounded-2xl p-5 overflow-hidden" style={{ borderColor: '#E5E0D4' }}>
          <AgendaTimeline
            sessions={displayedSessions}
            tracks={initialTracks as Track[]}
          />
        </div>
      )}

      {/* ── Add session modal (uses SessionsManager in modal mode) ─────────── */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAddOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-[0_8px_40px_rgba(15,31,24,0.18)] border border-[#E5E0D4] w-full max-w-[700px] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10" style={{ borderColor: '#E5E0D4' }}>
              <span className="font-display text-[16px] font-semibold" style={{ color: '#0F1F18' }}>Sessions</span>
              <button onClick={() => setAddOpen(false)} className="h-8 w-8 rounded-lg grid place-items-center transition hover:bg-[#F5F3EE]" style={{ color: '#6B7A72' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-6">
              <SessionsManager
                eventId={eventId}
                initialSessions={initialSessions as Session[]}
                speakers={speakers}
                initialTracks={initialTracks as Track[]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
