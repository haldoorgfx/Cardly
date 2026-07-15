'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';

const LANGUAGES = ['English', 'Français', 'Soomaali', 'العربية'] as const;

const emailSchema = z.string().trim().toLowerCase().email();

const INTERESTS = [
  'Tech', 'Music', 'Business', 'Culture', 'Food & drink',
  'Sports', 'Health', 'Film', 'Faith', 'Family', 'Education', 'Fashion',
];

// ── Work / networking option lists (mirrored from OnboardingWizard) ──────────
const INDUSTRIES = [
  'Fintech & payments', 'AI & software', 'Design & creative', 'Healthcare',
  'Education', 'Climate & energy', 'Media & entertainment', 'Retail & e-commerce',
  'Manufacturing & hardware', 'Agritech', 'Mobility & logistics', 'Other',
];
const ROLE_OPTIONS = ['Founder', 'Operator', 'Investor', 'Engineer', 'Designer', 'Student'];
const GOAL_OPTIONS = [
  'Meet new people',
  'Learn & get inspired',
  'Find investors / raise',
  'Hire or get hired',
  'Find customers / sell',
];

const CITIES = [
  'Djibouti City, Djibouti',
  'Nairobi, Kenya',
  'Addis Ababa, Ethiopia',
  'Dar es Salaam, Tanzania',
  'Kampala, Uganda',
  'Lagos, Nigeria',
];

type NotifPrefs = Record<string, boolean>;

interface Props {
  profile: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    interests: string[] | null;
    city: string | null;
    phone: string | null;
    whatsapp_verified: boolean | null;
    notification_prefs: NotifPrefs | null;
    language: string | null;
    // Work / networking (migration 048)
    bio: string | null;
    job_title: string | null;
    organization: string | null;
    industry: string | null;
    role_types: string[] | null;
    goals: string[] | null;
    directory_visible: boolean | null;
    open_to_connect: boolean | null;
    linkedin_url: string | null;
    x_url: string | null;
  };
  /**
   * When true, the component is rendered embedded inside another page (e.g. the
   * organizer Settings shell that already provides a page header + tabs), so the
   * top page header and outer max-width wrapper padding are suppressed.
   */
  embedded?: boolean;
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="relative shrink-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4D3A]"
      style={{
        width: 40, height: 23,
        borderRadius: 100,
        background: on ? '#1F4D3A' : '#E5E0D4',
        border: 'none',
      }}
    >
      <span
        className="absolute top-[2.5px] transition-transform"
        style={{
          left: 3,
          width: 18, height: 18,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          transform: on ? 'translateX(16px)' : 'translateX(0)',
        }}
      />
    </button>
  );
}

