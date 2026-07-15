'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

// ── Brand tokens (Forest + Cream) ────────────────────────────────────────────
const FOREST = '#1F4D3A';
const FOREST_DARK = '#163828';
const FOREST_SOFT = '#E8EFEB';
const GOLD = '#E8C57E';
const GOLD_SOFT = '#F7EFDD';
const CREAM = '#FAF6EE';
const SURFACE = '#FFFFFF';
const BORDER = '#E5E0D4';
const INK = '#0F1F18';
const INK_SOFT = '#3A4A42';
const MUTED = '#65736B';
const SUCCESS = '#2D7A4F';

const DISPLAY = '"Plus Jakarta Sans", sans-serif';
const BODY = 'Inter, system-ui, sans-serif';

// ── Option lists (mirrored from the mobile onboarding screen) ────────────────
const INDUSTRIES = [
  'Fintech & payments', 'AI & software', 'Design & creative', 'Healthcare',
  'Education', 'Climate & energy', 'Media & entertainment', 'Retail & e-commerce',
  'Manufacturing & hardware', 'Agritech', 'Mobility & logistics', 'Other',
];
const ROLE_OPTIONS = ['Founder', 'Operator', 'Investor', 'Engineer', 'Designer', 'Student'];
const INTEREST_OPTIONS = [
  'Fintech', 'Startups', 'AI & ML', 'Product design', 'Climate', 'Payments',
  'Web3', 'Marketing', 'Devtools', 'Healthcare', 'Creative & media', 'Hardware',
  'Education', 'Gaming', 'Mobility', 'Agritech',
];
const GOAL_OPTIONS: { title: string; desc: string }[] = [
  { title: 'Meet new people', desc: 'Grow my network' },
  { title: 'Learn & get inspired', desc: 'Sessions and keynotes' },
  { title: 'Find investors / raise', desc: 'Meet funds & angels' },
  { title: 'Hire or get hired', desc: 'Talent & opportunities' },
  { title: 'Find customers / sell', desc: 'Grow my pipeline' },
];
const DIETARY_OPTIONS = [
  'No preference', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-free', 'Nut allergy',
];
const ACCESSIBILITY_OPTIONS = [
  'Step-free access', 'Reserved seating', 'Sign language', 'Large print',
];

const TOTAL_STEPS = 6;

// ── Form schema ──────────────────────────────────────────────────────────────
// Plain required fields (no .optional()/.default()) so the zod input and output
// types match exactly — avoids the RHF resolver input/output type split. Every
// field is seeded via defaultValues below, and nothing is truly required to
// submit (validation only runs on finish; the name gate is enforced in next()).
const formSchema = z.object({
  full_name: z.string(),
  avatar_url: z.string(),
  city: z.string(),
  phone: z.string(),
  job_title: z.string(),
  organization: z.string(),
  industry: z.string(),
  role_types: z.array(z.string()),
  interests: z.array(z.string()),
  goals: z.array(z.string()),
  directory_visible: z.boolean(),
  open_to_connect: z.boolean(),
  linkedin_url: z.string(),
  x_url: z.string(),
  dietary: z.array(z.string()),
  accessibility: z.array(z.string()),
  onboarding_notes: z.string(),
});
type FormValues = z.infer<typeof formSchema>;

interface Props {
  userId: string;
  userEmail: string;
  userName: string;
  city?: string;
  phone?: string;
  avatarUrl?: string;
}

