'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Copy, AlertTriangle, Trash2, X, MapPin, ArrowRight } from 'lucide-react';
import { PlacesAutocomplete, type PlaceResult } from '@/components/shared/PlacesAutocomplete';
import { EventFeaturesManager } from '@/components/events/EventFeaturesManager';

interface EventData {
  id: string;
  name: string;
  slug: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  max_capacity: number | null;
  is_public: boolean;
  is_online: boolean;
  require_approval: boolean;
  show_remaining_tickets: boolean;
  payment_processors: string[];
  venue_name: string | null;
  venue_address: string | null;
  venue_lat: number | null;
  venue_lng: number | null;
  city: string | null;
  country: string | null;
  timezone: string;
  fee_bearer: 'absorb' | 'pass';
}

interface Props {
  event: EventData;
}

type Tab = 'general' | 'features' | 'registration' | 'privacy' | 'danger';

const TABS: { id: Tab; label: string }[] = [
  { id: 'general',      label: 'General'      },
  { id: 'features',     label: 'Features'     },
  { id: 'registration', label: 'Registration' },
  { id: 'privacy',      label: 'Privacy'      },
  { id: 'danger',       label: 'Danger zone'  },
];

type PaymentProcessor = 'stripe' | 'flutterwave' | 'waafipay';

const PAYMENT_METHODS: { value: PaymentProcessor; label: string; desc: string }[] = [
  { value: 'stripe',      label: 'Card (Stripe)',          desc: 'Visa, Mastercard, Apple Pay, Google Pay — worldwide' },
  { value: 'waafipay',    label: 'Mobile money (WaafiPay)', desc: 'EVC Plus, eDahab, Somtel — Somalia & Djibouti' },
  { value: 'flutterwave', label: 'Flutterwave',            desc: 'Card, bank transfer, USSD — African currencies' },
];

