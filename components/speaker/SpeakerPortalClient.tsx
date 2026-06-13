'use client';

import { useState, useRef } from 'react';
import {
  Home, User, Calendar, CreditCard, FileText,
  CheckCircle2, Circle, Upload, Share2, Download,
  ExternalLink, Camera,
} from 'lucide-react';

interface Speaker {
  id: string;
  name: string;
  headline: string | null;
  bio: string | null;
  photo_url: string | null;
  company: string | null;
  role: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  speaker_type: string;
}

interface EventInfo {
  id: string;
  name: string;
  slug: string;
  starts_at: string | null;
  ends_at: string | null;
}

interface Session {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  room: string | null;
  session_type: string;
  tracks?: { name: string } | null;
}

interface Resource {
  id: string;
  title: string;
  url: string;
  file_type: string | null;
  file_size: number | null;
}

interface Props {
  speaker: Speaker;
  event: EventInfo;
  sessions: Session[];
  resources: Resource[];
}

type Tab = 'home' | 'profile' | 'sessions' | 'card' | 'resources';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <Home size={15} strokeWidth={2} /> },
  { id: 'profile', label: 'My Profile', icon: <User size={15} strokeWidth={2} /> },
  { id: 'sessions', label: 'My Sessions', icon: <Calendar size={15} strokeWidth={2} /> },
  { id: 'card', label: 'My Card', icon: <CreditCard size={15} strokeWidth={2} /> },
  { id: 'resources', label: 'Resources', icon: <FileText size={15} strokeWidth={2} /> },
];

