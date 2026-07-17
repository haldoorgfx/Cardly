'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, Users, Check } from 'lucide-react';
import type { CellState, DaySummary } from '@/lib/multiday/attendance';
import { StatusState } from '@/components/ui/status-state';

interface DayCol {
  day_index: number;
  date: string | null;
  capacity: number | null;
}
interface AttendeeRow {
  id: string;
  name: string;
  ticketName: string | null;
}

interface Props {
  eventSlug: string;
  days: DayCol[];
  attendees: AttendeeRow[];
  cells: Record<string, CellState>;
  perDay: DaySummary[];
  error: boolean;
}

function shortDate(date: string | null): string {
  if (!date) return 'No date';
  const [y, m, d] = date.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return 'No date';
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const CELL: Record<CellState, { bg: string; fg: string; label: string }> = {
  'checked-in': { bg: 'rgba(45,122,79,0.12)', fg: '#2D7A4F', label: 'Checked in' },
  absent: { bg: 'rgba(201,122,45,0.10)', fg: '#C97A2D', label: 'Absent' },
  'not-entitled': { bg: '#FAF6EE', fg: '#9BA8A1', label: 'Not entitled' },
};

function Cell({ state }: { state: CellState }) {
  const c = CELL[state];
  return (
    <div className="h-9 rounded-lg flex items-center justify-center" style={{ background: c.bg }} title={c.label}>
      {state === 'checked-in' ? (
        <Check size={15} strokeWidth={2.5} style={{ color: c.fg }} />
      ) : state === 'absent' ? (
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.fg }} />
      ) : (
        <span className="text-[13px] leading-none" style={{ color: c.fg }}>–</span>
      )}
    </div>
  );
}

const COL_W = 132; // px per day column
const NAME_W = 200; // px sticky attendee column

export function AttendanceGrid({ eventSlug, days, attendees, cells, perDay, error }: Props) {
  const router = useRouter();

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E0D4]">
        <StatusState
          kind="error"
          reason="network"
          title="Couldn't load attendance"
          message="We couldn't fetch the attendance data. Check your connection and try again."
          primaryAction={{ label: 'Retry', onClick: () => router.refresh() }}
        />
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E0D4]">
        <StatusState
          kind="empty"
          icon={CalendarDays}
          title="No days set up yet"
          message="Attendance by day appears once this event has days. Set up days to track who shows up when."
          primaryAction={{ label: 'Set up days', href: `/events/${eventSlug}/settings/days` }}
        />
      </div>
    );
  }

  if (attendees.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E0D4]">
        <StatusState
          kind="empty"
          icon={Users}
          title="No attendees yet"
          message="Once people register, their day-by-day attendance shows here as they check in."
        />
      </div>
    );
  }

  const gridTemplate = `${NAME_W}px repeat(${days.length}, ${COL_W}px)`;

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-4">
        {(['checked-in', 'absent', 'not-entitled'] as CellState[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5 text-[12.5px]" style={{ color: '#3A4A42' }}>
            <span className="h-3 w-3 rounded" style={{ background: CELL[s].bg, border: `1px solid ${CELL[s].fg}33` }} />
            {CELL[s].label}
          </span>
        ))}
      </div>

      <div className="rounded-2xl overflow-x-auto" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
        <div style={{ minWidth: NAME_W + days.length * COL_W }}>
          {/* Header */}
          <div className="grid items-stretch" style={{ gridTemplateColumns: gridTemplate, borderBottom: '1px solid #E5E0D4' }}>
            <div className="sticky left-0 z-10 px-4 py-3 flex items-end" style={{ background: 'white' }}>
              <span className="text-[12.5px] font-semibold uppercase tracking-wide" style={{ color: '#65736B' }}>Attendee</span>
            </div>
            {days.map((d) => (
              <div key={d.day_index} className="px-3 py-3 text-center" style={{ borderLeft: '1px solid #F0EDE6' }}>
                <div className="font-display font-semibold text-[13px]" style={{ color: '#0F1F18' }}>Day {d.day_index + 1}</div>
                <div className="text-[13px] mt-0.5" style={{ color: '#65736B' }}>{shortDate(d.date)}</div>
              </div>
            ))}
          </div>

          {/* Attendee rows */}
          {attendees.map((a, i) => (
            <div key={a.id} className="grid items-center" style={{ gridTemplateColumns: gridTemplate, borderTop: i === 0 ? 'none' : '1px solid #F0EDE6' }}>
              <div className="sticky left-0 z-10 px-4 py-2" style={{ background: 'white' }}>
                <div className="text-[13.5px] font-medium truncate" style={{ color: '#0F1F18' }}>{a.name}</div>
                {a.ticketName && <div className="text-[13px] truncate" style={{ color: '#9BA8A1' }}>{a.ticketName}</div>}
              </div>
              {days.map((d) => (
                <div key={d.day_index} className="px-2 py-1.5" style={{ borderLeft: '1px solid #F5F3EC' }}>
                  <Cell state={cells[`${a.id}::${d.day_index}`] ?? 'not-entitled'} />
                </div>
              ))}
            </div>
          ))}

          {/* Per-day summary */}
          <div className="grid items-center" style={{ gridTemplateColumns: gridTemplate, borderTop: '2px solid #E5E0D4', background: '#FAF6EE' }}>
            <div className="sticky left-0 z-10 px-4 py-3" style={{ background: '#FAF6EE' }}>
              <span className="text-[12.5px] font-semibold uppercase tracking-wide" style={{ color: '#65736B' }}>Checked in / entitled</span>
            </div>
            {perDay.map((s) => (
              <div key={s.day_index} className="px-3 py-3 text-center" style={{ borderLeft: '1px solid #F0EDE6' }}>
                <div className="text-[14px] font-display font-semibold" style={{ color: '#0F1F18' }}>
                  {s.checkedIn}
                  <span className="text-[12.5px] font-normal" style={{ color: '#65736B' }}> / {s.entitled}</span>
                </div>
                {s.capacity != null && (
                  <div className="text-[12.5px] mt-0.5" style={{ color: '#9BA8A1' }}>Cap {s.capacity.toLocaleString()}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
