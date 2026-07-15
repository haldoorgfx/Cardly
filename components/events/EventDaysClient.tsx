'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, CalendarDays, AlertCircle } from 'lucide-react';
import { EventDayCard } from './EventDayCard';
import type { DayInput, EventDayLite, DayEntitlementLite } from './event-day-model';

interface Props {
  initialDays: EventDayLite[];
  entitlements: DayEntitlementLite[];
  addDay: () => Promise<{ ok?: boolean; error?: string }>;
  saveDay: (dayId: string, input: DayInput) => Promise<{ ok?: boolean; error?: string }>;
  removeDay: (dayId: string) => Promise<{ ok?: boolean; error?: string }>;
}

export function EventDaysClient({ initialDays, entitlements, addDay, saveDay, removeDay }: Props) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  async function handleAdd() {
    setAdding(true); setError('');
    const res = await addDay();
    setAdding(false);
    if (res.error) { setError(res.error); return; }
    router.refresh();
  }

  const isEmpty = initialDays.length === 0;

  if (isEmpty) {
    return (
      <div className="rounded-2xl flex flex-col items-center justify-center py-16 text-center"
        style={{ background: 'white', border: '2px dashed #E5E0D4' }}>
        <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(31,77,58,0.08)' }}>
          <CalendarDays size={20} strokeWidth={1.8} style={{ color: '#1F4D3A' }} />
        </div>
        <div className="font-display font-semibold text-[17px] mb-1" style={{ color: '#0F1F18' }}>Single-day event</div>
        <div className="text-[14px] mb-6 max-w-[400px]" style={{ color: '#65736B' }}>
          This event runs on a single day. Add days to give each one its own check-in toggle, capacity and set of valid entitlements — for conferences, festivals and multi-day programs.
        </div>
        {error && (
          <p className="text-[13px] mb-3 flex items-center gap-1" style={{ color: '#B8423C' }}>
            <AlertCircle size={13} strokeWidth={2} />{error}
          </p>
        )}
        <button onClick={handleAdd} disabled={adding}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-lg text-white text-[14px] font-semibold transition hover:opacity-90 disabled:opacity-60"
          style={{ background: '#1F4D3A' }}>
          <Plus size={14} strokeWidth={2.5} /> {adding ? 'Adding…' : 'Add a day'}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px]" style={{ color: '#65736B' }}>
          {initialDays.length} day{initialDays.length !== 1 ? 's' : ''}
        </p>
        <button onClick={handleAdd} disabled={adding}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          style={{ background: '#1F4D3A' }}>
          <Plus size={14} strokeWidth={2.5} /> {adding ? 'Adding…' : 'Add day'}
        </button>
      </div>

      {error && (
        <p className="text-[13px] mb-3 flex items-center gap-1" style={{ color: '#B8423C' }}>
          <AlertCircle size={13} strokeWidth={2} />{error}
        </p>
      )}

      <div className="space-y-4">
        {initialDays.map((day) => (
          <EventDayCard
            key={day.id}
            day={day}
            entitlements={entitlements}
            save={async (input) => {
              const res = await saveDay(day.id, input);
              if (res.ok) router.refresh();
              return res;
            }}
            remove={async () => {
              const res = await removeDay(day.id);
              if (res.ok) router.refresh();
              return res;
            }}
          />
        ))}
      </div>
    </div>
  );
}
