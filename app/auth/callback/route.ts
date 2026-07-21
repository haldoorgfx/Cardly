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

  if (error) {
    const params = new URLSearchParams({ error: errorDescription ?? error });
    return NextResponse.redirect(`${origin}/login?${params}`);
  }

  if (code) {
    const supabase = createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Authentication+failed.+Please+try+again.`);
}
