'use client';

import { useState } from 'react';
import { LayoutList, CalendarDays } from 'lucide-react';
import SessionsManager from './SessionsManager';
import { AgendaTimeline } from './AgendaTimeline';
import type { Session, Track } from '@/types/database';

interface SpeakerOption {
  id: string;
  name: string;
  photo_url: string | null;
}

interface Props {
  eventId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialSessions: any[];
  speakers: SpeakerOption[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialTracks: any[];
}

type View = 'list' | 'timeline';

export function AgendaView({ eventId, initialSessions, speakers, initialTracks }: Props) {
  const [view, setView] = useState<View>('list');

  return (
    <div>
      {/* View toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center p-1 rounded-xl gap-0.5" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
          <button
            onClick={() => setView('list')}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] font-medium transition"
            style={view === 'list'
              ? { background: '#E8EFEB', color: '#0F1F18' }
              : { color: '#6B7A72' }}
          >
            <LayoutList size={13} strokeWidth={1.8} />
            List
          </button>
          <button
            onClick={() => setView('timeline')}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] font-medium transition"
            style={view === 'timeline'
              ? { background: '#E8EFEB', color: '#0F1F18' }
              : { color: '#6B7A72' }}
          >
            <CalendarDays size={13} strokeWidth={1.8} />
            Timeline
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <SessionsManager
          eventId={eventId}
          initialSessions={initialSessions as Session[]}
          speakers={speakers}
          initialTracks={initialTracks as Track[]}
        />
      ) : (
        <AgendaTimeline
          sessions={initialSessions as Session[]}
          tracks={initialTracks as Track[]}
        />
      )}
    </div>
  );
}
