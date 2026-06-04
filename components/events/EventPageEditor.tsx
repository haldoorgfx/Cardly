'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Globe, MapPin, ExternalLink } from 'lucide-react';
import { TIMEZONES } from '@/lib/events/format';
import type { Database } from '@/types/database';

type EventPageRow = Database['public']['Tables']['event_pages']['Row'];

interface Props {
  eventId: string;
  eventSlug: string;
  existing: EventPageRow | null;
}

function toLocalDatetimeValue(isoString: string | null): string {
  if (!isoString) return '';
  return isoString.slice(0, 16); // "YYYY-MM-DDTHH:mm"
}

function toISOFromLocal(localValue: string): string {
  if (!localValue) return '';
  return new Date(localValue).toISOString();
}

export function EventPageEditor({ eventId, eventSlug, existing }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [coverUrl, setCoverUrl] = useState(existing?.cover_image_url ?? '');
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState('');

  const [title, setTitle] = useState(existing?.title ?? '');
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
  const [seoTitle, setSeoTitle] = useState(existing?.seo_title ?? '');
  const [seoDescription, setSeoDescription] = useState(existing?.seo_description ?? '');

  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

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

  async function handleSave() {
    setSaveError('');
    if (!title.trim()) { setSaveError('Title is required'); return; }
    if (!startsAt) { setSaveError('Start date/time is required'); return; }
    if (!endsAt) { setSaveError('End date/time is required'); return; }

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

        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        router.refresh();
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Save failed');
      }
    });
  }

  const publicSlug = customSlug.trim() || eventSlug;
  const previewUrl = `/e/${publicSlug}?preview=1&event_id=${eventId}`;

  return (
    <div className="max-w-[800px] mx-auto px-6 py-8 pb-20">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1
            className="font-display font-semibold text-[24px]"
            style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}
          >
            Event page
          </h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
            Set up the public page attendees will see before registering.
          </p>
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

      {/* ── Cover image ────────────────────────────────────────────── */}
      <Section title="Cover image">
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
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(10,20,14,0.6)' }}
            >
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
        {coverError && <p className="text-[12px] mt-1" style={{ color: '#B8423C' }}>{coverError}</p>}
      </Section>

      {/* ── Basic info ─────────────────────────────────────────────── */}
      <Section title="Basic info">
        <Field label="Event title *">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="AfriTech Summit 2026"
            className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
            style={{ background: 'white', border: `1px solid ${title ? '#E5E0D4' : '#E5E0D4'}`, color: '#0F1F18' }}
            onFocus={e => (e.target.style.borderColor = '#E8C57E')}
            onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
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
        <Field label="Description">
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Tell attendees what your event is about…"
            rows={5}
            className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none resize-none transition"
            style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18', lineHeight: 1.6 }}
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
      </Section>

      {/* ── Date & Time ────────────────────────────────────────────── */}
      <Section title="Date & time">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start *">
            <input
              type="datetime-local"
              value={startsAt}
              onChange={e => setStartsAt(e.target.value)}
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
              style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
              onFocus={e => (e.target.style.borderColor = '#E8C57E')}
              onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
            />
          </Field>
          <Field label="End *">
            <input
              type="datetime-local"
              value={endsAt}
              onChange={e => setEndsAt(e.target.value)}
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
              style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
              onFocus={e => (e.target.style.borderColor = '#E8C57E')}
              onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
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
        <Field label="Registration deadline">
          <input
            type="datetime-local"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
            style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
            onFocus={e => (e.target.style.borderColor = '#E8C57E')}
            onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
          />
          <p className="text-[12px] mt-1" style={{ color: '#6B7A72' }}>Leave blank to allow registration until the event starts.</p>
        </Field>
      </Section>

      {/* ── Location ───────────────────────────────────────────────── */}
      <Section title="Location">
        <Toggle
          label="Online event"
          description="The event will be hosted virtually."
          value={isOnline}
          onChange={setIsOnline}
          icon={<Globe size={15} strokeWidth={2} />}
        />
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
              <div className="relative">
                <MapPin size={14} strokeWidth={2} className="absolute left-3 top-3 pointer-events-none" style={{ color: '#6B7A72' }} />
                <input
                  value={venueName}
                  onChange={e => setVenueName(e.target.value)}
                  placeholder="Palais du Peuple"
                  className="w-full h-10 pl-9 pr-3 rounded-lg text-[14px] outline-none transition"
                  style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                />
              </div>
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
          </>
        )}
      </Section>

      {/* ── Capacity & visibility ──────────────────────────────────── */}
      <Section title="Capacity & visibility">
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
      </Section>

      {/* ── Payments ───────────────────────────────────────────────── */}
      <Section title="Payment processor">
        <p className="text-[13px] mb-3" style={{ color: '#6B7A72' }}>
          Choose how attendees pay for paid tickets. Free events always skip payment.
        </p>
        {[
          { value: 'stripe',       label: 'Stripe',       desc: 'Credit/debit cards worldwide. Recommended for international events.' },
          { value: 'flutterwave',  label: 'Flutterwave',  desc: 'NGN, KES, GHS, ZAR and more African currencies. Hosted redirect checkout.' },
          { value: 'waafipay',     label: 'WaafiPay',     desc: 'EVC Plus, eDahab, Somtel and Djibouti mobile money. Best for Somalia & Djibouti.' },
          { value: 'free',         label: 'Free only',    desc: 'No payment collection — all tickets must be free.' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setPaymentProcessor(opt.value as 'stripe' | 'flutterwave' | 'free')}
            className="w-full text-left flex items-start gap-3 p-4 rounded-xl mb-2 transition"
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
      </Section>

      {/* ── URL & SEO ──────────────────────────────────────────────── */}
      <Section title="URL & SEO">
        <Field label="Custom URL slug">
          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
            <span
              className="px-3 h-10 flex items-center text-[13px] shrink-0"
              style={{ background: '#F5F5F4', borderRight: '1px solid #E5E0D4', color: '#6B7A72', fontFamily: 'JetBrains Mono, monospace' }}
            >
              karta.cre8so.com/e/
            </span>
            <input
              value={customSlug}
              onChange={e => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              placeholder={eventSlug}
              className="flex-1 h-10 px-3 text-[13px] outline-none"
              style={{ background: 'white', color: '#0F1F18', fontFamily: 'JetBrains Mono, monospace' }}
            />
          </div>
          <p className="text-[12px] mt-1" style={{ color: '#6B7A72' }}>
            Leave blank to use the default: <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>{eventSlug}</code>
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
      </Section>

      {/* ── Save bar ───────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-[252px] right-0 flex items-center justify-between gap-4 px-6 py-4"
        style={{ background: 'white', borderTop: '1px solid #E5E0D4', zIndex: 40 }}
      >
        <div>
          {saveError && <p className="text-[13px]" style={{ color: '#B8423C' }}>{saveError}</p>}
          {saved && <p className="text-[13px]" style={{ color: '#2D7A4F' }}>Changes saved.</p>}
        </div>
        <div className="flex items-center gap-3">
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
            {isPending ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2
        className="font-display font-semibold text-[14px] mb-4 pb-3"
        style={{ color: '#3A4A42', letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: '1px solid #E5E0D4', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
      >
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42', letterSpacing: '0.02em' }}>
        {label}
      </label>
      {children}
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
        style={{
          width: 40, height: 22,
          background: value ? '#1F4D3A' : '#E5E0D4',
          position: 'relative',
        }}
      >
        <div
          className="absolute top-0.5 rounded-full transition-all"
          style={{
            width: 18, height: 18,
            background: 'white',
            left: value ? 20 : 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </div>
    </button>
  );
}