function toLocalDate(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventSettingsView({ event }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('general');
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // General
  const [name, setName] = useState(event.name);
  const [startsAt, setStartsAt] = useState(toLocalDate(event.starts_at));
  const [endsAt, setEndsAt] = useState(toLocalDate(event.ends_at));
  const [venue, setVenue] = useState(event.venue_name ?? '');
  const [placeData, setPlaceData] = useState<PlaceResult | null>(
    event.venue_lat && event.venue_lng ? {
      venue_name: event.venue_name ?? '',
      venue_address: event.venue_address ?? '',
      city: event.city ?? '',
      country: event.country ?? '',
      lat: event.venue_lat,
      lng: event.venue_lng,
    } : null
  );
  const [timezone, setTimezone] = useState(event.timezone);
  const [capacity, setCapacity] = useState(event.max_capacity?.toString() ?? '');

  // Registration — require_approval and show_remaining_tickets are real DB columns
  const [requireApproval, setRequireApproval] = useState(event.require_approval);
  const [showRemainingTickets, setShowRemainingTickets] = useState(event.show_remaining_tickets);

  // Payment methods buyers can use at checkout. Defaults to Card (Stripe) so existing
  // events behave exactly as before. At least one must stay selected.
  const validProcessors = new Set<PaymentProcessor>(['stripe', 'flutterwave', 'waafipay']);
  const [paymentProcessors, setPaymentProcessors] = useState<PaymentProcessor[]>(() => {
    const initial = (event.payment_processors ?? []).filter((p): p is PaymentProcessor => validProcessors.has(p as PaymentProcessor));
    return initial.length ? initial : ['stripe'];
  });
  function togglePaymentProcessor(value: PaymentProcessor) {
    setPaymentProcessors(prev => {
      if (prev.includes(value)) {
        // Don't allow removing the last method — always keep at least one.
        if (prev.length === 1) return prev;
        return prev.filter(p => p !== value);
      }
      // Preserve display order from PAYMENT_METHODS.
      const next = [...prev, value];
      return PAYMENT_METHODS.map(m => m.value).filter(v => next.includes(v));
    });
  }

  // Platform fee — who bears Eventera's per-ticket fee. Saves instantly.
  const [passFee, setPassFee] = useState(event.fee_bearer === 'pass');
  function savePassFee(v: boolean) {
    setPassFee(v);
    fetch(`/api/events/${event.id}/checkout-settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fee_bearer: v ? 'pass' : 'absorb' }),
    }).catch(() => setPassFee(!v));
  }

  // Privacy
  const [isPublic, setIsPublic] = useState(event.is_public);

  // Danger zone
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleteConfirm !== event.name) {
      setDeleteError('Event name does not match');
      return;
    }
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? 'Delete failed');
      }
      router.push('/dashboard');
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Delete failed');
      setDeleting(false);
    }
  }

  async function handleSave() {
    setError('');
    startTransition(async () => {
      try {
        // event_pages fields (location, dates, capacity, visibility)
        const pageRes = await fetch(`/api/events/${event.id}/event-page`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title:         name.trim(),
            starts_at:     startsAt ? new Date(startsAt).toISOString() : null,
            ends_at:       endsAt   ? new Date(endsAt).toISOString()   : null,
            max_capacity:           capacity ? parseInt(capacity) : null,
            is_public:              isPublic,
            payment_processors:     paymentProcessors,
            timezone,
            venue_name:    placeData?.venue_name    ?? (venue.trim() || null),
            venue_address: placeData?.venue_address ?? null,
            venue_lat:     placeData?.lat           ?? null,
            venue_lng:     placeData?.lng           ?? null,
            city:          placeData?.city          ?? null,
            country:       placeData?.country       ?? null,
          }),
        });
        if (!pageRes.ok) {
          const d = await pageRes.json();
          throw new Error(d.error ?? 'Save failed');
        }

        // Approval / scarcity toggles live on the events table (checkout_* columns),
        // not event_pages — save them through the dedicated checkout-settings route.
        const csRes = await fetch(`/api/events/${event.id}/checkout-settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkout_require_approval: requireApproval,
            checkout_show_remaining:   showRemainingTickets,
          }),
        });
        if (!csRes.ok) {
          const d = await csRes.json();
          throw new Error(d.error ?? 'Save failed');
        }

        // events table fields (name only)
        if (name.trim() !== event.name) {
          const evRes = await fetch(`/api/events/${event.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.trim() }),
          });
          if (!evRes.ok) {
            const d = await evRes.json();
            throw new Error(d.error ?? 'Save failed');
          }
        }

        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Save failed');
      }
    });
  }

  const statusBadge = {
    published: { label: 'Live', bg: 'rgba(45,122,79,0.12)', color: '#2D7A4F', dot: '#2D7A4F' },
    draft:     { label: 'Draft', bg: 'rgba(201,122,45,0.12)', color: '#C97A2D', dot: '#C97A2D' },
    archived:  { label: 'Archived', bg: '#F5F0E8', color: '#6B7A72', dot: '#6B7A72' },
  }[event.status] ?? { label: event.status, bg: '#F5F0E8', color: '#6B7A72', dot: '#6B7A72' };

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 pb-24">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-semibold text-[22px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            Settings
          </h1>
          <p className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>{event.name}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-white text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-60"
          style={{ background: '#1F4D3A' }}
        >
          <Check size={14} strokeWidth={2.5} />
          {isPending ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
        </button>
      </div>

      {/* Tabs — sticky so they stay visible when scrolling */}
      <div className="sticky top-0 z-10 -mx-6 px-6 py-2.5 mb-4 overflow-x-auto" style={{ background: '#FAF6EE' }}>
        <div className="flex gap-1 p-1 rounded-xl whitespace-nowrap" style={{ background: '#F5F0E8', display: 'inline-flex' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="h-8 px-4 rounded-lg text-[13px] font-medium transition"
              style={{
                background: tab === t.id ? 'white' : 'transparent',
                color: tab === t.id ? '#0F1F18' : '#6B7A72',
                boxShadow: tab === t.id ? '0 1px 3px rgba(15,31,24,0.08)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mb-4 text-[13px]" style={{ color: '#B8423C' }}>{error}</p>}

      {/* General tab */}
      {tab === 'general' && (
        <div className="space-y-5">
          <Panel title="Event details">
            <div className="space-y-4">
              <Field label="Event name">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
                  style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Starts">
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={e => setStartsAt(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-[13px] outline-none transition"
                    style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                    onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                    onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                  />
                </Field>
                <Field label="Ends">
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={e => setEndsAt(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-[13px] outline-none transition"
                    style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                    onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                    onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                  />
                </Field>
              </div>
              <Field label="Venue">
                <PlacesAutocomplete
                  value={venue}
                  onChange={v => { setVenue(v); if (!v) setPlaceData(null); }}
                  onPlaceSelected={p => { setPlaceData(p); setVenue(p.venue_name || p.venue_address); }}
                  placeholder="Search venue name or address"
                />
                {placeData?.venue_address && (
                  <p className="mt-1 text-[12px] pl-1" style={{ color: '#6B7A72' }}>
                    <span className="inline-flex items-center gap-1"><MapPin size={11} />{placeData.venue_address}</span>
                  </p>
                )}
              </Field>
              <Field label="Timezone">
                <input
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
                  style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Capacity & status">
            <div className="space-y-3">
              <InfoRow label="Status" last={false}>
                <span
                  className="inline-flex items-center gap-1.5 h-5 px-2 rounded-full text-[11px] font-medium"
                  style={{ background: statusBadge.bg, color: statusBadge.color }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusBadge.dot }} />
                  {statusBadge.label}
                </span>
              </InfoRow>
              <InfoRow label="Capacity" last={false}>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={capacity}
                    onChange={e => setCapacity(e.target.value)}
                    placeholder="Unlimited"
                    min={1}
                    className="w-28 h-8 px-2.5 rounded-lg text-[13px] outline-none transition text-right"
                    style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                    onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                    onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                  />
                  <span className="text-[12px]" style={{ color: '#6B7A72' }}>attendees</span>
                </div>
              </InfoRow>
              <InfoRow label="Waitlist" desc="When your event fills up, attendees can join a waitlist. Manage it here." last>
                <Link
                  href={`/events/${event.slug}/waitlist`}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] font-medium border transition hover:border-[#1F4D3A]/50"
                  style={{ borderColor: '#E5E0D4', color: '#1F4D3A' }}
                >
                  Manage waitlist
                  <ArrowRight size={13} strokeWidth={2} />
                </Link>
              </InfoRow>
            </div>
          </Panel>
        </div>
      )}

      {/* Features tab */}
      {tab === 'features' && (
        <EventFeaturesManager eventId={event.id} />
      )}

      {/* Registration tab */}
      {tab === 'registration' && (
        <Panel title="Registration form">
          <div className="space-y-0">
            <InfoRow label="Require approval" desc="Manually approve each registration before it's confirmed" last={false}>
              <Toggle value={requireApproval} onChange={setRequireApproval} />
            </InfoRow>
            <InfoRow label="Show remaining tickets" desc="Display how many spots are left on the public page" last>
              <Toggle value={showRemainingTickets} onChange={setShowRemainingTickets} />
            </InfoRow>
          </div>

          {/* Payment methods — which processors buyers can use for paid tickets */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #F0EDE7' }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#6B7A72', letterSpacing: '0.06em' }}>Payment methods</div>
            <p className="text-[12px] mb-3" style={{ color: '#6B7A72' }}>
              Which methods buyers can use to pay for paid tickets. Free tickets skip payment entirely.
            </p>
            <div className="space-y-2.5">
              {PAYMENT_METHODS.map(m => {
                const checked = paymentProcessors.includes(m.value);
                const isLastSelected = checked && paymentProcessors.length === 1;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => togglePaymentProcessor(m.value)}
                    disabled={isLastSelected}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition"
                    style={{
                      background: checked ? 'rgba(31,77,58,0.04)' : 'white',
                      border: checked ? '1.5px solid #1F4D3A' : '1px solid #E5E0D4',
                      cursor: isLastSelected ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <div
                      className="shrink-0 rounded-md grid place-items-center transition"
                      style={{
                        width: 18, height: 18,
                        background: checked ? '#1F4D3A' : 'white',
                        border: checked ? '1.5px solid #1F4D3A' : '1.5px solid #C9C3B1',
                      }}
                    >
                      {checked && <Check size={12} strokeWidth={3} style={{ color: 'white' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-medium" style={{ color: '#0F1F18' }}>{m.label}</p>
                      <p className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>{m.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] mt-2" style={{ color: '#9BA8A1' }}>
              At least one method must stay enabled. Save changes to apply.
            </p>
          </div>

          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #F0EDE7' }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#6B7A72', letterSpacing: '0.06em' }}>Platform fee</div>
            <InfoRow
              label="Pass the platform fee to attendees"
              desc={passFee
                ? "Eventera's fee is added on top at checkout — you keep 100% of your ticket price."
                : "You absorb Eventera's fee — attendees pay the exact ticket price, the fee comes out of your revenue."}
              last
            >
              <Toggle value={passFee} onChange={savePassFee} />
            </InfoRow>
          </div>
        </Panel>
      )}

      {/* Privacy tab */}
      {tab === 'privacy' && (
        <Panel title="Visibility & privacy">
          <div className="space-y-0">
            <InfoRow label="Public event page" desc="Listed and discoverable on Eventera" last>
              <Toggle value={isPublic} onChange={setIsPublic} />
            </InfoRow>
          </div>
        </Panel>
      )}

      {/* Danger zone tab */}
      {tab === 'danger' && (
        <div className="space-y-3">
          <DangerCard
            title="Duplicate event"
            desc="Create a copy of this event with the same settings and ticket types."
            action={
              <button disabled className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium border transition opacity-40 cursor-not-allowed" style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}>
                <Copy size={13} strokeWidth={2} /> Duplicate
              </button>
            }
          />
          <DangerCard
            title="Archive event"
            desc="Hide this event from your dashboard without deleting any data."
            action={
              <button
                onClick={async () => {
                  const res = await fetch(`/api/events/${event.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'archived' }),
                  });
                  if (res.ok) router.push('/dashboard');
                }}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium border transition hover:border-[#C97A2D]/60"
                style={{ borderColor: '#FBD38D', color: '#C97A2D' }}
              >
                <AlertTriangle size={13} strokeWidth={2} /> Archive
              </button>
            }
          />
          <DangerCard
            title="Delete event"
            desc="Permanently remove this event and all its data. Can't be undone."
            danger
            action={
              <button
                onClick={() => { setDeleteOpen(true); setDeleteConfirm(''); setDeleteError(''); }}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium border transition hover:border-[#B8423C]/60"
                style={{ borderColor: '#FCA5A5', color: '#B8423C' }}
              >
                <Trash2 size={13} strokeWidth={2} /> Delete
              </button>
            }
          />
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-[460px] p-6" style={{ border: '1px solid #E5E0D4', boxShadow: '0 8px 40px rgba(15,31,24,0.18)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: 'rgba(184,66,60,0.1)' }}>
                  <Trash2 size={16} strokeWidth={2} style={{ color: '#B8423C' }} />
                </div>
                <h3 className="font-display text-[16px] font-semibold" style={{ color: '#0F1F18' }}>Delete event</h3>
              </div>
              <button onClick={() => setDeleteOpen(false)} className="h-7 w-7 rounded-lg grid place-items-center hover:bg-[#F5F3EE]" style={{ color: '#6B7A72' }}>
                <X size={14} strokeWidth={2.2} />
              </button>
            </div>

            <p className="text-[13px] mb-1" style={{ color: '#6B7A72' }}>
              This will permanently delete <strong style={{ color: '#0F1F18' }}>{event.name}</strong> and all its data — registrations, tickets, sessions, and media. This cannot be undone.
            </p>
            <p className="text-[13px] mb-4" style={{ color: '#6B7A72' }}>
              Type <strong style={{ color: '#0F1F18' }}>{event.name}</strong> to confirm.
            </p>

            <input
              value={deleteConfirm}
              onChange={e => { setDeleteConfirm(e.target.value); setDeleteError(''); }}
              placeholder={event.name}
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none mb-3"
              style={{ border: `1.5px solid ${deleteError ? '#B8423C' : '#E5E0D4'}`, background: 'white', color: '#0F1F18' }}
            />
            {deleteError && <p className="text-[12px] mb-3" style={{ color: '#B8423C' }}>{deleteError}</p>}

            <div className="flex gap-3">
              <button onClick={() => setDeleteOpen(false)} className="flex-1 h-10 rounded-xl text-[13px] font-medium border transition" style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || deleteConfirm !== event.name}
                className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white transition disabled:opacity-40"
                style={{ background: '#B8423C' }}
              >
                {deleting ? 'Deleting…' : 'Delete event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Helpers ── */

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4', background: 'white' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
        <h3 className="text-[13px] font-semibold" style={{ color: '#0F1F18' }}>{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>{label}</label>
      {children}
    </div>
  );
}

