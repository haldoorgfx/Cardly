'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Trash2, Check } from 'lucide-react';
import { EntitlementIcon } from '@/components/tickets/EntitlementIcon';
import {
  dayFormSchema,
  dayDateLabel,
  type DayFormValues,
  type DayInput,
  type EventDayLite,
  type DayEntitlementLite,
} from './event-day-model';

const inputStyle: React.CSSProperties = { background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' };

interface Props {
  day: EventDayLite;
  entitlements: DayEntitlementLite[];
  save: (input: DayInput) => Promise<{ ok?: boolean; error?: string }>;
  remove: () => Promise<{ ok?: boolean; error?: string }>;
}

export function EventDayCard({ day, entitlements, save, remove }: Props) {
  const {
    register, handleSubmit, reset, watch, setValue,
    formState: { errors, isSubmitting, isDirty },
    setError,
  } = useForm<DayFormValues>({
    resolver: zodResolver(dayFormSchema),
    defaultValues: {
      date: day.date ?? '',
      checkin_enabled: day.checkin_enabled,
      capacity: day.capacity != null ? String(day.capacity) : '',
      entitlementIds: day.entitlementIds,
    },
  });

  const [removing, setRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    reset({
      date: day.date ?? '',
      checkin_enabled: day.checkin_enabled,
      capacity: day.capacity != null ? String(day.capacity) : '',
      entitlementIds: day.entitlementIds,
    });
  }, [day, reset]);

  const checkinEnabled = watch('checkin_enabled');
  const selected = watch('entitlementIds');
  const dateVal = watch('date');

  async function onSubmit(v: DayFormValues) {
    const res = await save({
      date: v.date ? v.date : null,
      checkin_enabled: v.checkin_enabled,
      capacity: v.capacity === '' ? null : parseInt(v.capacity, 10),
      entitlementIds: v.entitlementIds,
    });
    if (res.error) { setError('root', { message: res.error }); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function toggleEnt(id: string) {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    setValue('entitlementIds', next, { shouldDirty: true });
  }

  async function handleRemove() {
    setRemoving(true);
    const res = await remove();
    if (res.error) { setRemoving(false); setConfirmRemove(false); setError('root', { message: res.error }); return; }
    // Parent refreshes the list on success.
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl"
      style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3" style={{ borderBottom: '1px solid #F0EDE6' }}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0 font-display font-semibold text-[14px]" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
            {day.day_index + 1}
          </span>
          <div className="min-w-0">
            <div className="font-display font-semibold text-[15px]" style={{ color: '#0F1F18' }}>Day {day.day_index + 1}</div>
            <div className="text-[12.5px] truncate" style={{ color: '#6B7A72' }}>{dayDateLabel(dateVal ? dateVal : null)}</div>
          </div>
        </div>
        <button
          type="button" onClick={() => setConfirmRemove(true)} title="Remove day"
          className="h-8 w-8 rounded-lg flex items-center justify-center transition shrink-0" style={{ color: '#6B7A72' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(184,66,60,0.08)'; e.currentTarget.style.color = '#B8423C'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7A72'; }}
        >
          <Trash2 size={15} strokeWidth={2} />
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>Date</label>
            <input {...register('date')} type="date"
              className="w-full h-10 px-3 rounded-lg text-[13.5px] outline-none transition" style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#E8C57E')} onBlur={(e) => (e.target.style.borderColor = '#E5E0D4')} />
          </div>
          <div>
            <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>Capacity</label>
            <input {...register('capacity')} inputMode="numeric" placeholder="No cap"
              className="w-full h-10 px-3 rounded-lg text-[13.5px] outline-none transition" style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#E8C57E')} onBlur={(e) => (e.target.style.borderColor = '#E5E0D4')} />
            {errors.capacity?.message && (
              <p className="text-[11.5px] mt-1 flex items-center gap-1" style={{ color: '#B8423C' }}>
                <AlertCircle size={11} strokeWidth={2} />{errors.capacity.message}
              </p>
            )}
          </div>
        </div>

        {/* Check-in toggle */}
        <div className="flex items-center justify-between rounded-lg px-3.5 py-3" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
          <div>
            <div className="text-[13.5px] font-medium" style={{ color: '#0F1F18' }}>Check-in enabled</div>
            <div className="text-[11.5px]" style={{ color: '#6B7A72' }}>Allow scanning attendees in on this day.</div>
          </div>
          <button
            type="button" role="switch" aria-checked={checkinEnabled} aria-label="Check-in enabled"
            onClick={() => setValue('checkin_enabled', !checkinEnabled, { shouldDirty: true })}
            className="relative h-6 w-11 rounded-full transition shrink-0"
            style={{ background: checkinEnabled ? '#1F4D3A' : '#C7CFC9' }}
          >
            <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: checkinEnabled ? '22px' : '2px' }} />
          </button>
        </div>

        {/* Entitlements for this day */}
        <div>
          <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>Entitlements valid this day</label>
          {entitlements.length === 0 ? (
            <p className="text-[12px] rounded-lg px-3 py-2.5" style={{ background: '#FAF6EE', color: '#9BA8A1', border: '1px solid #E5E0D4' }}>
              No entitlements defined yet. Create entitlements first, then choose which apply each day.
            </p>
          ) : (
            <div className="rounded-lg border divide-y" style={{ borderColor: '#E5E0D4' }}>
              {entitlements.map((ent) => {
                const on = selected.includes(ent.id);
                return (
                  <button
                    key={ent.id} type="button" onClick={() => toggleEnt(ent.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition hover:bg-[#FAF6EE]" style={{ borderColor: '#F0EDE6' }}
                  >
                    <span className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                      style={{ background: on ? '#1F4D3A' : 'white', border: `1px solid ${on ? '#1F4D3A' : '#C7CFC9'}` }}>
                      {on && <Check size={11} strokeWidth={3} color="white" />}
                    </span>
                    <span className="w-6 h-6 rounded-lg grid place-items-center shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                      <EntitlementIcon type={ent.type} size={13} strokeWidth={1.9} />
                    </span>
                    <span className="text-[13.5px]" style={{ color: '#0F1F18' }}>{ent.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {errors.root?.message && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-[13px]"
            style={{ background: 'rgba(184,66,60,0.07)', border: '1px solid rgba(184,66,60,0.2)', color: '#B8423C' }}>
            <AlertCircle size={14} strokeWidth={2} className="mt-0.5 shrink-0" />{errors.root.message}
          </div>
        )}

        {/* Save */}
        <div className="flex items-center justify-end gap-3">
          {saved && !isDirty && (
            <span className="text-[12.5px] inline-flex items-center gap-1" style={{ color: '#2D7A4F' }}>
              <Check size={13} strokeWidth={2.5} /> Saved
            </span>
          )}
          <button type="submit" disabled={isSubmitting || !isDirty}
            className="h-9 px-4 text-white text-[13px] font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-45"
            style={{ background: '#1F4D3A' }}>
            {isSubmitting ? 'Saving…' : 'Save day'}
          </button>
        </div>
      </div>

      {/* Remove confirm */}
      {confirmRemove && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmRemove(false)} />
          <div className="relative w-full max-w-[400px] rounded-2xl p-6" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
            <h3 className="font-display font-semibold text-[18px] mb-2" style={{ color: '#0F1F18' }}>Remove Day {day.day_index + 1}?</h3>
            <p className="text-[14px] mb-5" style={{ color: '#6B7A72' }}>
              This removes the day and its per-day entitlement settings. Redemption history is kept. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmRemove(false)}
                className="flex-1 h-10 rounded-xl text-[14px] font-medium border transition" style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}>
                Cancel
              </button>
              <button type="button" onClick={handleRemove} disabled={removing}
                className="flex-1 h-10 rounded-xl text-white text-[14px] font-semibold transition hover:opacity-90 disabled:opacity-60" style={{ background: '#B8423C' }}>
                {removing ? 'Removing…' : 'Remove day'}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
