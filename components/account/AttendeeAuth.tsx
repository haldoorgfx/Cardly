'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Attendee auth. Verify-once-then-password model:
//   • Returning users sign in with EMAIL + PASSWORD (no fresh OTP each time).
//   • New users: send ONE email code, verify, then set a password.
//   • Legacy magic-link users (no password) are never locked out — they can
//     "email me a code instead", and after verifying we invite them to set a
//     password so next time is a normal login.
type State = 'email' | 'otp' | 'setPassword';

// The official 4-colour Google "G". White button + coloured mark per Google's
// branding guidelines.
function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
      <path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/>
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
    </svg>
  );
}

export default function AttendeeAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/my-tickets';

  const [state, setState] = useState<State>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startCountdown() {
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  // ── Route the signed-in user to onboarding or their destination ──────────
  async function routeAfterAuth(userId: string) {
    const supabase = createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type, onboarding_done')
      .eq('id', userId)
      .single();

    if (profile?.account_type === 'organizer' && !profile.onboarding_done) {
      await supabase.from('profiles').update({ account_type: 'attendee' }).eq('id', userId);
      router.push('/account/setup');
      return;
    }
    if (profile?.account_type === 'attendee' && !profile.onboarding_done) {
      router.push('/account/setup');
      return;
    }
    router.push(next);
  }

  // ── Password sign-in (returning users) ───────────────────────────────────
  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    setNotice('');
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (err) {
      // Wrong password OR a legacy magic-link user who has no password yet.
      // Offer the code fallback rather than a dead end.
      setError('That password didn\'t work. If you\'ve never set one, use "Email me a code instead".');
      return;
    }
    if (data.user) await routeAfterAuth(data.user.id);
  }

  // ── Send a one-time code (new signups + legacy magic-link fallback) ───────
  async function handleSendOtp() {
    if (!email.trim()) { setError('Enter your email first.'); return; }
    setLoading(true);
    setError('');
    setNotice('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setState('otp');
    startCountdown();
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  }

  async function handleGoogleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}` },
    });
  }

  function handleOtpKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  function handleOtpChange(i: number, val: string) {
    const digit = val.replace(/\D/, '').slice(-1);
    const nextOtp = [...otp];
    nextOtp[i] = digit;
    setOtp(nextOtp);
    if (digit && i < 5) inputRefs.current[i + 1]?.focus();
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      inputRefs.current[5]?.focus();
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const token = otp.join('');
    if (token.length !== 6) return;
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: 'email',
    });
    if (err) { setLoading(false); setError(err.message); return; }
    setLoading(false);

    if (!data.user) { router.push(next); return; }

    // Now that they're verified, offer to set a password so future logins are a
    // normal email+password sign-in (no more codes). We can tell whether this
    // account already has a password via app_metadata / the sign-in providers.
    const providers = (data.user.app_metadata?.providers ?? []) as string[];
    const hasPasswordProvider = providers.includes('email');
    // A brand-new email OTP user, or a legacy magic-link user, won't have a
    // usable password yet — invite them to set one. Existing password users
    // (who chose the code route anyway) skip straight through.
    const alreadyHasPassword = hasPasswordProvider && data.user.user_metadata?.has_password === true;

    if (alreadyHasPassword) {
      await routeAfterAuth(data.user.id);
    } else {
      setState('setPassword');
    }
  }

  // ── Set a password after verifying (verify-once → password henceforth) ────
  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { data: { user }, error: err } = await supabase.auth.updateUser({
      password: newPassword,
      data: { has_password: true },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (user) await routeAfterAuth(user.id);
  }

  async function handleSkipPassword() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await routeAfterAuth(user.id);
  }

  async function handleResend() {
    if (countdown > 0) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: false } });
    setLoading(false);
    startCountdown();
  }

  const otpFilled = otp.filter(Boolean).length === 6;

  // ── OTP verify screen ────────────────────────────────────────────────────
  if (state === 'otp') {
    return (
      <form onSubmit={handleVerify}>
        <h1 style={{ fontFamily: 'var(--font-display, "DM Sans", sans-serif)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.02em', color: '#1F4D3A' }}>
          Check your email
        </h1>
        <p className="text-[14px] mt-2 leading-relaxed" style={{ color: '#6B7A72' }}>
          We sent a 6-digit code to{' '}
          <strong style={{ color: '#0F1F18', fontWeight: 600 }}>{email}</strong>
        </p>

        <div className="flex gap-2.5 mt-7" onPaste={handleOtpPaste}>
          {otp.map((d, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleOtpChange(i, e.target.value)}
              onKeyDown={e => handleOtpKey(i, e)}
              className="text-center outline-none transition-all"
              style={{
                width: 52, height: 60,
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: 500, fontSize: 24,
                color: '#0F1F18',
                border: `1px solid ${d ? '#1F4D3A' : '#E5E0D4'}`,
                borderRadius: 8,
                background: d ? '#E8EFEB' : '#FFFFFF',
              }}
            />
          ))}
        </div>

        {error && <p className="text-[13px] mt-3" style={{ color: '#B8423C' }}>{error}</p>}

        <button
          type="submit"
          disabled={!otpFilled || loading}
          className="w-full h-12 mt-6 rounded-lg font-medium text-[15px] transition disabled:opacity-50"
          style={{ background: '#E8C57E', color: '#0F1F18', fontFamily: '"DM Sans", sans-serif' }}
        >
          {loading ? 'Verifying…' : 'Verify & continue'}
        </button>

        <p className="text-[13px] mt-4" style={{ color: '#6B7A72' }}>
          {countdown > 0 ? (
            <>Didn&apos;t get it? Resend in <strong style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#0F1F18' }}>0:{String(countdown).padStart(2, '0')}</strong> · check spam too</>
          ) : (
            <button type="button" onClick={handleResend} className="font-medium hover:underline" style={{ color: '#1F4D3A' }}>
              Resend code
            </button>
          )}
        </p>

        <button
          type="button"
          onClick={() => { setState('email'); setOtp(['', '', '', '', '', '']); setError(''); }}
          className="mt-5 text-[13px] font-medium block"
          style={{ color: '#1F4D3A' }}
        >
          ← Use a different email
        </button>
      </form>
    );
  }

  // ── Set-password screen (shown once, right after verifying) ──────────────
  if (state === 'setPassword') {
    return (
      <form onSubmit={handleSetPassword}>
        <h1 style={{ fontFamily: 'var(--font-display, "DM Sans", sans-serif)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.02em', color: '#1F4D3A' }}>
          Set a password
        </h1>
        <p className="text-[14px] mt-2 leading-relaxed" style={{ color: '#6B7A72' }}>
          You&apos;re verified. Add a password so next time you can sign in
          straight away — no code needed.
        </p>

        <div className="mt-6">
          <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>New password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoFocus
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className="w-full h-12 px-3.5 pr-11 outline-none transition"
              style={{ border: '1px solid #E5E0D4', borderRadius: 8, background: '#FFFFFF', fontSize: 15, color: '#0F1F18', fontFamily: '"Inter", sans-serif' }}
              onFocus={e => (e.target.style.borderColor = '#E8C57E')}
              onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
            />
            <button type="button" onClick={() => setShowPassword(p => !p)} tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium" style={{ color: '#6B7A72' }}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {error && <p className="text-[13px] mt-2" style={{ color: '#B8423C' }}>{error}</p>}

        <button
          type="submit"
          disabled={loading || newPassword.length < 8}
          className="w-full h-12 mt-5 rounded-lg font-medium text-[15px] text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: '#1F4D3A', fontFamily: '"DM Sans", sans-serif' }}
        >
          {loading ? 'Saving…' : 'Save password & continue'}
        </button>

        <button
          type="button"
          onClick={handleSkipPassword}
          className="w-full h-11 mt-2 rounded-lg font-medium text-[14px] transition"
          style={{ color: '#6B7A72', fontFamily: '"DM Sans", sans-serif' }}
        >
          Skip for now (I&apos;ll use a code each time)
        </button>
      </form>
    );
  }

  // ── Email + password screen (default) ────────────────────────────────────
  return (
    <form onSubmit={handlePasswordSignIn}>
      <h1 style={{ fontFamily: 'var(--font-display, "DM Sans", sans-serif)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.02em', color: '#1F4D3A' }}>
        Welcome back
      </h1>
      <p className="text-[14px] mt-2 leading-relaxed" style={{ color: '#6B7A72' }}>
        Sign in to your tickets, follows and feed. New here? Enter your email and
        we&apos;ll set you up.
      </p>

      {/* Google — official white button + 4-colour G */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full h-12 mt-7 flex items-center justify-center gap-2.5 rounded-lg font-medium text-[14px] transition hover:bg-[#F5F3EE]"
        style={{ border: '1px solid #E5E0D4', background: '#FFFFFF', color: '#0F1F18', fontFamily: '"DM Sans", sans-serif' }}
      >
        <GoogleG />
        Continue with Google
      </button>

      <div className="flex items-center gap-3.5 my-5">
        <div className="flex-1 h-px" style={{ background: '#E5E0D4' }} />
        <span className="text-[12px]" style={{ color: '#6B7A72' }}>or use email</span>
        <div className="flex-1 h-px" style={{ background: '#E5E0D4' }} />
      </div>

      <div>
        <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="w-full h-12 px-3.5 outline-none transition"
          style={{ border: '1px solid #E5E0D4', borderRadius: 8, background: '#FFFFFF', fontSize: 15, color: '#0F1F18', fontFamily: '"Inter", sans-serif' }}
          onFocus={e => (e.target.style.borderColor = '#E8C57E')}
          onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
        />
      </div>

      <div className="mt-3.5">
        <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            className="w-full h-12 px-3.5 pr-11 outline-none transition"
            style={{ border: '1px solid #E5E0D4', borderRadius: 8, background: '#FFFFFF', fontSize: 15, color: '#0F1F18', fontFamily: '"Inter", sans-serif' }}
            onFocus={e => (e.target.style.borderColor = '#E8C57E')}
            onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
          />
          <button type="button" onClick={() => setShowPassword(p => !p)} tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium" style={{ color: '#6B7A72' }}>
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {error && <p className="text-[13px] mt-2.5" style={{ color: '#B8423C' }}>{error}</p>}
      {notice && <p className="text-[13px] mt-2.5" style={{ color: '#1F4D3A' }}>{notice}</p>}

      <button
        type="submit"
        disabled={loading || !email || !password}
        className="w-full h-12 mt-4 rounded-lg font-medium text-[15px] text-white transition hover:opacity-90 disabled:opacity-50"
        style={{ background: '#1F4D3A', fontFamily: '"DM Sans", sans-serif' }}
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>

      {/* Code fallback — keeps magic-link users and brand-new signups unlocked */}
      <button
        type="button"
        onClick={handleSendOtp}
        disabled={loading}
        className="w-full h-11 mt-2 rounded-lg font-medium text-[14px] transition hover:bg-[#F5F3EE] disabled:opacity-50"
        style={{ border: '1px solid #E5E0D4', background: '#FFFFFF', color: '#1F4D3A', fontFamily: '"DM Sans", sans-serif' }}
      >
        Email me a code instead
      </button>

      <p className="text-[12px] mt-4 text-center leading-relaxed" style={{ color: '#6B7A72' }}>
        New here or forgot your password? Use{' '}
        <button type="button" onClick={handleSendOtp} className="font-medium hover:underline" style={{ color: '#1F4D3A' }}>
          email me a code
        </button>{' '}
        — you can set a password after.<br />
        By continuing you agree to the{' '}
        <a href="/terms" className="hover:underline" style={{ color: '#1F4D3A' }}>terms</a>{' '}
        and{' '}
        <a href="/privacy" className="hover:underline" style={{ color: '#1F4D3A' }}>privacy policy</a>.
      </p>

      <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid #E5E0D4' }}>
        <p className="text-[12px]" style={{ color: '#6B7A72' }}>
          Organizing an event?{' '}
          <a href="/login" className="font-medium hover:underline" style={{ color: '#1F4D3A' }}>
            Sign in to your organizer account →
          </a>
        </p>
      </div>
    </form>
  );
}
