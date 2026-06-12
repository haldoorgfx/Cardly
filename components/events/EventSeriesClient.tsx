'use client';

import { useState } from 'react';
import { RefreshCw, Calendar, ChevronDown, ChevronUp, ExternalLink, Plus, SkipForward } from 'lucide-react';
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

const DEMO_INSTANCES: Instance[] = [
  { id: 'i1', scheduled_date: '2026-07-15', status: 'published', registrations_count: 48, events: { name: 'Lagos Design Week — Jul 2026', status: 'published' } },
  { id: 'i2', scheduled_date: '2026-08-19', status: 'draft', registrations_count: 0, events: { name: 'Lagos Design Week — Aug 2026', status: 'draft' } },
  { id: 'i3', scheduled_date: '2026-09-16', status: 'draft', registrations_count: 0, events: { name: 'Lagos Design Week — Sep 2026', status: 'draft' } },
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

  const instances: Instance[] = series?.event_series_instances ?? DEMO_INSTANCES;

  async function save() {
    setSaving(true);
    await fetch(`/api/events/${eventId}/series`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frequency: freq, default_time: time }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
                <span style={{ color: '#2D7A4F' }}>✓</span> {item}
              </span>
            ))}
          </div>
        </div>

        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold transition hover:opacity-90 disabled:opacity-60"
          style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save series settings'}
        </button>
      </div>

      {/* Instances list */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[16px]" style={{ color: '#0F1F18' }}>
            Upcoming instances
          </h2>
          <button className="flex items-center gap-1.5 text-[13px] font-semibold transition hover:opacity-70"
            style={{ color: '#1F4D3A' }}>
            <Plus size={14} /> Add instance
          </button>
        </div>

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
                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition hover:opacity-80"
                      style={{ color: '#6B7A72' }}>
                      <SkipForward size={12} /> Skip date
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
          <button className="px-4 py-2 rounded-lg text-[13px] font-semibold transition hover:opacity-90"
            style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
            Follow the series
          </button>
        </div>
      </div>
    </div>
  );
}