export default function OnboardingWizard({
  userId, userEmail, userName, city, phone, avatarUrl,
}: Props) {
  const router = useRouter();

  // -1 = intro, 0..5 = steps, 6 = "all set"
  const [page, setPage] = useState(-1);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [done, setDone] = useState(false);

  const { control, handleSubmit, getValues, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: userName ?? '',
      avatar_url: avatarUrl ?? '',
      city: city ?? '',
      phone: phone ?? '',
      job_title: '',
      organization: '',
      industry: '',
      role_types: [],
      interests: [],
      goals: [],
      directory_visible: true,
      open_to_connect: true,
      linkedin_url: '',
      x_url: '',
      dietary: [],
      accessibility: [],
      onboarding_notes: '',
    },
  });

  const firstName = (watch('full_name') || userName || userEmail.split('@')[0] || '').split(' ')[0];

  // ── Persistence ────────────────────────────────────────────────────────────
  async function persist(values: Partial<FormValues>) {
    setSaving(true);
    try {
      const payload = {
        full_name: emptyToNull(values.full_name),
        avatar_url: emptyToNull(values.avatar_url),
        city: emptyToNull(values.city),
        phone: emptyToNull(values.phone),
        job_title: emptyToNull(values.job_title),
        organization: emptyToNull(values.organization),
        industry: emptyToNull(values.industry),
        role_types: values.role_types ?? [],
        interests: values.interests ?? [],
        goals: values.goals ?? [],
        directory_visible: values.directory_visible ?? true,
        open_to_connect: values.open_to_connect ?? true,
        linkedin_url: emptyToNull(values.linkedin_url),
        x_url: emptyToNull(values.x_url),
        dietary: values.dietary ?? [],
        accessibility: values.accessibility ?? [],
        onboarding_notes: emptyToNull(values.onboarding_notes),
      };
      await fetch('/api/account/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Never trap the user in onboarding on a network hiccup — let them out.
    } finally {
      setSaving(false);
    }
  }

  /** Cheap bail-out — flips completion flags only, no field save. */
  async function completeMinimal() {
    setSaving(true);
    try {
      await fetch('/api/account/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    } catch {
      /* let them out */
    } finally {
      setSaving(false);
      setDone(true);
    }
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  function next() {
    if (page === 0 && !(getValues('full_name') || '').trim()) return; // name required
    if (page >= TOTAL_STEPS - 1) { setPage(TOTAL_STEPS); return; }     // → "all set"
    setPage(p => p + 1);
  }
  function back() {
    if (page <= -1) { router.back(); return; }
    setPage(p => p - 1);
  }
  function skip() {
    if (page >= TOTAL_STEPS - 1) { setPage(TOTAL_STEPS); return; }
    setPage(p => p + 1);
  }

  const onFinish = handleSubmit(async (values) => {
    await persist(values);
    setDone(true);
  });

  // Same save, but drops the user on their profile to review it instead of the
  // "all set" done screen. Save logic is untouched.
  const finishToProfile = handleSubmit(async (values) => {
    await persist(values);
    router.push('/account/profile');
  });

  // ── Avatar upload ──────────────────────────────────────────────────────────
  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `avatars/${userId}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('uploads')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path);
      setValue('avatar_url', `${publicUrl}?t=${Date.now()}`);
    } catch {
      /* silent — avatar is optional */
    } finally {
      setUploadingAvatar(false);
    }
  }

  // ── Done state ─────────────────────────────────────────────────────────────
  if (done) {
    const interests = getValues('interests');
    const cityVal = getValues('city');
    return (
      <div style={{ background: FOREST_DARK, minHeight: 'calc(100vh - 61px)' }} className="px-5 pt-14 pb-24 text-center">
        <div className="w-[76px] h-[76px] rounded-full flex items-center justify-center mx-auto"
          style={{ background: 'rgba(45,122,79,0.22)', border: `1px solid rgba(232,197,126,0.4)` }}>
          <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center" style={{ background: GOLD }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={FOREST_DARK} strokeWidth="3">
              <path d="M4 12.5l5.5 5.5L20 6.5" />
            </svg>
          </div>
        </div>
        <h1 className="mt-6 text-[26px] font-normal text-white" style={{ fontFamily: DISPLAY, letterSpacing: '-0.02em' }}>
          {firstName ? `You're all set, ${firstName}.` : "You're all set."}
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: 'rgba(255,255,255,0.72)', fontFamily: BODY }}>
          Here&rsquo;s what your profile now powers.
        </p>

        <div className="mt-6 grid gap-2.5 max-w-[420px] mx-auto text-left">
          {[
            { icon: badgeIcon, label: 'Your attending card is ready' },
            { icon: peopleIcon, label: interests.length ? `People who match your goals` : 'People who match your goals' },
            { icon: agendaIcon, label: cityVal ? `Sessions picked for your interests` : 'Sessions picked for your interests' },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-3 px-3.5 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span style={{ color: GOLD }}>{r.icon}</span>
              <span className="text-[14px]" style={{ color: 'rgba(255,255,255,0.9)', fontFamily: BODY }}>{r.label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push('/my-tickets')}
          className="mt-8 h-12 px-8 rounded-lg font-medium text-[15px] transition hover:opacity-90"
          style={{ background: GOLD, color: FOREST_DARK, fontFamily: DISPLAY }}
        >
          Start discovering
        </button>
      </div>
    );
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (page === -1) {
    return (
      <div className="pt-6 pb-16">
        <span className="inline-block px-3 py-1 rounded-full text-[12px] font-medium"
          style={{ background: GOLD_SOFT, color: '#8A6A28', border: `1px solid ${GOLD}`, fontFamily: BODY }}>
          Takes about a minute
        </span>
        <h1 className="mt-5 text-[30px] font-normal" style={{ fontFamily: DISPLAY, letterSpacing: '-0.024em', color: INK }}>
          Let&rsquo;s make Eventera yours
        </h1>
        <p className="mt-2.5 text-[15px] leading-relaxed" style={{ color: INK_SOFT, fontFamily: BODY }}>
          A few quick questions help us tailor what you see — and help organizers host you well.
        </p>

        <div className="mt-7 grid gap-4">
          <Payoff icon={badgeIcon} tone={FOREST} title="A card that's really you"
            body="Your name, role and photo power your attending card." />
          <Payoff icon={peopleIcon} tone={GOLD} title="Meet the right people"
            body="Interests and goals drive your networking matches." />
          <Payoff icon={agendaIcon} tone={SUCCESS} title="A smoother event"
            body="Dietary & access needs reach the organizer, privately." />
        </div>

        <WhyNote text="You're always in control. Everything here is optional except your name, and editable anytime in Profile." />

        <div className="mt-8 grid gap-2.5">
          <button onClick={() => setPage(0)}
            className="h-12 w-full rounded-lg font-medium text-[15px] text-white transition hover:opacity-90"
            style={{ background: FOREST, fontFamily: DISPLAY }}>
            Get started
          </button>
          <button onClick={completeMinimal} disabled={saving}
            className="h-11 w-full rounded-lg font-medium text-[14px] transition disabled:opacity-50"
            style={{ color: MUTED, fontFamily: DISPLAY }}>
            I&rsquo;ll do this later
          </button>
        </div>
      </div>
    );
  }

  // ── All set (summary before final save) ──────────────────────────────────
  if (page === TOTAL_STEPS) {
    return (
      <div style={{ background: FOREST_DARK, minHeight: 'calc(100vh - 61px)' }} className="px-5 pt-12 pb-24 text-center">
        <div className="w-[76px] h-[76px] rounded-full flex items-center justify-center mx-auto"
          style={{ background: 'rgba(45,122,79,0.22)', border: `1px solid rgba(232,197,126,0.4)` }}>
          <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center" style={{ background: GOLD }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={FOREST_DARK} strokeWidth="3">
              <path d="M4 12.5l5.5 5.5L20 6.5" />
            </svg>
          </div>
        </div>
        <h1 className="mt-6 text-[26px] font-normal text-white" style={{ fontFamily: DISPLAY, letterSpacing: '-0.02em' }}>
          {firstName ? `You're all set, ${firstName}.` : "You're all set."}
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: 'rgba(255,255,255,0.72)', fontFamily: BODY }}>
          Here&rsquo;s what your profile now powers:
        </p>
        <div className="mt-6 grid gap-2.5 max-w-[420px] mx-auto text-left">
          {[
            { icon: badgeIcon, label: 'Your attending card is ready' },
            { icon: peopleIcon, label: 'People who match your goals' },
            { icon: agendaIcon, label: 'Sessions picked for your interests' },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-3 px-3.5 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span style={{ color: GOLD }}>{r.icon}</span>
              <span className="text-[14px]" style={{ color: 'rgba(255,255,255,0.9)', fontFamily: BODY }}>{r.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 max-w-[420px] mx-auto grid gap-2.5">
          <button onClick={onFinish} disabled={saving}
            className="h-12 w-full rounded-lg font-medium text-[15px] transition hover:opacity-90 disabled:opacity-60"
            style={{ background: GOLD, color: FOREST_DARK, fontFamily: DISPLAY }}>
            {saving ? 'Saving…' : 'Explore my first event'}
          </button>
          <button onClick={finishToProfile} disabled={saving}
            className="h-11 w-full rounded-lg font-medium text-[14px] transition hover:opacity-90 disabled:opacity-60"
            style={{ background: 'transparent', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.28)', fontFamily: DISPLAY }}>
            Review my profile
          </button>
        </div>
      </div>
    );
  }

  // ── Stepped flow ───────────────────────────────────────────────────────────
  const ctaLabel = page === TOTAL_STEPS - 1 ? 'Finish setup' : 'Continue';
  const nameFilled = (watch('full_name') || '').trim().length > 0;

  return (
    <div className="pb-28">
      {/* Top: back · step counter · skip · progress */}
      <div className="pt-6">
        <div className="flex items-center">
          <button onClick={back} aria-label="Back" className="w-9 h-9 flex items-center justify-center -ml-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="flex-1 text-center text-[13px]" style={{ color: INK, fontFamily: BODY }}>
            Step {page + 1} of {TOTAL_STEPS}
          </span>
          <button onClick={skip} className="px-2 py-1 text-[13px] font-medium" style={{ color: MUTED, fontFamily: DISPLAY }}>
            Skip
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className="flex-1 rounded-full transition-colors" style={{
              height: 5, background: i <= page ? FOREST : BORDER,
            }} />
          ))}
        </div>
      </div>

      <div className="mt-6">
        {/* Step 1 · basics */}
        {page === 0 && (
          <div>
            <StepHeader title="The basics" sub="This appears on your attending card." />
            <div className="mt-6 flex flex-col items-center">
              <label className="relative cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} disabled={uploadingAvatar} />
                <div className="w-[84px] h-[84px] rounded-full overflow-hidden flex items-center justify-center"
                  style={{ background: FOREST_SOFT, border: `1.5px solid ${BORDER}` }}>
                  {watch('avatar_url')
                    ? <Image src={watch('avatar_url')} alt="" width={84} height={84} className="w-full h-full object-cover" />
                    : <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={FOREST} strokeWidth="1.6">
                        <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: FOREST, border: `2.5px solid ${CREAM}` }}>
                  {uploadingAvatar
                    ? <span className="block w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>}
                </span>
              </label>
              <span className="mt-2.5 text-[13px] font-semibold" style={{ color: FOREST, fontFamily: BODY }}>Add a photo</span>
            </div>

            <div className="mt-6 grid gap-4">
              <Field label="Full name">
                <Controller name="full_name" control={control} render={({ field }) => (
                  <TextInput {...field} value={field.value ?? ''} placeholder="Your name" icon={personIcon} />
                )} />
              </Field>
              <Field label="City">
                <Controller name="city" control={control} render={({ field }) => (
                  <TextInput {...field} value={field.value ?? ''} placeholder="Where you're based" icon={pinIcon} />
                )} />
              </Field>
              <Field label="Phone (for ticket updates)">
                <Controller name="phone" control={control} render={({ field }) => (
                  <TextInput {...field} value={field.value ?? ''} type="tel" placeholder="+000 000 0000" icon={phoneIcon} />
                )} />
              </Field>
            </div>
          </div>
        )}

        {/* Step 2 · work */}
        {page === 1 && (
          <div>
            <StepHeader title="What do you do?" sub="Helps people know who they're meeting." />
            <div className="mt-6 grid gap-4">
              <Field label="Job title">
                <Controller name="job_title" control={control} render={({ field }) => (
                  <TextInput {...field} value={field.value ?? ''} placeholder="e.g. Founder & CEO" icon={workIcon} />
                )} />
              </Field>
              <Field label="Company / organization">
                <Controller name="organization" control={control} render={({ field }) => (
                  <TextInput {...field} value={field.value ?? ''} placeholder="Where you work" icon={buildingIcon} />
                )} />
              </Field>
              <Field label="Industry">
                <Controller name="industry" control={control} render={({ field }) => (
                  <select value={field.value ?? ''} onChange={field.onChange}
                    className="w-full h-[50px] px-3.5 rounded-lg outline-none text-[15px] appearance-none"
                    style={{
                      background: `${SURFACE} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2365736B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center`,
                      border: `1px solid ${BORDER}`, color: field.value ? INK : MUTED, fontFamily: BODY,
                    }}>
                    <option value="">Choose an industry</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                )} />
              </Field>
            </div>

            <p className="mt-5 text-[13px] font-medium" style={{ color: INK, fontFamily: DISPLAY }}>I&rsquo;m here as a…</p>
            <Controller name="role_types" control={control} render={({ field }) => (
              <ChipGroup options={ROLE_OPTIONS} selected={field.value ?? []} onToggle={v => field.onChange(toggle(field.value ?? [], v))} className="mt-3" />
            )} />
          </div>
        )}

        {/* Step 3 · interests */}
        {page === 2 && (
          <Controller name="interests" control={control} render={({ field }) => (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[24px] font-normal" style={{ fontFamily: DISPLAY, letterSpacing: '-0.02em', color: INK }}>What are you into?</h2>
                  <p className="mt-1.5 text-[14px]" style={{ color: MUTED, fontFamily: BODY }}>Pick a few — we&rsquo;ll match sessions and people to them.</p>
                </div>
                <span className="shrink-0 text-[13px] font-semibold pt-1" style={{ color: INK, fontFamily: BODY }}>
                  {(field.value ?? []).length} selected
                </span>
              </div>
              <ChipGroup options={INTEREST_OPTIONS} selected={field.value ?? []} onToggle={v => field.onChange(toggle(field.value ?? [], v))} className="mt-5" />
              <WhyNote text="The more you pick, the sharper your session and networking suggestions get." icon="none" />
            </div>
          )} />
        )}

        {/* Step 4 · goals */}
        {page === 3 && (
          <Controller name="goals" control={control} render={({ field }) => (
            <div>
              <StepHeader title="What do you want out of events?" sub="We'll prioritize matches and sessions around this." />
              <div className="mt-5 grid gap-2.5">
                {GOAL_OPTIONS.map(g => {
                  const sel = (field.value ?? []).includes(g.title);
                  return (
                    <button key={g.title} onClick={() => field.onChange(toggle(field.value ?? [], g.title))}
                      className="flex items-center gap-3 p-3.5 rounded-xl text-left transition-all"
                      style={{
                        background: sel ? FOREST_SOFT : SURFACE,
                        border: `${sel ? 1.5 : 1}px solid ${sel ? FOREST : BORDER}`,
                      }}>
                      <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: sel ? SURFACE : FOREST_SOFT, color: FOREST }}>{targetIcon}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[15px] font-semibold" style={{ color: INK, fontFamily: DISPLAY }}>{g.title}</span>
                        <span className="block text-[13px]" style={{ color: MUTED, fontFamily: BODY }}>{g.desc}</span>
                      </span>
                      <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                        style={{ background: sel ? FOREST : 'transparent', border: `1.5px solid ${sel ? FOREST : '#C9C3B4'}` }}>
                        {sel && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M4 12.5l5.5 5.5L20 6.5" /></svg>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )} />
        )}

        {/* Step 5 · networking */}
        {page === 4 && (
          <div>
            <StepHeader title="How you'll connect" sub="Control how visible you are to attendees." />
            <div className="mt-5 rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}`, background: SURFACE }}>
              <Controller name="directory_visible" control={control} render={({ field }) => (
                <ToggleRow title="Show me in the attendee directory" sub="Others can find and connect with you"
                  value={!!field.value} onChange={field.onChange} />
              )} />
              <div style={{ height: 1, background: BORDER }} />
              <Controller name="open_to_connect" control={control} render={({ field }) => (
                <ToggleRow title="Open to meeting people" sub='Adds an "open to connect" badge'
                  value={!!field.value} onChange={field.onChange} />
              )} />
            </div>

            <p className="mt-6 text-[12px] font-semibold tracking-wide" style={{ color: MUTED, fontFamily: BODY }}>ADD YOUR LINKS (OPTIONAL)</p>
            <div className="mt-3 grid gap-3">
              <Controller name="linkedin_url" control={control} render={({ field }) => (
                <TextInput {...field} value={field.value ?? ''} type="url" placeholder="linkedin.com/in/you" icon={linkIcon} />
              )} />
              <Controller name="x_url" control={control} render={({ field }) => (
                <TextInput {...field} value={field.value ?? ''} placeholder="@handle (X / Twitter)" icon={atIcon} />
              )} />
            </div>
          </div>
        )}

        {/* Step 6 · dietary & access (PRIVATE) */}
        {page === 5 && (
          <div>
            <StepHeader title="Anything we should know?" sub="Only shared with the organizer of events you attend." />
            <p className="mt-6 text-[12px] font-semibold tracking-wide" style={{ color: MUTED, fontFamily: BODY }}>DIETARY PREFERENCE</p>
            <Controller name="dietary" control={control} render={({ field }) => (
              <ChipGroup options={DIETARY_OPTIONS} selected={field.value ?? []} onToggle={v => field.onChange(toggle(field.value ?? [], v))} className="mt-3" />
            )} />
            <p className="mt-6 text-[12px] font-semibold tracking-wide" style={{ color: MUTED, fontFamily: BODY }}>ACCESSIBILITY NEEDS</p>
            <Controller name="accessibility" control={control} render={({ field }) => (
              <ChipGroup options={ACCESSIBILITY_OPTIONS} selected={field.value ?? []} onToggle={v => field.onChange(toggle(field.value ?? [], v))} className="mt-3" />
            )} />
            <div className="mt-6">
              <Field label="Anything else? (optional)">
                <Controller name="onboarding_notes" control={control} render={({ field }) => (
                  <textarea {...field} value={field.value ?? ''} rows={3} placeholder="Let the organizer know…"
                    className="w-full px-3.5 py-3 rounded-lg outline-none text-[15px] resize-none"
                    style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: INK, fontFamily: BODY }} />
                )} />
              </Field>
            </div>
            <WhyNote text="Kept private and organizer-only — never shown on your card or profile." />
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-3.5" style={{ background: CREAM, borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-[620px] mx-auto">
          <button onClick={next} disabled={page === 0 && !nameFilled}
            className="h-12 w-full rounded-lg font-medium text-[15px] text-white transition hover:opacity-90 disabled:opacity-40"
            style={{ background: FOREST, fontFamily: DISPLAY }}>
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function emptyToNull(v: string | undefined | null): string | null {
  const t = (v ?? '').trim();
  return t.length ? t : null;
}
function toggle(arr: string[], v: string): string[] {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
}

// ── Presentational subcomponents ─────────────────────────────────────────────
function StepHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h2 className="text-[24px] font-normal" style={{ fontFamily: DISPLAY, letterSpacing: '-0.02em', color: INK }}>{title}</h2>
      <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: MUTED, fontFamily: BODY }}>{sub}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-[13px] font-medium" style={{ color: INK, fontFamily: DISPLAY }}>{label}</span>
      {children}
    </label>
  );
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}
function TextInput({ icon, ...props }: TextInputProps) {
  return (
    <div className="relative">
      {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: MUTED }}>{icon}</span>}
      <input {...props}
        className="w-full h-[50px] rounded-lg outline-none text-[15px]"
        style={{
          background: SURFACE, border: `1px solid ${BORDER}`, color: INK, fontFamily: BODY,
          paddingLeft: icon ? 42 : 14, paddingRight: 14,
        }}
        onFocus={e => (e.currentTarget.style.borderColor = GOLD)}
        onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
      />
    </div>
  );
}

function ChipGroup({ options, selected, onToggle, className }:
  { options: string[]; selected: string[]; onToggle: (v: string) => void; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2.5 ${className ?? ''}`}>
      {options.map(o => {
        const sel = selected.includes(o);
        return (
          <button key={o} onClick={() => onToggle(o)}
            className="h-10 px-4 flex items-center gap-1.5 rounded-full font-medium text-[14px] transition-all"
            style={{
              border: `1px solid ${sel ? FOREST : BORDER}`,
              background: sel ? FOREST : SURFACE,
              color: sel ? '#FFFFFF' : INK_SOFT,
              fontFamily: DISPLAY,
            }}>
            {sel && <span style={{ fontSize: 11, color: GOLD }}>✓</span>}
            {o}
          </button>
        );
      })}
    </div>
  );
}

function ToggleRow({ title, sub, value, onChange }:
  { title: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold" style={{ color: INK, fontFamily: DISPLAY }}>{title}</p>
        <p className="text-[12px]" style={{ color: MUTED, fontFamily: BODY }}>{sub}</p>
      </div>
      <button role="switch" aria-checked={value} onClick={() => onChange(!value)}
        className="relative shrink-0 rounded-full transition-colors"
        style={{ width: 44, height: 26, background: value ? FOREST : '#CDC7BA' }}>
        <span className="absolute top-0.5 rounded-full bg-white transition-all"
          style={{ width: 22, height: 22, left: value ? 20 : 2 }} />
      </button>
    </div>
  );
}

function Payoff({ icon, tone, title, body }: { icon: React.ReactNode; tone: string; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${tone}1A`, color: tone }}>{icon}</span>
      <div>
        <p className="text-[15px] font-semibold" style={{ color: INK, fontFamily: DISPLAY }}>{title}</p>
        <p className="mt-0.5 text-[13px]" style={{ color: MUTED, fontFamily: BODY }}>{body}</p>
      </div>
    </div>
  );
}

