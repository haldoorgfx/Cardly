import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/auth/safe-next';

// Handles Supabase auth callbacks:
//   - Email verification (signup confirm)
//   - Password reset (exchangeCodeForSession then → /settings/reset-password)
//   - Google OAuth redirect
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // `next` is attacker-controllable (it survives the whole OAuth round-trip),
  // and it used to be concatenated onto `origin` unchecked — so ?next=.evil.com
  // produced a redirect to https://<origin>.evil.com, an open redirect fired the
  // instant sign-in succeeded. Anything not a same-origin path falls back to
  // /dashboard.
  const next = safeNextPath(searchParams.get('next')) ?? '/dashboard';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Failures hand /login a fixed code, never provider text. The login page shows
  // its own copy for that code, so nobody can craft /login?error=<message> and
  // have the app render arbitrary text inside an official-looking alert — a
  // "Your account is locked, call this number" phish needs no more than that.
  // The provider's own wording is logged here instead of being passed through.
  if (error) {
    console.error('[auth/callback] provider error:', error, errorDescription ?? '');
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  if (code) {
    const supabase = createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('[auth/callback] code exchange failed:', exchangeError.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
