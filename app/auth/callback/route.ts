import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Handles Supabase auth callbacks:
//   - Email verification (signup confirm)
//   - Password reset (exchangeCodeForSession then → /settings/reset-password)
//   - Google OAuth redirect
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Only allow a same-origin relative path. Reject absolute URLs, protocol-
  // relative (`//host`) and userinfo (`/@host`) tricks that would let a crafted
  // `next=` redirect the freshly-authenticated user off-site.
  const rawNext = searchParams.get('next') ?? '/dashboard';
  const next = (rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.startsWith('/@'))
    ? rawNext
    : '/dashboard';
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