function InfoRow({ label, desc, last, children }: { label: string; desc?: string; last: boolean; children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between gap-4 py-3.5"
      style={{ borderBottom: last ? 'none' : '1px solid #F5F0E8' }}
    >
      <div>
        <p className="text-[13.5px] font-medium" style={{ color: '#0F1F18' }}>{label}</p>
        {desc && <p className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="shrink-0 rounded-full transition-all"
      style={{ width: 40, height: 22, background: value ? '#1F4D3A' : '#E5E0D4', position: 'relative' }}
    >
      <div
        className="absolute top-0.5 rounded-full transition-all"
        style={{ width: 18, height: 18, background: 'white', left: value ? 20 : 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
      />
    </button>
  );
}

function DangerCard({ title, desc, action, danger }: { title: string; desc: string; action: React.ReactNode; danger?: boolean }) {
  return (
    <div
      className="flex items-start sm:items-center justify-between gap-4 flex-wrap p-5 rounded-2xl"
      style={{
        background: danger ? 'rgba(184,66,60,0.04)' : 'white',
        border: danger ? '1px solid rgba(184,66,60,0.2)' : '1px solid #E5E0D4',
      }}
    >
      <div>
        <p className="text-[14px] font-semibold font-display" style={{ color: danger ? '#B8423C' : '#0F1F18' }}>{title}</p>
        <p className="text-[12.5px] mt-0.5" style={{ color: danger ? 'rgba(184,66,60,0.7)' : '#6B7A72' }}>{desc}</p>
      </div>
      {action}
    </div>
  );
}