// Collapsible group — a lightweight accordion built with the app's brand styling
// (not native <details>) so the header + chevron match the rest of Eventera.
function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="mt-4 rounded-xl overflow-hidden"
      style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-[#FAFAF8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1F4D3A]"
      >
        <span className="font-medium text-[16px]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F1F18' }}>
          {title}
        </span>
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7A72" strokeWidth="2"
          className="shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-6 pt-1" style={{ borderTop: '1px solid #E5E0D4' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function ProfileSettings({ profile, embedded = false }: Props) {
  const [interests, setInterests] = useState<string[]>(profile.interests ?? []);
  const [city, setCity] = useState(profile.city ?? '');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);

  // Work / networking
  const [bio, setBio] = useState(profile.bio ?? '');
  const [jobTitle, setJobTitle] = useState(profile.job_title ?? '');
  const [organization, setOrganization] = useState(profile.organization ?? '');
  const [industry, setIndustry] = useState(profile.industry ?? '');
  const [roleTypes, setRoleTypes] = useState<string[]>(profile.role_types ?? []);
  const [goals, setGoals] = useState<string[]>(profile.goals ?? []);
  const [directoryVisible, setDirectoryVisible] = useState(profile.directory_visible ?? true);
  const [openToConnect, setOpenToConnect] = useState(profile.open_to_connect ?? true);
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url ?? '');
  const [xUrl, setXUrl] = useState(profile.x_url ?? '');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Change email
  const [newEmail, setNewEmail] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Language (persisted to the profiles.language column)
  const [language, setLanguage] = useState(profile.language ?? 'English');

  // Delete account
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleChangeEmail() {
    setEmailError(null);
    setEmailNotice(null);
    const parsed = emailSchema.safeParse(newEmail);
    if (!parsed.success) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser(
        { email: parsed.data },
        { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/auth/callback` },
      );
      if (error) throw error;
      setEmailNotice(`Check ${parsed.data} — your sign-in email changes only after you confirm via the link we sent.`);
      setNewEmail('');
      toast({ title: 'Confirmation sent', description: `Check ${parsed.data} to finish changing your email.` });
    } catch (err) {
      console.error('Change email failed', err);
      // Surface the real reason instead of a blanket "try again" — the most
      // common causes are the target address already belonging to an account,
      // rate limiting, or entering your current email.
      const raw = (err as { message?: string })?.message?.toLowerCase() ?? '';
      const friendly =
        raw.includes('already') || raw.includes('registered') || raw.includes('exists') || raw.includes('in use')
          ? 'That email is already used by another account. Try a different address.'
        : raw.includes('rate') || raw.includes('too many')
          ? 'Too many attempts. Wait a few minutes and try again.'
        : raw.includes('same') || raw.includes('current')
          ? 'That’s already your sign-in email.'
        : raw.includes('smtp') || raw.includes('send') || raw.includes('email')
          ? 'We couldn’t send the confirmation email right now. Please try again shortly.'
          : 'Could not update your email. Please try again.';
      setEmailError(friendly);
      toast({ title: 'Email not changed', description: friendly, variant: 'destructive' });
    } finally {
      setEmailBusy(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      if (!res.ok) {
        // Fall back to deleting the caller's own profile row directly (RLS-scoped).
        const supabase = createClient();
        const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
        if (error) throw error;
      }
      const supabase = createClient();
      await supabase.auth.signOut().catch(() => {});
      window.location.href = '/';
    } catch (err) {
      console.error('Delete account failed', err);
      setDeleteError('We couldn’t delete your account right now. Please contact support.');
      setDeleting(false);
    }
  }

  function toggleInterest(i: string) {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
    setSaved(false);
  }

  function toggleRole(r: string) {
    setRoleTypes(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
    setSaved(false);
  }

  function toggleGoal(g: string) {
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
    setSaved(false);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset the input so re-selecting the same file still fires onChange.
    e.target.value = '';
    if (!file) return;
    setPhotoError(null);
    if (!file.type.startsWith('image/')) { setPhotoError('Please choose an image file.'); return; }
    if (file.size > 8 * 1024 * 1024) { setPhotoError('Image is too large (max 8 MB).'); return; }
    setPhotoUploading(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      // Cache-bust the path so the new photo replaces the old one everywhere.
      const path = `avatars/${profile.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('uploads').upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path);
      setAvatarUrl(publicUrl);
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: publicUrl }),
      });
      if (!res.ok) throw new Error('Could not save your new photo. Please try again.');
      toast({ title: 'Photo updated' });
    } catch (err) {
      console.error('Photo upload failed', err);
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setPhotoError(msg);
      toast({ title: 'Something went wrong', description: msg, variant: 'destructive' });
    } finally {
      setPhotoUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName || null,
          phone: phone || null,
          bio: bio || null,
          job_title: jobTitle || null,
          organization: organization || null,
          industry: industry || null,
          role_types: roleTypes,
          interests,
          goals,
          city: city || null,
          directory_visible: directoryVisible,
          open_to_connect: openToConnect,
          linkedin_url: linkedinUrl || null,
          x_url: xUrl || null,
          language,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      toast({ title: 'Preferences saved' });
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast({ title: 'Something went wrong', description: 'Could not save your preferences. Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={embedded ? 'max-w-[760px] pb-16' : 'max-w-[760px] mx-auto px-5 pb-24'}
      style={{ paddingTop: embedded ? 0 : 44 }}
    >
      {/* Header — suppressed when embedded (organizer Settings supplies its own) */}
      {!embedded && (
        <div>
          <h1 className="font-normal text-[32px]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', letterSpacing: '-0.025em', color: '#0F1F18' }}>
            Profile &amp; preferences
          </h1>
          <p className="mt-2 text-[14px]" style={{ color: '#6B7A72' }}>
            What you pick here shapes your discovery feed and how Eventera reaches you.
          </p>
        </div>
      )}

      {/* Identity — open by default */}
      <Section title="Identity" defaultOpen>
        {/* Avatar row */}
        <div className="flex items-center gap-5 mb-5">
          <div className="relative shrink-0 w-16 h-16 rounded-full overflow-hidden" style={{ border: '2px solid #E8C57E' }}>
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-[22px] font-semibold"
                style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }}>
                {(fullName || profile.email)[0].toUpperCase()}
              </div>
            )}
            {photoUploading && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] truncate" style={{ color: '#6B7A72' }}>{profile.email}</div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={photoUploading}
            className="shrink-0 h-10 px-3.5 rounded-lg font-medium text-[13px] transition hover:bg-[#E8EFEB] disabled:opacity-50"
            style={{ border: '1px solid #1F4D3A', color: '#1F4D3A', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            {photoUploading ? 'Uploading…' : 'Edit photo'}
          </button>
        </div>
        {photoError && (
          <p className="text-[12.5px]" style={{ color: '#B8423C' }}>{photoError}</p>
        )}
        {/* Name + phone */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-[12px] mb-1.5 font-medium" style={{ color: '#6B7A72' }}>Display name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => { setFullName(e.target.value); setSaved(false); }}
              placeholder="Your name"
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
              style={{ border: '1px solid #E5E0D4', background: '#FAFAF8', color: '#0F1F18', fontFamily: 'Inter, sans-serif' }}
              onFocus={e => { e.target.style.borderColor = '#1F4D3A'; e.target.style.boxShadow = '0 0 0 3px rgba(31,77,58,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#E5E0D4'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div>
            <label className="block text-[12px] mb-1.5 font-medium" style={{ color: '#6B7A72' }}>Phone / WhatsApp</label>
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); setSaved(false); }}
              placeholder="+254 700 000000"
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
              style={{ border: '1px solid #E5E0D4', background: '#FAFAF8', color: '#0F1F18', fontFamily: 'Inter, sans-serif' }}
              onFocus={e => { e.target.style.borderColor = '#1F4D3A'; e.target.style.boxShadow = '0 0 0 3px rgba(31,77,58,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#E5E0D4'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>
        {/* Bio */}
        <div className="mt-3">
          <label className="block text-[12px] mb-1.5 font-medium" style={{ color: '#6B7A72' }}>Bio</label>
          <textarea
            value={bio}
            onChange={e => { setBio(e.target.value); setSaved(false); }}
            rows={3}
            placeholder="A short line about you — shown on your attendee card and directory profile."
            className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none transition resize-none"
            style={{ border: '1px solid #E5E0D4', background: '#FAFAF8', color: '#0F1F18', fontFamily: 'Inter, sans-serif' }}
            onFocus={e => { e.target.style.borderColor = '#1F4D3A'; e.target.style.boxShadow = '0 0 0 3px rgba(31,77,58,0.12)'; }}
            onBlur={e => { e.target.style.borderColor = '#E5E0D4'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
      </Section>

      {/* Networking & discovery — collapsed by default */}
      <Section title="Networking &amp; discovery">
        {/* Work */}
        <div className="mt-4">
        <h2 className="font-medium text-[17px]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F1F18' }}>
          Work
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: '#6B7A72' }}>
          Helps people know who they&rsquo;re meeting.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-[12px] mb-1.5 font-medium" style={{ color: '#6B7A72' }}>Job title</label>
            <input
              type="text"
              value={jobTitle}
              onChange={e => { setJobTitle(e.target.value); setSaved(false); }}
              placeholder="e.g. Founder & CEO"
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
              style={{ border: '1px solid #E5E0D4', background: '#FAFAF8', color: '#0F1F18', fontFamily: 'Inter, sans-serif' }}
              onFocus={e => { e.target.style.borderColor = '#1F4D3A'; e.target.style.boxShadow = '0 0 0 3px rgba(31,77,58,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#E5E0D4'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div>
            <label className="block text-[12px] mb-1.5 font-medium" style={{ color: '#6B7A72' }}>Company / organization</label>
            <input
              type="text"
              value={organization}
              onChange={e => { setOrganization(e.target.value); setSaved(false); }}
              placeholder="Where you work"
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
              style={{ border: '1px solid #E5E0D4', background: '#FAFAF8', color: '#0F1F18', fontFamily: 'Inter, sans-serif' }}
              onFocus={e => { e.target.style.borderColor = '#1F4D3A'; e.target.style.boxShadow = '0 0 0 3px rgba(31,77,58,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#E5E0D4'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>
        <div className="mt-3 sm:max-w-[380px]">
          <label className="block text-[12px] mb-1.5 font-medium" style={{ color: '#6B7A72' }}>Industry</label>
          <div className="relative">
            <select
              value={industry}
              onChange={e => { setIndustry(e.target.value); setSaved(false); }}
              className="w-full h-10 px-3 pr-8 rounded-lg text-[14px] outline-none appearance-none transition cursor-pointer"
              style={{ border: '1px solid #E5E0D4', background: '#FAFAF8', color: industry ? '#0F1F18' : '#9BA8A1', fontFamily: 'Inter, sans-serif' }}
              onFocus={e => { e.target.style.borderColor = '#1F4D3A'; e.target.style.boxShadow = '0 0 0 3px rgba(31,77,58,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#E5E0D4'; e.target.style.boxShadow = 'none'; }}
            >
              <option value="">Choose an industry</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7A72" strokeWidth="2.5" className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
        <p className="mt-4 text-[13px] font-medium" style={{ color: '#0F1F18', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>I&rsquo;m here as a…</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {ROLE_OPTIONS.map(r => (
            <button
              key={r}
              onClick={() => toggleRole(r)}
              className="h-9 px-4 flex items-center gap-2 rounded-full font-medium text-[13px] transition-all"
              style={{
                border: `1px solid ${roleTypes.includes(r) ? '#1F4D3A' : '#E5E0D4'}`,
                background: roleTypes.includes(r) ? '#1F4D3A' : '#FFFFFF',
                color: roleTypes.includes(r) ? '#FFFFFF' : '#3A4A42',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
              }}
            >
              {roleTypes.includes(r) && <span style={{ fontSize: 11, color: '#E8C57E' }}>✓</span>}
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div className="mt-10">
        <h2 className="font-medium text-[17px]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F1F18' }}>
          Your interests
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: '#6B7A72' }}>
          Pick at least 3 — your &ldquo;For you&rdquo; feed is built from these.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {INTERESTS.map(i => (
            <button
              key={i}
              onClick={() => toggleInterest(i)}
              className="h-9 px-4 flex items-center gap-2 rounded-full font-medium text-[13px] transition-all"
              style={{
                border: `1px solid ${interests.includes(i) ? '#1F4D3A' : '#E5E0D4'}`,
                background: interests.includes(i) ? '#1F4D3A' : '#FFFFFF',
                color: interests.includes(i) ? '#FFFFFF' : '#3A4A42',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
              }}
            >
              {interests.includes(i) && <span style={{ fontSize: 11, color: '#E8C57E' }}>✓</span>}
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Home city */}
      <div className="mt-10">
        <h2 className="font-medium text-[17px]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F1F18' }}>
          Home city
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: '#6B7A72' }}>Events near here come first.</p>

        {!showCityPicker ? (
          <div
            className="mt-4 flex items-center gap-3 h-12 px-4 rounded-xl w-full sm:max-w-[380px]"
            style={{ border: '1px solid #E5E0D4', background: '#FFFFFF' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6B7A72" strokeWidth="1.8">
              <path d="M12 21s-6-5.2-6-10a6 6 0 0112 0c0 4.8-6 10-6 10z" />
              <circle cx="12" cy="11" r="2.2" />
            </svg>
            <span className="flex-1 text-[14px]" style={{ color: city ? '#0F1F18' : '#9BA8A1' }}>
              {city || 'Not set'}
            </span>
            <button
              onClick={() => setShowCityPicker(true)}
              className="text-[13px] font-medium hover:underline"
              style={{ color: '#1F4D3A' }}
            >
              {city ? 'Change' : 'Set'}
            </button>
          </div>
        ) : (
          <div className="mt-4 w-full sm:max-w-[380px] grid gap-2">
            {CITIES.map(c => (
              <button
                key={c}
                onClick={() => { setCity(c); setShowCityPicker(false); setSaved(false); }}
                className="text-left px-4 py-3 rounded-xl font-medium text-[14px] transition-all"
                style={{
                  border: `1px solid ${city === c ? '#1F4D3A' : '#E5E0D4'}`,
                  background: city === c ? '#E8EFEB' : '#FFFFFF',
                  color: '#0F1F18',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                }}
              >
                {c}
              </button>
            ))}
            <button onClick={() => setShowCityPicker(false)} className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Goals */}
      <div className="mt-10">
        <h2 className="font-medium text-[17px]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F1F18' }}>
          What you want out of events
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: '#6B7A72' }}>
          We prioritize matches and sessions around this.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {GOAL_OPTIONS.map(g => (
            <button
              key={g}
              onClick={() => toggleGoal(g)}
              className="h-9 px-4 flex items-center gap-2 rounded-full font-medium text-[13px] transition-all"
              style={{
                border: `1px solid ${goals.includes(g) ? '#1F4D3A' : '#E5E0D4'}`,
                background: goals.includes(g) ? '#1F4D3A' : '#FFFFFF',
                color: goals.includes(g) ? '#FFFFFF' : '#3A4A42',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
              }}
            >
              {goals.includes(g) && <span style={{ fontSize: 11, color: '#E8C57E' }}>✓</span>}
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Networking */}
      <div className="mt-10">
        <h2 className="font-medium text-[17px]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F1F18' }}>
          How you&rsquo;ll connect
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: '#6B7A72' }}>
          Control how visible you are to other attendees.
        </p>
        <div className="mt-4 rounded-xl overflow-hidden" style={{ border: '1px solid #E5E0D4', background: '#FFFFFF' }}>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium" style={{ color: '#0F1F18' }}>Show me in the attendee directory</p>
              <p className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>Others can find and connect with you</p>
            </div>
            <Toggle on={directoryVisible} onChange={v => { setDirectoryVisible(v); setSaved(false); }} />
          </div>
          <div style={{ height: 1, background: '#E5E0D4' }} />
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium" style={{ color: '#0F1F18' }}>Open to meeting people</p>
              <p className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>Adds an &ldquo;open to connect&rdquo; badge</p>
            </div>
            <Toggle on={openToConnect} onChange={v => { setOpenToConnect(v); setSaved(false); }} />
          </div>
        </div>

        <p className="mt-6 text-[12px] font-semibold tracking-wide" style={{ color: '#6B7A72' }}>YOUR LINKS (OPTIONAL)</p>
        <div className="mt-3 grid gap-3 sm:max-w-[420px]">
          <input
            type="url"
            value={linkedinUrl}
            onChange={e => { setLinkedinUrl(e.target.value); setSaved(false); }}
            placeholder="linkedin.com/in/you"
            className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
            style={{ border: '1px solid #E5E0D4', background: '#FAFAF8', color: '#0F1F18', fontFamily: 'Inter, sans-serif' }}
            onFocus={e => { e.target.style.borderColor = '#1F4D3A'; e.target.style.boxShadow = '0 0 0 3px rgba(31,77,58,0.12)'; }}
            onBlur={e => { e.target.style.borderColor = '#E5E0D4'; e.target.style.boxShadow = 'none'; }}
          />
          <input
            type="text"
            value={xUrl}
            onChange={e => { setXUrl(e.target.value); setSaved(false); }}
            placeholder="@handle (X / Twitter)"
            className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
            style={{ border: '1px solid #E5E0D4', background: '#FAFAF8', color: '#0F1F18', fontFamily: 'Inter, sans-serif' }}
            onFocus={e => { e.target.style.borderColor = '#1F4D3A'; e.target.style.boxShadow = '0 0 0 3px rgba(31,77,58,0.12)'; }}
            onBlur={e => { e.target.style.borderColor = '#E5E0D4'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        </div>
      </Section>

      {/* Preferences & account — collapsed by default */}
      <Section title="Preferences &amp; account">
        {/* Notifications — managed in the unified notifications center */}
        <div className="mt-4">
        <h2 className="font-medium text-[17px]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F1F18' }}>
          Notifications
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: '#6B7A72' }}>
          Choose how each kind of update reaches you — email, WhatsApp and in-app.
        </p>
        <Link
          href="/notifications"
          className="mt-4 flex items-center gap-3 h-12 px-4 rounded-xl w-full sm:max-w-[380px] transition hover:bg-[#E8EFEB]"
          style={{ border: '1px solid #E5E0D4', background: '#FFFFFF' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="1.8">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          <span className="flex-1 text-[14px] font-medium" style={{ color: '#0F1F18' }}>Manage notification preferences</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7A72" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
        </Link>
      </div>

      {/* Language & region */}
      <div className="mt-10">
        <h2 className="font-medium text-[17px]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F1F18' }}>
          Language &amp; region
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: '#6B7A72' }}>
          Your preferred language. Saved with your preferences.
        </p>
        <div className="mt-4 w-full sm:max-w-[380px] grid gap-2">
          {LANGUAGES.map(l => (
            <button
              key={l}
              onClick={() => { setLanguage(l); setSaved(false); }}
              className="flex items-center gap-3 text-left px-4 py-3 rounded-xl font-medium text-[14px] transition-all"
              dir={l === 'العربية' ? 'rtl' : 'ltr'}
              style={{
                border: `1px solid ${language === l ? '#1F4D3A' : '#E5E0D4'}`,
                background: language === l ? '#E8EFEB' : '#FFFFFF',
                color: '#0F1F18',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
              }}
            >
              <span
                className="inline-flex items-center justify-center shrink-0 rounded-full"
                style={{
                  width: 18, height: 18,
                  border: `2px solid ${language === l ? '#1F4D3A' : '#C4CCC7'}`,
                }}
              >
                {language === l && (
                  <span className="rounded-full" style={{ width: 8, height: 8, background: '#1F4D3A' }} />
                )}
              </span>
              <span className="flex-1">{l}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Account */}
      <div className="mt-10">
        <h2 className="font-medium text-[17px]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F1F18' }}>
          Account
        </h2>

        {/* Change email */}
        <div
          className="mt-4 p-5 rounded-xl"
          style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
        >
          <div className="text-[14px] font-medium" style={{ color: '#0F1F18', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Change email
          </div>
          <p className="mt-1 text-[13px]" style={{ color: '#6B7A72' }}>
            We&rsquo;ll send a confirmation link to the new address. Your sign-in email changes only after you confirm it.
          </p>
          <div className="mt-4 text-[12px] mb-1.5 font-medium" style={{ color: '#6B7A72' }}>
            Current: <span style={{ color: '#0F1F18' }}>{profile.email}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              aria-invalid={!!emailError}
              value={newEmail}
              onChange={e => { setNewEmail(e.target.value); setEmailError(null); setEmailNotice(null); }}
              placeholder="new@email.com"
              className="flex-1 h-10 px-3 rounded-lg text-[14px] outline-none transition"
              style={{ border: '1px solid #E5E0D4', background: '#FAFAF8', color: '#0F1F18', fontFamily: 'Inter, sans-serif' }}
              onFocus={e => { e.target.style.borderColor = '#1F4D3A'; e.target.style.boxShadow = '0 0 0 3px rgba(31,77,58,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#E5E0D4'; e.target.style.boxShadow = 'none'; }}
            />
            <button
              onClick={handleChangeEmail}
              disabled={emailBusy || !newEmail.trim()}
              className="h-10 px-4 rounded-lg font-medium text-[14px] text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: '#1F4D3A', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              {emailBusy ? 'Sending…' : 'Send confirmation'}
            </button>
          </div>
          {emailError && (
            <p className="mt-2.5 text-[13px]" style={{ color: '#B8423C' }}>{emailError}</p>
          )}
          {emailNotice && (
            <div
              className="mt-3 flex items-start gap-2.5 p-3 rounded-lg text-[13px]"
              style={{ background: '#E8EFEB', border: '1px solid rgba(31,77,58,0.18)', color: '#1F4D3A' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="1.8" className="shrink-0 mt-0.5">
                <path d="M4 4h16v16H4z" /><path d="m4 6 8 6 8-6" />
              </svg>
              <span>{emailNotice}</span>
            </div>
          )}
        </div>

        {/* Delete account — standalone attendee profile only; the organizer
            Settings shell provides its own danger zone, so suppress when embedded. */}
        {!embedded && (
        <div
          className="mt-4 p-5 rounded-xl"
          style={{ background: '#FFFFFF', border: '1px solid rgba(184,66,60,0.35)' }}
        >
          <div className="text-[14px] font-medium" style={{ color: '#B8423C', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Delete account
          </div>
          <p className="mt-1 text-[13px]" style={{ color: '#6B7A72' }}>
            This permanently removes your profile and data. This can&rsquo;t be undone.
          </p>
          <button
            onClick={() => { setShowDeleteDialog(true); setDeleteConfirm(''); setDeleteError(null); }}
            className="mt-4 h-10 px-4 rounded-lg font-medium text-[14px] transition hover:bg-[#FBEDEC]"
            style={{ border: '1px solid #B8423C', color: '#B8423C', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            Delete my account
          </button>
        </div>
        )}
      </div>
      </Section>

      {/* Save — always visible, outside the collapsible groups so it works
          no matter which sections are expanded. */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={save}
          disabled={saving}
          className="h-10 px-5 rounded-lg font-medium text-[14px] text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: '#1F4D3A', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save preferences'}
        </button>
        <button
          className="h-10 px-5 rounded-lg font-medium text-[14px] transition hover:bg-[#E8EFEB]"
          style={{ border: '1px solid #1F4D3A', color: '#1F4D3A', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          onClick={() => {
            setFullName(profile.full_name ?? '');
            setPhone(profile.phone ?? '');
            setAvatarUrl(profile.avatar_url);
            setInterests(profile.interests ?? []);
            setCity(profile.city ?? '');
            setLanguage(profile.language ?? 'English');
            setBio(profile.bio ?? '');
            setJobTitle(profile.job_title ?? '');
            setOrganization(profile.organization ?? '');
            setIndustry(profile.industry ?? '');
            setRoleTypes(profile.role_types ?? []);
            setGoals(profile.goals ?? []);
            setDirectoryVisible(profile.directory_visible ?? true);
            setOpenToConnect(profile.open_to_connect ?? true);
            setLinkedinUrl(profile.linkedin_url ?? '');
            setXUrl(profile.x_url ?? '');
            setSaved(false);
          }}
        >
          Cancel
        </button>
      </div>

      {/* Delete confirm dialog */}
      {!embedded && showDeleteDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{ background: 'rgba(15,31,24,0.45)' }}
          onClick={() => { if (!deleting) setShowDeleteDialog(false); }}
        >
          <div
            className="w-full max-w-[420px] rounded-2xl p-6"
            style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', boxShadow: '0 20px 48px rgba(15,31,24,0.24)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-[19px] font-medium" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#0F1F18' }}>
              Delete account?
            </h3>
            <p className="mt-2 text-[13px]" style={{ color: '#6B7A72' }}>
              This permanently removes your profile and all your data. This can&rsquo;t be undone.
              Type <span style={{ fontFamily: '"JetBrains Mono", monospace', color: '#B8423C' }}>DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              autoFocus
              className="w-full h-10 px-3 mt-4 rounded-lg text-[14px] outline-none transition"
              style={{ border: '1px solid #E5E0D4', background: '#FAFAF8', color: '#0F1F18', fontFamily: 'Inter, sans-serif' }}
              onFocus={e => { e.target.style.borderColor = '#B8423C'; e.target.style.boxShadow = '0 0 0 3px rgba(184,66,60,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = '#E5E0D4'; e.target.style.boxShadow = 'none'; }}
            />
            {deleteError && (
              <p className="mt-2.5 text-[13px]" style={{ color: '#B8423C' }}>{deleteError}</p>
            )}
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirm.trim() !== 'DELETE'}
                className="h-10 px-5 rounded-lg font-medium text-[14px] text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: '#B8423C', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                {deleting ? 'Deleting…' : 'Delete permanently'}
              </button>
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
                className="h-10 px-5 rounded-lg font-medium text-[14px] transition hover:bg-[#E8EFEB] disabled:opacity-50"
                style={{ border: '1px solid #1F4D3A', color: '#1F4D3A', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
