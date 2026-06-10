'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type State = 'email' | 'otp';

export default function AttendeeAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/my-tickets';

  const [state, setState] = useState<State>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
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
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
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

    if (data.user) {
      // Ensure profile has account_type = 'attendee' for new users
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_type, onboarding_done')
        .eq('id', data.user.id)
        .single();

      if (profile?.account_type === 'organizer' && !profile.onboarding_done) {
        await supabase.from('profiles').update({ account_type: 'attendee' }).eq('id', data.user.id);
        router.push('/account/setup');
        return;
      }
      if (profile?.account_type === 'attendee' && !profile.onboarding_done) {
        router.push('/account/setup');
        return;
      }
    }

    router.push(next);
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

        {/* OTP boxes */}
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
                fontFamily: '"JetBrains Mono", monospace',
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
          {loading ? 'Verifying…' : 'Verify & sign in'}
        </button>

        <p className="text-[13px] mt-4" style={{ color: '#6B7A72' }}>
          {countdown > 0 ? (
            <>Didn&apos;t get it? Resend in <strong style={{ fontFamily: '"JetBrains Mono", monospace', color: '#0F1F18' }}>0:{String(countdown).padStart(2, '0')}</strong> · check spam too</>
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

  return (
    <form onSubmit={handleSendOtp}>
      <h1 style={{ fontFamily: 'var(--font-display, "DM Sans", sans-serif)', fontWeight: 400, fontSize: 28, letterSpacing: '-0.02em', color: '#1F4D3A' }}>
        Welcome back
      </h1>
      <p className="text-[14px] mt-2 leading-relaxed" style={{ color: '#6B7A72' }}>
        Sign in to your tickets, follows and feed. New here? Same form — we&apos;ll create your account.
      </p>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full h-12 mt-7 flex items-center justify-center gap-2.5 rounded-lg font-medium text-[14px] transition hover:bg-[#F5F3EE]"
        style={{ border: '1px solid #E5E0D4', background: '#FFFFFF', color: '#0F1F18', fontFamily: '"DM Sans", sans-serif' }}
      >
        <span style={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600, fontSize: 16, color: '#1F4D3A' }}>G</span>
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
          className="w-full h-12 px-3.5 outline-none transition"
          style={{
            border: '1px solid #E5E0D4',
            borderRadius: 8,
            background: '#FFFFFF',
            fontSize: 15,
            color: '#0F1F18',
            fontFamily: '"Inter", sans-serif',
          }}
          onFocus={e => (e.target.style.borderColor = '#E8C57E')}
          onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
        />
      </div>

      {error && <p className="text-[13px] mt-2" style={{ color: '#B8423C' }}>{error}</p>}

      <button
        type="submit"
        disabled={loading || !email}
        className="w-full h-12 mt-4 rounded-lg font-medium text-[15px] text-white transition hover:opacity-90 disabled:opacity-50"
        style={{ background: '#1F4D3A', fontFamily: '"DM Sans", sans-serif' }}
      >
        {loading ? 'Sending…' : 'Send sign-in code'}
      </button>

      <p className="text-[12px] mt-4 text-center leading-relaxed" style={{ color: '#6B7A72' }}>
        No passwords on Karta — we email you a 6-digit code.{' '}
        By continuing you agree to the{' '}
        <a href="/terms" className="hover:underline" style={{ color: '#1F4D3A' }}>terms</a>{' '}
        and{' '}
        <a href="/privacy" className="hover:underline" style={{ color: '#1F4D3A' }}>privacy policy</a>.
      </p>
    </form>
  );
}