function WhyNote({ text, icon = 'lock' }: { text: string; icon?: 'lock' | 'none' }) {
  return (
    <div className="mt-6 flex items-start gap-2.5 p-3.5 rounded-xl"
      style={{ background: GOLD_SOFT, border: `1px solid ${GOLD}` }}>
      {icon === 'lock' && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B08A2E" strokeWidth="1.8" className="shrink-0 mt-0.5">
          <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" />
        </svg>
      )}
      <p className="text-[13px] leading-relaxed" style={{ color: INK_SOFT, fontFamily: BODY }}>{text}</p>
    </div>
  );
}

// ── Inline icons ─────────────────────────────────────────────────────────────
const personIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>;
const pinIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 21s-6-5.2-6-10a6 6 0 0112 0c0 4.8-6 10-6 10z" /><circle cx="12" cy="11" r="2.2" /></svg>;
const phoneIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 3h4l2 5-2.5 1.5a11 11 0 005 5L16 12l5 2v4a2 2 0 01-2 2A16 16 0 014 5a2 2 0 012-2z" /></svg>;
const workIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>;
const buildingIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h.01M15 16h.01" /></svg>;
const linkIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1.5 1.5" /><path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1.5-1.5" /></svg>;
const atIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="4" /><path d="M16 12v1.5a2.5 2.5 0 005 0V12a9 9 0 10-3.5 7" /></svg>;
const badgeIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="4" width="16" height="16" rx="3" /><circle cx="12" cy="10" r="2.5" /><path d="M8 17c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5" /></svg>;
const peopleIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 6.5a3 3 0 010 6M18 20c0-2.6-1.2-4.6-3-5.6" /></svg>;
const agendaIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 9h16M8 3v4M16 3v4" /></svg>;
const targetIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /></svg>;