function fmt(dt: string) {
  return new Date(dt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function fmtTime(dt: string) {
  return new Date(dt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
function fileSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


/* ── Speaker Card ──────────────────────────────────────────────────── */
function SpeakerCard({ speaker, event, size = 'lg' }: { speaker: Speaker; event: EventInfo; size?: 'sm' | 'lg' }) {
  const w = size === 'lg' ? 240 : 140;
  const h = size === 'lg' ? 300 : 175;
  const initials = speaker.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const fontSize = size === 'lg' ? 18 : 11;
  const subSize = size === 'lg' ? 12 : 8;
  const avatarSize = size === 'lg' ? 72 : 44;
  const initialsSize = size === 'lg' ? 28 : 16;

  return (
    <div
      style={{
        width: w, height: h,
        background: 'linear-gradient(160deg, #1F4D3A 0%, #163828 70%)',
        borderRadius: 16,
        display: 'flex', flexDirection: 'column',
        padding: size === 'lg' ? '20px 20px 16px' : '12px 12px 10px',
        boxShadow: '0 8px 32px rgba(15,31,24,0.3)',
        position: 'relative', overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#E8C57E' }} />
      {/* Subtle dot grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.07,
        backgroundImage: 'radial-gradient(rgba(232,197,126,0.6) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      }} />

      {/* Event name */}
      <div style={{
        fontSize: size === 'lg' ? 9 : 6, fontFamily: 'Inter, system-ui, sans-serif',
        letterSpacing: '0.15em', textTransform: 'uppercase',
        color: 'rgba(232,197,126,0.85)', marginBottom: size === 'lg' ? 14 : 8,
        position: 'relative',
      }}>
        {event.name}
      </div>

      {/* Label */}
      <div style={{
        fontSize: size === 'lg' ? 8 : 5.5, letterSpacing: '0.18em', textTransform: 'uppercase',
        color: 'rgba(250,246,238,0.5)', marginBottom: size === 'lg' ? 12 : 7,
        position: 'relative',
      }}>
        I&apos;M SPEAKING AT
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: size === 'lg' ? 14 : 8, position: 'relative' }}>
        {speaker.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={speaker.photo_url} alt={speaker.name}
            style={{ width: avatarSize, height: avatarSize, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E8C57E' }}
          />
        ) : (
          <div style={{
            width: avatarSize, height: avatarSize, borderRadius: '50%',
            background: '#E8C57E', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: initialsSize, fontWeight: 700, color: '#1F4D3A', border: '2px solid rgba(232,197,126,0.4)',
          }}>
            {initials}
          </div>
        )}
      </div>

      {/* Name & role */}
      <div style={{ textAlign: 'center', position: 'relative' }}>
        <div style={{ fontSize: fontSize, fontWeight: 700, color: '#FAF6EE', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          {speaker.name}
        </div>
        {(speaker.role || speaker.company) && (
          <div style={{ fontSize: subSize, color: 'rgba(250,246,238,0.65)', marginTop: 3 }}>
            {[speaker.role, speaker.company].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{
        marginTop: 'auto', paddingTop: size === 'lg' ? 12 : 8,
        borderTop: '1px solid rgba(250,246,238,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative',
      }}>
        <span style={{ fontSize: size === 'lg' ? 8 : 5.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#E8C57E' }}>
          SPEAKER
        </span>
        {event.starts_at && (
          <span style={{ fontSize: size === 'lg' ? 8 : 5.5, letterSpacing: '0.1em', color: 'rgba(250,246,238,0.5)' }}>
            {fmt(event.starts_at)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Home Tab ──────────────────────────────────────────────────────── */
function HomeTab({ speaker, event, sessions, onTab }: { speaker: Speaker; event: EventInfo; sessions: Session[]; onTab: (t: Tab) => void }) {
  const hasProfile = !!(speaker.bio && speaker.photo_url);
  const hasHeadshot = !!speaker.photo_url;
  const hasSessions = sessions.length > 0;
  const hasSlides = false; // extend when slides_url is added to Session type

  // Day-number helper
  function sessionDay(s: Session): string {
    if (!event.starts_at) return fmt(s.starts_at);
    const eventDay = new Date(event.starts_at);
    eventDay.setHours(0, 0, 0, 0);
    const sessDay = new Date(s.starts_at);
    sessDay.setHours(0, 0, 0, 0);
    const diff = Math.round((sessDay.getTime() - eventDay.getTime()) / (1000 * 60 * 60 * 24));
    return `Day ${diff + 1} · ${fmt(s.starts_at)}`;
  }

  const checklistItems = [
    {
      id: 'profile',
      label: 'Complete your profile',
      done: hasProfile,
      action: () => onTab('profile'),
      actionLabel: 'Do it →',
    },
    {
      id: 'sessions',
      label: `Confirm your ${sessions.length} session${sessions.length !== 1 ? 's' : ''}`,
      done: hasSessions,
      action: () => onTab('sessions'),
      actionLabel: 'Do it →',
    },
    {
      id: 'slides',
      label: sessions.length > 0 ? `Upload slides for your ${sessions[0]?.session_type || 'session'}` : 'Upload your slides',
      done: hasSlides,
      action: () => onTab('sessions'),
      actionLabel: 'Do it →',
    },
    {
      id: 'headshot',
      label: 'Add a headshot',
      done: hasHeadshot,
      action: () => onTab('profile'),
      actionLabel: 'Do it →',
    },
  ];

  // Key dates from sessions (up to 3), or fall back to event dates
  const keyDates: { label: string; value: string }[] = sessions.slice(0, 3).map(s => ({
    label: s.title.length > 28 ? s.title.slice(0, 28) + '…' : s.title,
    value: `${fmt(s.starts_at)} · ${fmtTime(s.starts_at)}`,
  }));
  if (keyDates.length === 0 && event.starts_at) {
    keyDates.push({ label: 'Event starts', value: fmt(event.starts_at) });
    if (event.ends_at) keyDates.push({ label: 'Event ends', value: fmt(event.ends_at) });
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #0D1F17 0%, #1F4D3A 60%, #2A6A50 100%)' }}>
        {/* Dot mesh */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(rgba(232,197,126,0.12) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 mb-4 px-3 py-1.5 rounded-full text-[12px] font-medium"
            style={{ background: 'rgba(232,197,126,0.15)', border: '1px solid rgba(232,197,126,0.35)', color: '#E8C57E' }}>
            <span>+</span> You&apos;re speaking
          </div>
          <h1 className="font-display font-bold text-[26px] sm:text-[32px] mb-2"
            style={{ color: '#FFFFFF', letterSpacing: '-0.025em' }}>
            Welcome, {speaker.name.split(' ')[0]}.
          </h1>
          <p className="text-[14px] leading-relaxed max-w-[520px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {sessions.length > 0
              ? `You have ${sessions.length} session${sessions.length !== 1 ? 's' : ''} at ${event.name}. Finish the steps below so attendees see you at your best.`
              : `Complete the steps below so you're ready for ${event.name}.`
            }
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-4">
          {/* ── Checklist ── */}
          <div>
            <div className="text-[10px] tracking-[0.18em] uppercase mb-3"
              style={{ color: '#6B7A72', fontFamily: 'Inter, system-ui, sans-serif' }}>
              Your checklist
            </div>
            <div className="space-y-2">
              {checklistItems.map(item => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-5 py-4 rounded-xl text-left transition-colors hover:border-[#1F4D3A]/30"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E0D4',
                  }}
                >
                  {item.done
                    ? <CheckCircle2 size={18} style={{ color: '#2D7A4F', flexShrink: 0 }} />
                    : <Circle size={18} style={{ color: '#C9C3B1', flexShrink: 0 }} />
                  }
                  <span className="flex-1 text-[13px] font-medium"
                    style={{ color: item.done ? '#6B7A72' : '#0F1F18', textDecoration: item.done ? 'line-through' : 'none' }}>
                    {item.label}
                  </span>
                  {!item.done && (
                    <span className="text-[12px] font-medium shrink-0" style={{ color: '#1F4D3A' }}>
                      {item.actionLabel}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Sessions ── */}
          {sessions.length > 0 && (
            <div>
              <div className="text-[10px] tracking-[0.18em] uppercase mb-3"
                style={{ color: '#6B7A72', fontFamily: 'Inter, system-ui, sans-serif' }}>
                Your sessions
              </div>
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div key={s.id}
                    className="flex items-start gap-4 px-5 py-4 rounded-xl"
                    style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: '#E8EFEB', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}>
                      <Calendar size={16} style={{ color: '#1F4D3A' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium mb-1" style={{ color: '#0F1F18' }}>{s.title}</div>
                      <div className="flex items-center gap-1.5 text-[12px] mb-2" style={{ color: '#6B7A72', fontFamily: 'Inter, system-ui, sans-serif' }}>
                        <span>{sessionDay(s)}</span>
                        <span>·</span>
                        <span>{fmtTime(s.starts_at)}–{fmtTime(s.ends_at)}</span>
                        {s.room && <><span>·</span><span>{s.room}</span></>}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {s.tracks?.name && (
                          <span className="text-[11px] px-2.5 py-0.5 rounded-full"
                            style={{ background: '#F0ECE4', color: '#3A4A42', border: '1px solid #E5E0D4' }}>
                            {s.tracks.name}
                          </span>
                        )}
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                          style={{ background: '#E8EFEB', color: '#2D7A4F', border: '1px solid #C9DDD1' }}>
                          Confirmed
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onTab('sessions')}
                      className="shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium transition-colors"
                      style={{ background: '#E8EFEB', color: '#1F4D3A', border: '1px solid #C9DDD1', marginTop: 2 }}>
                      <Upload size={11} />
                      {hasSlides ? 'Slides ✓' : 'Upload slides'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          {/* Key dates */}
          {keyDates.length > 0 && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 12, padding: '16px 20px' }}>
              <div className="text-[10px] tracking-[0.18em] uppercase mb-3"
                style={{ color: '#6B7A72', fontFamily: 'Inter, system-ui, sans-serif' }}>
                Key dates
              </div>
              <div className="space-y-3">
                {keyDates.map((d, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <span className="text-[13px]" style={{ color: '#3A4A42' }}>{d.label}</span>
                    <span className="text-[12px] font-medium shrink-0 text-right"
                      style={{ color: '#1F4D3A', fontFamily: 'Inter, system-ui, sans-serif' }}>
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Speaker card */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 12, padding: '20px', textAlign: 'center' }}>
            <div className="text-[10px] tracking-[0.18em] uppercase mb-4"
              style={{ color: '#6B7A72', fontFamily: 'Inter, system-ui, sans-serif' }}>
              Your speaker card
            </div>
            <div className="flex justify-center mb-4">
              <SpeakerCard speaker={speaker} event={event} size="sm" />
            </div>
            <button
              onClick={() => onTab('card')}
              className="w-full h-10 rounded-lg text-[13px] font-medium transition-colors flex items-center justify-center gap-2"
              style={{ background: '#1F4D3A', color: '#FAF6EE' }}
            >
              <Share2 size={13} />
              Share my card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Profile Tab ───────────────────────────────────────────────────── */
function ProfileTab({ speaker, onSaved }: { speaker: Speaker; onSaved: (s: Partial<Speaker>) => void }) {
  const [form, setForm] = useState({
    name: speaker.name,
    role: speaker.role ?? '',
    company: speaker.company ?? '',
    bio: speaker.bio ?? '',
    twitter_url: speaker.twitter_url ?? '',
    linkedin_url: speaker.linkedin_url ?? '',
    website_url: speaker.website_url ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(speaker.photo_url);

  function setField(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); setSaved(false); }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/speakers/${speaker.id}/profile`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSaved(true);
        onSaved(form);
      }
    } finally {
      setSaving(false);
    }
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPhotoPreview(url);
  }

  const initials = form.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8">
      <div className="grid lg:grid-cols-[1fr_260px] gap-6">
        <div className="space-y-4">
          <h2 className="font-display font-normal text-[22px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>My Profile</h2>

          {/* Photo */}
          <div style={{ background: '#fff', border: '1px solid #E5E0D4', borderRadius: 12, padding: '20px' }}>
            <div className="flex items-center gap-4">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E5E0D4' }} />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#E8C57E', display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 700, color: '#1F4D3A' }}>
                  {initials}
                </div>
              )}
              <div>
                <button
                  onClick={() => photoRef.current?.click()}
                  className="flex items-center gap-2 h-8 px-4 rounded-lg text-[13px] font-medium transition-colors"
                  style={{ background: '#1F4D3A', color: '#FAF6EE' }}
                >
                  <Camera size={13} /> Change headshot
                </button>
                <p className="text-[11px] mt-1.5" style={{ color: '#6B7A72' }}>JPG or PNG, at least 400×400px</p>
                <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhoto} />
              </div>
            </div>
          </div>

          {/* Fields */}
          <div style={{ background: '#fff', border: '1px solid #E5E0D4', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Full name', key: 'name', placeholder: 'Your full name' },
              { label: 'Role / Title', key: 'role', placeholder: 'e.g. Product Engineer' },
              { label: 'Company / Organisation', key: 'company', placeholder: 'e.g. Paystack' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>{label}</label>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={e => setField(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full h-11 px-3 rounded-lg text-[14px] outline-none transition"
                  style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                />
              </div>
            ))}
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>Bio</label>
              <textarea
                value={form.bio}
                onChange={e => setField('bio', e.target.value)}
                placeholder="A short bio visible to attendees…"
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none resize-none transition"
                style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
              />
            </div>
          </div>

          {/* Social */}
          <div style={{ background: '#fff', border: '1px solid #E5E0D4', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="text-[13px] font-medium" style={{ color: '#0F1F18' }}>Social links</div>
            {[
              { label: 'X / Twitter', key: 'twitter_url', placeholder: 'https://x.com/yourhandle' },
              { label: 'LinkedIn', key: 'linkedin_url', placeholder: 'https://linkedin.com/in/yourname' },
              { label: 'Website', key: 'website_url', placeholder: 'https://yoursite.com' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>{label}</label>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={e => setField(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full h-11 px-3 rounded-lg text-[14px] outline-none transition"
                  style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-10 px-6 rounded-lg text-[14px] font-medium transition-colors"
              style={{ background: '#1F4D3A', color: '#FAF6EE', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
            {saved && <span className="text-[13px]" style={{ color: '#2D7A4F' }}>Saved ✓</span>}
          </div>
        </div>

        {/* Directory preview */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest mb-3" style={{ color: '#6B7A72' }}>
            Directory preview
          </div>
          <div style={{ background: '#fff', border: '1px solid #E5E0D4', borderRadius: 12, padding: '20px' }}>
            <div className="flex flex-col items-center gap-3 text-center">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E5E0D4' }} />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#E8C57E', display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 700, color: '#1F4D3A' }}>
                  {initials}
                </div>
              )}
              <div>
                <div className="font-semibold text-[15px]" style={{ color: '#0F1F18' }}>{form.name || 'Your Name'}</div>
                {(form.role || form.company) && (
                  <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>
                    {[form.role, form.company].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
              {form.bio && (
                <p className="text-[12px] leading-relaxed" style={{ color: '#3A4A42' }}>
                  {form.bio.slice(0, 120)}{form.bio.length > 120 ? '…' : ''}
                </p>
              )}
              <div className="flex gap-2 flex-wrap justify-center">
                {form.twitter_url && <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>X</span>}
                {form.linkedin_url && <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>LinkedIn</span>}
                {form.website_url && <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>Website</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sessions Tab ──────────────────────────────────────────────────── */
function SessionsTab({ sessions }: { sessions: Session[] }) {
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function handleUpload(sessionId: string, file: File) {
    setUploading(sessionId);
    const fd = new FormData();
    fd.append('file', file);
    await fetch(`/api/sessions/${sessionId}/slides`, { method: 'POST', body: fd });
    setUploading(null);
  }

  if (sessions.length === 0) {
    return (
      <div className="max-w-[680px] mx-auto px-4 sm:px-6 py-16 text-center">
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#E8EFEB', margin: '0 auto 16px', display: 'grid', placeItems: 'center' }}>
          <Calendar size={20} style={{ color: '#1F4D3A' }} />
        </div>
        <h2 className="font-display font-normal text-[22px] mb-2" style={{ color: '#0F1F18' }}>No sessions yet</h2>
        <p className="text-[14px]" style={{ color: '#6B7A72' }}>
          Sessions will appear here once the organiser assigns them to you.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8 space-y-4">
      <div>
        <h2 className="font-display font-normal text-[22px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>My Sessions</h2>
        <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>Upload slides and review your session details.</p>
      </div>

      {/* Deadline banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-[13px]" style={{ background: '#FFF3E0', border: '1px solid #E8C57E' }}>
        <span style={{ color: '#C97A2D', flexShrink: 0 }}>⏰</span>
        <span style={{ color: '#0F1F18' }}>Upload your slides before the event — the AV team needs them at least 24 hours in advance.</span>
      </div>

      {sessions.map((s) => (
        <div key={s.id} style={{ background: '#fff', border: '1px solid #E5E0D4', borderRadius: 12, overflow: 'hidden' }}>
          <div className="flex items-start gap-4 px-5 py-5">
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#E8EFEB', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Calendar size={16} style={{ color: '#1F4D3A' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[14px]" style={{ color: '#0F1F18' }}>{s.title}</div>
              <div className="text-[12px] mt-1" style={{ color: '#6B7A72' }}>
                {fmt(s.starts_at)} · {fmtTime(s.starts_at)}–{fmtTime(s.ends_at)}
                {s.room && ` · ${s.room}`}
              </div>
              <div className="flex gap-2 mt-2">
                {s.tracks?.name && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>{s.tracks.name}</span>
                )}
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: '#E8EFEB', color: '#2D7A4F' }}>Confirmed</span>
              </div>
            </div>
            <button
              onClick={() => fileRefs.current[s.id]?.click()}
              disabled={uploading === s.id}
              className="flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-medium transition-colors shrink-0"
              style={{ background: uploading === s.id ? '#E8EFEB' : '#1F4D3A', color: uploading === s.id ? '#6B7A72' : '#FAF6EE' }}
            >
              <Upload size={13} />
              {uploading === s.id ? 'Uploading…' : 'Upload slides'}
            </button>
            <input
              ref={el => { fileRefs.current[s.id] = el; }}
              type="file" accept=".pdf,.pptx,.key" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(s.id, f); }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Card Tab ──────────────────────────────────────────────────────── */
function CardTab({ speaker, event }: { speaker: Speaker; event: EventInfo }) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-[680px] mx-auto px-4 sm:px-6 py-8 text-center">
      <h2 className="font-display font-normal text-[22px] mb-2" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
        Your speaker card
      </h2>
      <p className="text-[14px] mb-8" style={{ color: '#6B7A72' }}>
        Share it on social to bring your audience to the event.
      </p>

      <div className="flex justify-center mb-8">
        <SpeakerCard speaker={speaker} event={event} size="lg" />
      </div>

      <div className="flex items-center justify-center gap-3 mb-6">
        <button
          className="flex items-center gap-2 h-11 px-6 rounded-xl text-[14px] font-medium transition-colors"
          style={{ background: '#1F4D3A', color: '#FAF6EE' }}
          onClick={copyLink}
        >
          <Share2 size={15} />
          {copied ? 'Copied!' : 'Share card'}
        </button>
        <button
          className="flex items-center gap-2 h-11 px-6 rounded-xl text-[14px] font-medium transition-colors"
          style={{ background: '#fff', border: '1px solid #E5E0D4', color: '#0F1F18' }}
        >
          <Download size={15} />
          Download
        </button>
      </div>

      {/* Social share icons */}
      <div className="flex items-center justify-center gap-4">
        {[
          { label: 'X', href: `https://x.com/intent/tweet?text=I%27m+speaking+at+${encodeURIComponent(event.name)}+%F0%9F%8E%A4` },
          { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + '/e/' + event.slug : '')}` },
        ].map(({ label, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[13px] px-4 h-9 rounded-lg transition-colors"
            style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#3A4A42' }}
          >
            <ExternalLink size={12} />
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}

/* ── Resources Tab ─────────────────────────────────────────────────── */
function ResourcesTab({ resources }: { resources: Resource[] }) {
  const FALLBACK_RESOURCES = [
    { id: '1', title: 'Speaker brief & code of conduct', url: '#', file_type: 'PDF', file_size: 1258291 },
    { id: '2', title: 'AV & stage guidelines', url: '#', file_type: 'PDF', file_size: 819200 },
    { id: '3', title: 'Slide template (16:9)', url: '#', file_type: 'PPTX', file_size: null },
    { id: '4', title: 'Travel & accommodation info', url: '#', file_type: 'Link', file_size: null },
  ];
  const items = resources.length > 0 ? resources : FALLBACK_RESOURCES;

  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8 space-y-4">
      <div>
        <h2 className="font-display font-normal text-[22px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>Resources</h2>
        <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>Everything you need to prepare.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((r) => (
          <a
            key={r.id}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 px-5 py-4 rounded-xl transition-shadow hover:shadow-md"
            style={{ background: '#fff', border: '1px solid #E5E0D4', textDecoration: 'none' }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#E8EFEB', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <FileText size={16} style={{ color: '#1F4D3A' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate" style={{ color: '#0F1F18' }}>{r.title}</div>
              <div className="text-[11px] mt-0.5" style={{ color: '#6B7A72' }}>
                {r.file_type}{r.file_size ? ` · ${fileSize(r.file_size)}` : ''}
              </div>
            </div>
            <ExternalLink size={14} style={{ color: '#C9C3B1', flexShrink: 0 }} />
          </a>
        ))}
      </div>

      {/* Help CTA */}
      <div className="flex items-center justify-between px-5 py-4 rounded-xl" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
        <div>
          <div className="text-[13px] font-medium" style={{ color: '#0F1F18' }}>Need help?</div>
          <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>Reach the organiser team directly.</div>
        </div>
        <button
          className="flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-medium transition-colors"
          style={{ background: '#1F4D3A', color: '#FAF6EE' }}
        >
          Message organiser
        </button>
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────── */
export function SpeakerPortalClient({ speaker: initialSpeaker, event, sessions, resources }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [speaker, setSpeaker] = useState(initialSpeaker);

  function handleProfileSaved(updates: Partial<Speaker>) {
    setSpeaker(s => ({ ...s, ...updates }));
  }

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      {/* Top nav */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E5E0D4', position: 'sticky', top: 0, zIndex: 40 }}>
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#1F4D3A', display: 'grid', placeItems: 'center' }}>
              <span className="text-[12px] font-bold" style={{ color: '#E8C57E' }}>K</span>
            </div>
            <span className="text-[13px] font-medium" style={{ color: '#0F1F18' }}>Karta</span>
            <span className="text-[13px]" style={{ color: '#C9C3B1' }}>/</span>
            <span className="text-[10px] tracking-[0.18em] uppercase font-medium"
              style={{ color: '#6B7A72', fontFamily: 'Inter, system-ui, sans-serif' }}>Speaker Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] hidden sm:block" style={{ color: '#6B7A72' }}>{event.name}</span>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E8C57E', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, color: '#1F4D3A' }}>
              {speaker.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Tab nav */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E0D4' }}>
        <div className="max-w-[960px] mx-auto px-4 sm:px-6">
          <nav className="flex gap-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 h-11 text-[13px] font-medium whitespace-nowrap transition-colors shrink-0"
                style={{
                  color: activeTab === tab.id ? '#1F4D3A' : '#6B7A72',
                  borderBottom: activeTab === tab.id ? '2px solid #1F4D3A' : '2px solid transparent',
                  background: 'none',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'home' && <HomeTab speaker={speaker} event={event} sessions={sessions} onTab={setActiveTab} />}
      {activeTab === 'profile' && <ProfileTab speaker={speaker} onSaved={handleProfileSaved} />}
      {activeTab === 'sessions' && <SessionsTab sessions={sessions} />}
      {activeTab === 'card' && <CardTab speaker={speaker} event={event} />}
      {activeTab === 'resources' && <ResourcesTab resources={resources} />}
    </div>
  );
}
