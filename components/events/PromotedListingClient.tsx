'use client';

import { useState } from 'react';
import { RefreshCw, LayoutGrid, Check } from 'lucide-react';
import { PageShell, PageHeader } from '@/components/dash';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Campaign = any;

interface Props {
  eventId: string;
  eventName: string;
  eventSlug: string;
  campaign: Campaign | null;
}

const PLACEMENTS = [
  { key: 'homepage', label: 'Homepage feed' },
  { key: 'city', label: 'City page' },
  { key: 'category', label: 'Category results' },
  { key: 'search', label: 'Search results' },
];

const DURATION_OPTIONS = [
  { key: '3', label: '3 days' },
  { key: '7', label: '1 week' },
  { key: '14', label: '2 weeks' },
  { key: '30', label: '1 month' },
];

export function PromotedListingClient({ eventId, eventName, campaign }: Props) {
  const [budget, setBudget] = useState<number>(campaign?.daily_budget ?? 25);
  const [duration, setDuration] = useState<string>(campaign?.duration_days?.toString() ?? '7');
  const [placements, setPlacements] = useState<string[]>(campaign?.placements ?? ['homepage', 'city']);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const totalSpend = budget * parseInt(duration);

  const status: string | null = campaign?.status ?? null;
  const isPending = status === 'pending_review';
  const isRejected = status === 'rejected';

  function togglePlacement(key: string) {
    setPlacements(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]);
  }

  async function submit() {
    if (placements.length === 0) {
      setSubmitError('Choose at least one placement.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch(`/api/events/${eventId}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_budget: budget, duration_days: parseInt(duration), placements }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? 'Could not submit your campaign. Please try again.');
      }
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not submit your campaign. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell width="wide">
      <PageHeader title="Promote listing" subtitle={eventName} />

      {/* Where this submission stands.
          The four StatCards that used to sit here — Impressions, Clicks,
          Registrations, Spent — read `campaign.impressions` and friends, and
          no such columns exist on `promoted_listings` (see migration 076).
          They rendered a permanent row of zeros, which told a paying
          organizer their campaign was delivering nothing rather than that
          delivery is not built. */}
      {status && (
        <div
          className="rounded-2xl p-4 mb-6"
          style={{
            background: isRejected ? '#FFFFFF' : '#E8EFEB',
            border: `1px solid ${isRejected ? '#E5E0D4' : '#C9E0D4'}`,
          }}
        >
          <div className="font-semibold text-[14px] mb-1" style={{ color: isRejected ? '#B8423C' : '#0F1F18' }}>
            {isPending && 'Submitted — awaiting review'}
            {isRejected && 'Not approved'}
            {!isPending && !isRejected && 'Approved'}
          </div>
          <p className="text-[12.5px]" style={{ color: '#3A4A42' }}>
            {isPending && 'Our team reviews promotion requests before they go live. You have not been charged.'}
            {isRejected && 'This request was not approved. Adjust the campaign below and submit again, or contact support.'}
            {!isPending && !isRejected && 'Your request is approved and queued. Promoted placement is rolling out — you have not been charged, and we will contact you before any billing starts.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Campaign settings */}
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
          <h2 className="font-semibold text-[16px] mb-5" style={{ color: '#0F1F18' }}>Campaign settings</h2>

          {/* Budget */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-semibold" style={{ color: '#3A4A42' }}>Daily budget</label>
              <span className="font-display font-bold text-[20px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
                ${budget}/day
              </span>
            </div>
            <input
              type="range" min={5} max={200} step={5}
              value={budget}
              onChange={e => setBudget(parseInt(e.target.value))}
              className="w-full accent-[#1F4D3A]"
            />
            <div className="flex justify-between text-[12.5px] mt-1" style={{ color: '#C9C3B1' }}>
              <span>$5</span><span>$200</span>
            </div>
          </div>

          {/* Duration */}
          <div className="mb-5">
            <label className="text-[13px] font-semibold block mb-2" style={{ color: '#3A4A42' }}>Duration</label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map(opt => (
                <button key={opt.key} onClick={() => setDuration(opt.key)}
                  className="px-4 py-2 rounded-xl text-[13px] font-semibold transition"
                  style={{
                    background: duration === opt.key ? '#1F4D3A' : '#F5F2EC',
                    color: duration === opt.key ? '#FAF6EE' : '#3A4A42',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Placements */}
          <div className="mb-6">
            <label className="text-[13px] font-semibold block mb-2" style={{ color: '#3A4A42' }}>Placements</label>
            <div className="grid grid-cols-2 gap-2">
              {PLACEMENTS.map(p => {
                const active = placements.includes(p.key);
                return (
                  <button key={p.key} onClick={() => togglePlacement(p.key)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-[13px] font-medium transition border"
                    style={{
                      background: active ? '#E8EFEB' : '#FAF6EE',
                      borderColor: active ? '#1F4D3A' : '#E5E0D4',
                      color: active ? '#1F4D3A' : '#65736B',
                    }}>
                    <div className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                      style={{ background: active ? '#1F4D3A' : 'transparent', border: active ? 'none' : '1.5px solid #C9C3B1' }}>
                      {active && <Check size={12} strokeWidth={2.2} className="text-white" />}
                    </div>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {status ? (
                <button onClick={submit} disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-60"
                  style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
                  <RefreshCw size={13} /> {submitting ? 'Saving…' : submitted ? 'Resubmitted for review' : 'Update request'}
                </button>
              ) : (
                <button onClick={submit} disabled={submitting || submitted}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl text-[14px] font-semibold transition hover:opacity-90 disabled:opacity-60"
                  style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
                  {submitted ? <><Check size={14} strokeWidth={1.8} /> Submitted for review</> : submitting ? 'Submitting…' : 'Submit for review'}
                </button>
              )}
            </div>
            {/* Any edit re-enters review, so say so rather than letting an
                approved request quietly drop back into the queue. */}
            {status && (
              <p className="text-[12px]" style={{ color: '#65736B' }}>
                Updating resubmits this request for review.
              </p>
            )}
            {submitError && <p className="text-[12.5px]" style={{ color: '#B8423C' }}>{submitError}</p>}
          </div>
        </div>

        {/* ROI estimate */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-5" style={{ background: '#E8EFEB', border: '1px solid #C9E0D4' }}>
            {/* Impressions/clicks/registrations forecasts used to sit here,
                computed as spend × 340, × 12 and × 1.4 — multipliers with no
                basis in any measured delivery, presented to organizers as a
                projection they might spend against. Removed rather than
                re-derived: there is no delivery data to derive them from. */}
            <h3 className="font-semibold text-[14px] mb-3" style={{ color: '#0F1F18' }}>Your budget</h3>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Daily budget', val: `$${budget}` },
                { label: 'Duration', val: `${duration} days` },
                { label: 'Maximum spend', val: `$${totalSpend}` },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-[13px]">
                  <span style={{ color: '#3A4A42' }}>{row.label}</span>
                  <span className="font-semibold" style={{ color: '#0F1F18', fontFamily: 'Inter, system-ui, sans-serif' }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live preview mockup */}
          <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <div className="text-[12.5px] font-semibold mb-3 uppercase tracking-wider" style={{ color: '#65736B' }}>Feed preview</div>
            <div className="flex flex-col gap-2">
              {/* Organic card */}
              <div className="h-10 rounded-xl" style={{ background: '#F5F2EC' }} />
              {/* Promoted card */}
              <div className="rounded-xl p-2.5" style={{ background: '#E8EFEB', border: '1.5px solid #1F4D3A' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="h-3 w-24 rounded-full" style={{ background: '#C9E0D4' }} />
                  <span className="text-[11.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
                    Promoted
                  </span>
                </div>
                <div className="h-2.5 w-32 rounded-full" style={{ background: '#C9E0D4' }} />
              </div>
              {/* Organic card */}
              <div className="h-10 rounded-xl" style={{ background: '#F5F2EC' }} />
            </div>
          </div>

          {/* Placement rules */}
          <div className="rounded-2xl p-4" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <LayoutGrid size={13} style={{ color: '#65736B' }} />
              <span className="text-[12px] font-semibold" style={{ color: '#3A4A42' }}>Placement rules</span>
            </div>
            <p className="text-[12.5px]" style={{ color: '#65736B' }}>
              Every promotion is reviewed before it runs. When placement goes live, promoted events always carry a visible &ldquo;Promoted&rdquo; label and never displace more than 1 card in 5. Submitting registers your interest — nothing is charged, and we will confirm pricing with you before anything runs.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
