'use client';

import { useState } from 'react';
import { RefreshCw, Calendar, ChevronDown, ChevronUp, ExternalLink, CalendarPlus, Check } from 'lucide-react';
import Link from 'next/link';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Series = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Instance = any;

interface Props {
  eventId: string;
  eventName: string;
  eventSlug: string;
  series: Series | null;
}

const FREQ_OPTIONS = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'biweekly', label: 'Bi-weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'custom', label: 'Custom' },
];

const INHERITED = [
  'Venue & location',
  'Ticket types & pricing',
  'Branding & cover image',
  'Staff & team roles',
  'Registration form',
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
}

export function EventSeriesClient({ eventId, eventName, eventSlug, series }: Props) {
  const [freq, setFreq] = useState<string>(series?.frequency ?? 'monthly');
  const [time, setTime] = useState(series?.default_time ?? '18:00');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const instances: Instance[] = series?.event_series_instances ?? [];

  async function save() {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`/api/events/${eventId}/series`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frequency: freq, default_time: time }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? 'Could not save series settings.');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save series settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-[760px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: '#E8EFEB' }}>
          <RefreshCw size={18} style={{ color: '#1F4D3A' }} />
        </div>
        <div>
          <h1 className="font-display font-bold text-[22px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
            Event Series
          </h1>
          <p className="text-[13px]" style={{ color: '#6B7A72' }}>{eventName}</p>
        </div>
      </div>

      {/* Recurrence config */}
      <div className="rounded-2xl p-6 mb-5" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
        <h2 className="font-semibold text-[16px] mb-4" style={{ color: '#0F1F18' }}>Recurrence</h2>

        {/* Frequency chips */}
        <div className="mb-4">
          <label className="text-[12px] font-semibold mb-2 block" style={{ color: '#6B7A72' }}>Frequency</label>
          <div className="flex flex-wrap gap-2">
            {FREQ_OPTIONS.map(opt => (
              <button key={opt.key} onClick={() => setFreq(opt.key)}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold transition"
                style={{
                  background: freq === opt.key ? '#1F4D3A' : '#F5F2EC',
                  color: freq === opt.key ? '#FAF6EE' : '#3A4A42',
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time */}
        <div className="mb-5">
          <label className="text-[12px] font-semibold mb-2 block" style={{ color: '#6B7A72' }}>Default start time</label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="px-3 py-2 rounded-xl border text-[14px] outline-none"
            style={{ borderColor: '#E5E0D4', color: '#0F1F18', background: '#FAF6EE' }}
          />
        </div>

        {/* Inherited props */}
        <div className="rounded-xl p-4 mb-5" style={{ background: '#F5F2EC' }}>
          <p className="text-[12px] font-semibold mb-2" style={{ color: '#3A4A42' }}>Inherited from parent event</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {INHERITED.map(item => (
              <span key={item} className="text-[12px] flex items-center gap-1" style={{ color: '#6B7A72' }}>
                <Check size={14} strokeWidth={1.8} style={{ color: '#2D7A4F' }} className="shrink-0" /> {item}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold transition hover:opacity-90 disabled:opacity-60"
            style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
            {saved ? <><Check size={14} strokeWidth={1.8} /> Saved</> : saving ? 'Saving…' : 'Save series settings'}
          </button>
          {saveError && <span className="text-[12.5px]" style={{ color: '#B8423C' }}>{saveError}</span>}
        </div>
      </div>

      {/* Instances list */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[16px]" style={{ color: '#0F1F18' }}>
            Upcoming instances
          </h2>
        </div>

        {instances.length === 0 ? (
          <div className="rounded-2xl px-6 py-10 text-center" style={{ border: '1px solid #E5E0D4', background: '#FFFFFF' }}>
            <div className="w-11 h-11 rounded-xl grid place-items-center mx-auto mb-3" style={{ background: '#E8EFEB' }}>
              <CalendarPlus size={19} style={{ color: '#1F4D3A' }} />
            </div>
            <p className="text-[14px] font-semibold mb-1" style={{ color: '#0F1F18' }}>No instances scheduled yet</p>
            <p className="text-[13px] max-w-[380px] mx-auto" style={{ color: '#3A4A42' }}>
              Save your recurrence settings above, then duplicate this event for each date to build out the series. Each copy keeps the venue, tickets, and branding.
            </p>
            <Link
              href={`/events/${eventSlug}/settings`}
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition hover:opacity-90"
              style={{ background: '#1F4D3A' }}
            >
              Duplicate this event
            </Link>
          </div>
        ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4', background: '#FFFFFF' }}>
          {instances.map((inst: Instance, i: number) => {
            const expanded = expandedId === inst.id;
            const isLast = i === instances.length - 1;
            return (
              <div key={inst.id} style={{ borderBottom: isLast ? 'none' : '1px solid #F0EDE6' }}>
                <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#FAFAF8] transition"
                  onClick={() => setExpandedId(expanded ? null : inst.id)}>
                  <Calendar size={16} className="shrink-0" style={{ color: '#6B7A72' }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[14px]" style={{ color: '#0F1F18' }}>
                      {inst.events?.name ?? fmtDate(inst.scheduled_date)}
                    </div>
                    <div className="text-[12px]" style={{ color: '#6B7A72' }}>
                      {fmtDate(inst.scheduled_date)}
                      {inst.registrations_count > 0 && ` · ${inst.registrations_count} registrations`}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0"
                    style={{
                      background: inst.status === 'published' ? 'rgba(45,122,79,0.1)' : 'rgba(107,122,114,0.1)',
                      color: inst.status === 'published' ? '#2D7A4F' : '#6B7A72',
                    }}>
                    {inst.status === 'published' ? 'Live' : 'Draft'}
                  </span>
                  {expanded ? <ChevronUp size={14} style={{ color: '#6B7A72' }} /> : <ChevronDown size={14} style={{ color: '#6B7A72' }} />}
                </div>

                {expanded && (
                  <div className="px-5 pb-4 pt-0 flex items-center gap-3" style={{ borderTop: '1px solid #F0EDE6', background: '#FAFAF8' }}>
                    <Link href={`/events/${inst.event_id ?? eventId}/edit`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium border transition hover:opacity-80"
                      style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}>
                      Edit event
                    </Link>
                    <Link href={`/e/${eventSlug}`} target="_blank"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition hover:opacity-80"
                      style={{ color: '#1F4D3A' }}>
                      <ExternalLink size={12} /> View page
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Attendee-facing preview */}
      <div className="rounded-2xl p-5" style={{ background: '#E8EFEB', border: '1px solid #C9E0D4' }}>
        <p className="text-[12px] font-semibold mb-3" style={{ color: '#1F4D3A' }}>How attendees see it</p>
        <div className="rounded-xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
          <div className="font-semibold text-[14px] mb-0.5" style={{ color: '#0F1F18' }}>{eventName}</div>
          <div className="text-[12px] mb-2" style={{ color: '#6B7A72' }}>Recurring series · {FREQ_OPTIONS.find(f => f.key === freq)?.label}</div>
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {instances.slice(0, 3).map((inst: Instance) => (
              <span key={inst.id} className="px-2.5 py-1 rounded-lg text-[11px] font-medium"
                style={{ background: '#F5F2EC', color: '#3A4A42' }}>
                {new Date(inst.scheduled_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              </span>
            ))}
          </div>
          {/* Illustrative only — this is a preview of the attendee-facing page */}
          <div className="inline-flex px-4 py-2 rounded-lg text-[13px] font-semibold"
            style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
            Follow the series
          </div>
        </div>
      </div>
    </div>
  );
}
