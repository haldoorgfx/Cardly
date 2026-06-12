'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Globe, ExternalLink, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { PlacesAutocomplete } from '@/components/shared/PlacesAutocomplete';
import { TIMEZONES } from '@/lib/events/format';
import type { Database } from '@/types/database';

type EventPageRow = Database['public']['Tables']['event_pages']['Row'];

interface Props {
  eventId: string;
  eventSlug: string;
  eventName?: string;
  existing: EventPageRow | null;
}

function toLocalDatetimeValue(isoString: string | null): string {
  if (!isoString) return '';
  return isoString.slice(0, 16);
}

function toISOFromLocal(localValue: string): string {
  if (!localValue) return '';
  return new Date(localValue).toISOString();
}

const STEPS = [
  { id: 1, label: 'Cover & name',  short: 'Cover'       },
  { id: 2, label: 'Description',   short: 'Description' },
  { id: 3, label: 'When & where',  short: 'When & where' },
  { id: 4, label: 'Settings',      short: 'Settings'    },
];

export function EventPageEditor({ eventId, eventSlug, eventName, existing }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);

  const [coverUrl, setCoverUrl] = useState(existing?.cover_image_url ?? '');
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState('');

  const [title, setTitle] = useState(existing?.title || eventName || '');
  const [tagline, setTagline] = useState(existing?.tagline ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [venueName, setVenueName] = useState(existing?.venue_name ?? '');
  const [venueAddress, setVenueAddress] = useState(existing?.venue_address ?? '');
  const [isOnline, setIsOnline] = useState(existing?.is_online ?? false);
  const [onlineUrl, setOnlineUrl] = useState(existing?.online_url ?? '');
  const [startsAt, setStartsAt] = useState(toLocalDatetimeValue(existing?.starts_at ?? null));
  const [endsAt, setEndsAt] = useState(toLocalDatetimeValue(existing?.ends_at ?? null));
  const [timezone, setTimezone] = useState(existing?.timezone ?? 'UTC');
  const [deadline, setDeadline] = useState(toLocalDatetimeValue(existing?.registration_deadline ?? null));
  const [maxCapacity, setMaxCapacity] = useState(existing?.max_capacity?.toString() ?? '');
  const [isPublic, setIsPublic] = useState(existing?.is_public ?? true);
  const [customSlug, setCustomSlug] = useState(existing?.custom_slug ?? '');
  const [paymentProcessor, setPaymentProcessor] = useState<'stripe' | 'flutterwave' | 'waafipay' | 'free'>(
    (existing?.payment_processor as 'stripe' | 'flutterwave' | 'waafipay' | 'free') ?? 'stripe'
  );
  const [organizerName, setOrganizerName] = useState(existing?.organizer_name ?? '');
  const [city, setCity] = useState((existing as { city?: string | null } | null)?.city ?? '');
  const [category, setCategory] = useState((existing as { category?: string | null } | null)?.category ?? '');
  const [seriesName, setSeriesName] = useState((existing as { series_name?: string | null } | null)?.series_name ?? '');
  const [seoTitle, setSeoTitle] = useState(existing?.seo_title ?? '');
  const [seoDescription, setSeoDescription] = useState(existing?.seo_description ?? '');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState('');

  function fe(field: string) { return fieldErrors[field]; }

  async function handleCoverUpload(file: File) {
    setCoverUploading(true);
    setCoverError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/events/${eventId}/event-page/cover`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      setCoverUrl(data.cover_image_url);
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setCoverUploading(false);
    }
  }

  function validateStep(s: number): Record<string, string> {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!title.trim()) errs.title = 'Event title is required';
    }
    if (s === 3) {
      if (!startsAt) errs.startsAt = 'Start date is required';
      if (!endsAt) errs.endsAt = 'End date is required';
      if (startsAt && endsAt && endsAt <= startsAt) errs.endsAt = 'End must be after start';
      if (deadline && startsAt && deadline >= startsAt) errs.deadline = 'Deadline must be before the event starts';
    }
    return errs;
  }

  function goNext() {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setSaveError('');
    setStep(s => Math.min(s + 1, STEPS.length));
  }

  function goBack() {
    setFieldErrors({});
    setSaveError('');
    setStep(s => Math.max(s - 1, 1));
  }

  async function handleSave() {
    setSaveError('');
    // Validate all steps before final save
    const allErrs = { ...validateStep(1), ...validateStep(3) };
    if (Object.keys(allErrs).length > 0) {
      setFieldErrors(allErrs);
      // Jump to the first step with an error
      if (allErrs.title) { setStep(1); }
      else if (allErrs.startsAt || allErrs.endsAt || allErrs.deadline) { setStep(3); }
      return;
    }
    setFieldErrors({});

    startTransition(async () => {
      try {
        const body: Record<string, unknown> = {
          title: title.trim(),
          tagline: tagline.trim() || null,
          description: description.trim() || null,
          cover_image_url: coverUrl || null,
          venue_name: isOnline ? null : venueName.trim() || null,
          venue_address: isOnline ? null : venueAddress.trim() || null,
          is_online: isOnline,
          online_url: isOnline ? (onlineUrl.trim() || null) : null,
          starts_at: toISOFromLocal(startsAt),
          ends_at: toISOFromLocal(endsAt),
          timezone,
          registration_deadline: deadline ? toISOFromLocal(deadline) : null,
          max_capacity: maxCapacity ? parseInt(maxCapacity) : null,
          is_public: isPublic,
          custom_slug: customSlug.trim() || null,
          payment_processor: paymentProcessor,
          organizer_name: organizerName.trim() || null,
          city: city.trim() || null,
          category: category.trim() || null,
          series_name: seriesName.trim() || null,
          seo_title: seoTitle.trim() || null,
          seo_description: seoDescription.trim() || null,
        };

        const res = await fetch(`/api/events/${eventId}/event-page`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Save failed');

        router.push(`/events/${eventId}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Save failed';
        // Never show raw DB errors to users
        if (msg.includes('unique constraint') || msg.includes('duplicate key')) {
          setSaveError('This event page already exists. Please refresh and try again.');
        } else if (msg.includes('not null') || msg.includes('violates')) {
          setSaveError('Some required fields are missing. Please check your inputs.');
        } else {
          setSaveError(msg);
        }
      }
    });
  }

  const publicSlug = customSlug.trim() || eventSlug;
  const previewUrl = `/e/${publicSlug}?preview=1&event_id=${eventId}`;
  const isLastStep = step === STEPS.length;

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8 pb-28">

      {/* -- Step header ----------------------------------------------- */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-[11px] font-mono font-medium mb-1" style={{ color: '#6B7A72', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Step {step} of {STEPS.length}
          </p>
          <h1 className="font-display font-semibold text-[22px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            {STEPS[step - 1].label}
          </h1>
        </div>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-medium rounded-lg border transition hover:border-[#1F4D3A] hover:text-[#1F4D3A]"
          style={{ borderColor: '#E5E0D4', color: '#3A4A42', background: 'white' }}
        >
          <ExternalLink size={13} strokeWidth={2} />
          Preview
        </a>
      </div>

      {/* -- Progress dots ----------------------------------------------- */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => {
                if (s.id < step) { setStep(s.id); setFieldErrors({}); setSaveError(''); }
              }}
              disabled={s.id > step}
              className="flex items-center gap-1.5 transition"
            >
              <div
                className="flex items-center justify-center rounded-full transition-all"
                style={{
                  width: 24, height: 24,
                  background: s.id < step ? '#1F4D3A' : s.id === step ? '#1F4D3A' : '#E5E0D4',
                  flexShrink: 0,
                }}
              >
                {s.id < step
                  ? <Check size={12} strokeWidth={3} color="white" />
                  : <span className="text-[11px] font-semibold" style={{ color: s.id === step ? 'white' : '#6B7A72' }}>{s.id}</span>
                }
              </div>
              <span
                className="text-[12px] font-medium hidden sm:block"
                style={{ color: s.id === step ? '#0F1F18' : s.id < step ? '#1F4D3A' : '#6B7A72' }}
              >
                {s.short}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className="h-px w-8 flex-shrink-0" style={{ background: s.id < step ? '#1F4D3A' : '#E5E0D4' }} />
            )}
          </div>
        ))}
      </div>

      {/* -- Step 1: Cover & name --------------------------------------- */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Cover image */}
          <div
            className="relative rounded-xl overflow-hidden cursor-pointer group transition"
            style={{
              height: 220,
              background: coverUrl ? 'transparent' : 'linear-gradient(160deg, #0D2018 0%, #1F4D3A 50%, #2A6A50 100%)',
              border: '1px solid #E5E0D4',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 transition"
              style={{
                background: coverUrl ? 'rgba(10,20,14,0.45)' : 'transparent',
                opacity: coverUrl ? 0 : 1,
              }}
            >
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                <Upload size={18} strokeWidth={2} color="white" />
              </div>
              <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Click to upload cover image
              </span>
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>PNG, JPG or WebP · Max 10 MB</span>
            </div>
            {coverUrl && (
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                style={{ background: 'rgba(10,20,14,0.5)' }}
              >
                <div
                  className="flex items-center gap-2 h-9 px-4 rounded-lg text-white text-[13px] font-medium"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                >
                  <Upload size={14} strokeWidth={2} />
                  Change image
                </div>
              </div>
            )}
            {coverUploading && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(10,20,14,0.6)' }}>
                <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
                </svg>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleCoverUpload(file);
              e.target.value = '';
            }}
          />
          {coverError && <p className="text-[12px]" style={{ color: '#B8423C' }}>{coverError}</p>}

          <Field label="Event title *" error={fe('title')}>
            <input
              value={title}
              onChange={e => { setTitle(e.target.value); if (fieldErrors.title) setFieldErrors(p => ({ ...p, title: '' })); }}
              placeholder="AfriTech Summit 2026"
              autoFocus
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
              style={{ background: 'white', border: `1px solid ${fe('title') ? '#B8423C' : '#E5E0D4'}`, color: '#0F1F18' }}
              onFocus={e => (e.target.style.borderColor = fe('title') ? '#B8423C' : '#E8C57E')}
              onBlur={e => (e.target.style.borderColor = fe('title') ? '#B8423C' : '#E5E0D4')}
            />
          </Field>

          <Field label="Tagline">
            <input
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              placeholder="Africa's largest technology conference"
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
              style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
              onFocus={e => (e.target.style.borderColor = '#E8C57E')}
              onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
            />
          </Field>

          <Field label="Organizer name">
            <input
              value={organizerName}
              onChange={e => setOrganizerName(e.target.value)}
              placeholder="TechHub Africa"
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
              style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
              onFocus={e => (e.target.style.borderColor = '#E8C57E')}
              onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
            />
          </Field>

          <Field label="Category">
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none"
              style={{ background: 'white', border: '1px solid #E5E0D4', color: category ? '#0F1F18' : '#6B7A72' }}
            >
              <option value="">Select a category</option>
              {['Tech', 'Music', 'Business', 'Culture', 'Food', 'Sports', 'Health', 'Film', 'Education'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {/* -- Step 2: Description ---------------------------------------- */}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-[13px]" style={{ color: '#6B7A72' }}>
            Tell attendees what makes this event worth attending.
          </p>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Tell attendees what your event is about…"
            rows={16}
            autoFocus
            className="w-full px-4 py-3 rounded-xl text-[14px] outline-none resize-none transition"
            style={{
              background: 'white',
              border: '1px solid #E5E0D4',
              color: '#0F1F18',
              lineHeight: 1.7,
            }}
            onFocus={e => (e.target.style.borderColor = '#E8C57E')}
            onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
          />
          <p className="text-[12px]" style={{ color: '#6B7A72' }}>
            {description.length} characters
          </p>
        </div>
      )}

      {/* -- Step 3: When & where --------------------------------------- */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Start *" error={fe('startsAt')}>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={e => { setStartsAt(e.target.value); setFieldErrors(p => ({ ...p, startsAt: '', endsAt: '' })); }}
                className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
                style={{ background: 'white', border: `1px solid ${fe('startsAt') ? '#B8423C' : '#E5E0D4'}`, color: '#0F1F18' }}
                onFocus={e => (e.target.style.borderColor = fe('startsAt') ? '#B8423C' : '#E8C57E')}
                onBlur={e => (e.target.style.borderColor = fe('startsAt') ? '#B8423C' : '#E5E0D4')}
              />
            </Field>
            <Field label="End *" error={fe('endsAt')}>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={e => { setEndsAt(e.target.value); setFieldErrors(p => ({ ...p, endsAt: '' })); }}
                className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
                style={{ background: 'white', border: `1px solid ${fe('endsAt') ? '#B8423C' : '#E5E0D4'}`, color: '#0F1F18' }}
                onFocus={e => (e.target.style.borderColor = fe('endsAt') ? '#B8423C' : '#E8C57E')}
                onBlur={e => (e.target.style.borderColor = fe('endsAt') ? '#B8423C' : '#E5E0D4')}
              />
            </Field>
          </div>

          <Field label="Timezone">
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
              style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Registration deadline" error={fe('deadline')}>
            <input
              type="datetime-local"
              value={deadline}
              onChange={e => { setDeadline(e.target.value); setFieldErrors(p => ({ ...p, deadline: '' })); }}
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
              style={{ background: 'white', border: `1px solid ${fe('deadline') ? '#B8423C' : '#E5E0D4'}`, color: '#0F1F18' }}
              onFocus={e => (e.target.style.borderColor = fe('deadline') ? '#B8423C' : '#E8C57E')}
              onBlur={e => (e.target.style.borderColor = fe('deadline') ? '#B8423C' : '#E5E0D4')}
            />
            {!fe('deadline') && <p className="text-[12px] mt-1" style={{ color: '#6B7A72' }}>Leave blank to allow registration until the event starts.</p>}
          </Field>

          <div style={{ borderTop: '1px solid #E5E0D4', paddingTop: 24 }}>
            <Toggle
              label="Online event"
              description="The event will be hosted virtually."
              value={isOnline}
              onChange={setIsOnline}
              icon={<Globe size={15} strokeWidth={2} />}
            />
          </div>

          {isOnline ? (
            <Field label="Online event URL">
              <input
                value={onlineUrl}
                onChange={e => setOnlineUrl(e.target.value)}
                placeholder="https://zoom.us/j/..."
                className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition font-mono"
                style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18', fontSize: 13 }}
                onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
              />
              <p className="text-[12px] mt-1" style={{ color: '#6B7A72' }}>Only shared with registered attendees.</p>
            </Field>
          ) : (
            <>
              <Field label="Venue name">
                <PlacesAutocomplete
                  value={venueName}
                  onChange={v => setVenueName(v)}
                  onPlaceSelected={p => {
                    setVenueName(p.venue_name || p.venue_address);
                    if (p.venue_address) setVenueAddress(p.venue_address);
                    if (p.city) setCity(p.city);
                  }}
                  placeholder="Search a venue or address"
                />
              </Field>
              <Field label="Venue address">
                <input
                  value={venueAddress}
                  onChange={e => setVenueAddress(e.target.value)}
                  placeholder="Place du 27 Juin, Djibouti City"
                  className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
                  style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                />
              </Field>
              <Field label="City">
                <input
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Djibouti City"
                  className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
                  style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                />
              </Field>
              <Field label="Series name">
                <input
                  value={seriesName}
                  onChange={e => setSeriesName(e.target.value)}
                  placeholder="Leave blank if standalone event"
                  className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
                  style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                />
              </Field>
            </>
          )}
        </div>
      )}

      {/* -- Step 4: Settings ------------------------------------------- */}
      {step === 4 && (
        <div className="space-y-8">
          {/* Capacity & visibility */}
          <div>
            <SectionLabel>Capacity &amp; visibility</SectionLabel>
            <div className="space-y-4">
              <Field label="Max attendees">
                <input
                  type="number"
                  value={maxCapacity}
                  onChange={e => setMaxCapacity(e.target.value)}
                  placeholder="Leave blank for unlimited"
                  min={1}
                  className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
                  style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                />
              </Field>
              <Toggle
                label="Public event"
                description="Visible in the discovery feed and accessible by anyone with the link."
                value={isPublic}
                onChange={setIsPublic}
              />
              {!isPublic && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(201,122,45,0.08)', border: '1px solid rgba(201,122,45,0.25)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C97A2D" strokeWidth="2" className="shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p className="text-[13px]" style={{ color: '#C97A2D' }}>
                    <strong>Registration page is hidden.</strong> Attendees cannot find or access this event until you turn on &ldquo;Public event&rdquo;.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment processor */}
          <div>
            <SectionLabel>Payment processor</SectionLabel>
            <p className="text-[13px] mb-3" style={{ color: '#6B7A72' }}>
              Choose how attendees pay for paid tickets. Free events always skip payment.
            </p>
            <div className="space-y-2">
              {[
                { value: 'stripe',      label: 'Stripe',      desc: 'Credit/debit cards worldwide. Recommended for international events.' },
                { value: 'flutterwave', label: 'Flutterwave', desc: 'Accepts local African currencies (KES, GHS, ZAR, etc.). Ticket prices in USD, charged in local currency.' },
                { value: 'waafipay',    label: 'WaafiPay',    desc: 'EVC Plus, eDahab, Somtel and Djibouti mobile money. Best for Somalia & Djibouti.' },
                { value: 'free',        label: 'Free only',   desc: 'No payment collection — all tickets must be free.' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPaymentProcessor(opt.value as 'stripe' | 'flutterwave' | 'waafipay' | 'free')}
                  className="w-full text-left flex items-start gap-3 p-4 rounded-xl transition"
                  style={{
                    border: paymentProcessor === opt.value ? '2px solid #1F4D3A' : '1px solid #E5E0D4',
                    background: paymentProcessor === opt.value ? 'rgba(31,77,58,0.04)' : 'white',
                  }}
                >
                  <div
                    className="mt-0.5 shrink-0 rounded-full flex items-center justify-center"
                    style={{
                      width: 18, height: 18,
                      border: paymentProcessor === opt.value ? '1.5px solid #1F4D3A' : '1.5px solid #C9C3B1',
                      background: paymentProcessor === opt.value ? '#1F4D3A' : 'transparent',
                    }}
                  >
                    {paymentProcessor === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <div className="text-[14px] font-medium" style={{ color: '#0F1F18' }}>{opt.label}</div>
                    <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* URL & SEO */}
          <div>
            <SectionLabel>URL &amp; SEO</SectionLabel>
            <div className="space-y-4">
              <Field label="Custom URL slug">
                <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
                  <span
                    className="px-3 h-10 flex items-center text-[13px] shrink-0"
                    style={{ background: '#F5F5F4', borderRight: '1px solid #E5E0D4', color: '#6B7A72', fontFamily: 'Inter, system-ui, sans-serif' }}
                  >
                    karta.cre8so.com/e/
                  </span>
                  <input
                    value={customSlug}
                    onChange={e => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder={eventSlug}
                    className="flex-1 h-10 px-3 text-[13px] outline-none"
                    style={{ background: 'white', color: '#0F1F18', fontFamily: 'Inter, system-ui, sans-serif' }}
                  />
                </div>
                <p className="text-[12px] mt-1" style={{ color: '#6B7A72' }}>
                  Leave blank to use the default: <code style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{eventSlug}</code>
                </p>
              </Field>
              <Field label="SEO title">
                <input
                  value={seoTitle}
                  onChange={e => setSeoTitle(e.target.value)}
                  placeholder={`${title || 'Event title'} — Karta`}
                  className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
                  style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                />
              </Field>
              <Field label="SEO description">
                <textarea
                  value={seoDescription}
                  onChange={e => setSeoDescription(e.target.value)}
                  placeholder="Short description for search engines and social previews."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none resize-none transition"
                  style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                />
              </Field>
            </div>
          </div>
        </div>
      )}

      {/* -- Bottom nav bar --------------------------------------------- */}
      <div
        className="fixed bottom-0 left-[252px] right-0 flex items-center justify-between gap-4 px-6 py-4"
        style={{ background: 'white', borderTop: '1px solid #E5E0D4', zIndex: 40 }}
      >
        <div className="flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={goBack}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium border transition hover:border-[#1F4D3A] hover:text-[#1F4D3A]"
              style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}
            >
              <ChevronLeft size={14} strokeWidth={2} />
              Back
            </button>
          )}
          {(Object.keys(fieldErrors).length > 0 || saveError) && (
            <p className="text-[13px]" style={{ color: '#B8423C' }}>
              {saveError || 'Please fix the highlighted fields above'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isLastStep ? (
            <>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium border transition hover:border-[#1F4D3A] hover:text-[#1F4D3A]"
                style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}
              >
                <ExternalLink size={12} strokeWidth={2} />
                Preview
              </a>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex items-center h-9 px-5 rounded-lg text-white text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-60"
                style={{ background: '#1F4D3A' }}
              >
                {isPending ? 'Saving…' : 'Save changes'}
              </button>
            </>
          ) : (
            <button
              onClick={goNext}
              className="inline-flex items-center gap-1.5 h-9 px-5 rounded-lg text-white text-[13px] font-semibold transition hover:opacity-90"
              style={{ background: '#1F4D3A' }}
            >
              Next
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* -- Helpers -- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-4 pb-3"
      style={{
        color: '#3A4A42',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        borderBottom: '1px solid #E5E0D4',
        fontSize: 11,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 600,
      }}
    >
      {children}
    </h2>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="block text-[12px] font-medium mb-1.5" style={{ color: error ? '#B8423C' : '#3A4A42', letterSpacing: '0.02em' }}>
        {label}
      </label>
      {children}
      {error && <p className="text-[12px] mt-1 font-medium" style={{ color: '#B8423C' }}>{error}</p>}
    </div>
  );
}

function Toggle({
  label, description, value, onChange, icon,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full flex items-center gap-3 p-4 rounded-xl transition text-left"
      style={{ border: '1px solid #E5E0D4', background: value ? 'rgba(31,77,58,0.04)' : 'white' }}
    >
      {icon && <span style={{ color: value ? '#1F4D3A' : '#6B7A72' }}>{icon}</span>}
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium" style={{ color: '#0F1F18' }}>{label}</div>
        <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>{description}</div>
      </div>
      <div
        className="shrink-0 rounded-full transition-all"
        style={{ width: 40, height: 22, background: value ? '#1F4D3A' : '#E5E0D4', position: 'relative' }}
      >
        <div
          className="absolute top-0.5 rounded-full transition-all"
          style={{ width: 18, height: 18, background: 'white', left: value ? 20 : 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
        />
      </div>
    </button>
  );
}
