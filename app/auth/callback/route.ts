import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/auth/safe-next';

/**
 * Copy auth.users.email onto profiles.email when the two disagree.
 *
 * An email CHANGE is confirmed by following a link that lands right here, and
 * until migration 118 is applied nothing else propagates it — migration 001's
 * `handle_new_user` fires on INSERT only. profiles.email is not merely a
 * display string: lib/rbac/ownership.ts and lib/rbac/sections.ts match it
 * against speakers.email / sponsors.contact_email / registrations.attendee_email
 * to decide what you may see, and billing bills it. Left stale, portal access
 * follows an address the user no longer controls.
 *
 * Best-effort on purpose: this runs on the sign-in hot path, so a failure here
 * must never cost the user their session. Worst case the row stays stale, which
 * is exactly today's behaviour.
 */
async function reconcileProfileEmail(userId: string, email: string | undefined) {
  if (!email) return;
  try {
    const admin = createAdminClient();
    // Unconditional set-to-a-constant, scoped to the caller's own row. There is
    // no read-then-write here so no race to guard, and it is idempotent — a
    // `.neq('email', email)` precondition would look tighter but silently skip
    // rows where profiles.email IS NULL, since `email <> 'x'` is NULL, not true.
    await admin
      .from('profiles')
      .update({ email })
      .eq('id', userId);
  } catch (err) {
    console.error('[auth/callback] profile email reconcile failed', err);
  }
}

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
    const { data: exchanged, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      const authed = exchanged?.user;
      if (authed?.id) await reconcileProfileEmail(authed.id, authed.email);
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('[auth/callback] code exchange failed:', exchangeError.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
