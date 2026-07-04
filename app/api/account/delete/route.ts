import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// Deletes the CALLER'S OWN account and data. Destructive + irreversible.
//
// Safety model:
//   1. Requires an authenticated session (createClient().auth.getUser()).
//   2. Only ever operates on user.id — the caller's own uid. There is no way
//      to target another user; no id is read from the request body.
//   3. profiles.id references auth.users ON DELETE CASCADE (migration 001), so
//      removing the auth user removes the profile row and everything that
//      cascades from it (events → generated_cards, etc.). We also delete the
//      profiles row explicitly first as a belt-and-suspenders step.
//
// Mirrors the mobile app's delete flow (attendee_profile_screen.dart).
async function handler() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // 1. Delete the caller's own profile row (cascades to their events/cards).
  //    Scoped to user.id — never anyone else.
  const { error: profileError } = await admin
    .from('profiles')
    .delete()
    .eq('id', user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // 2. Remove the privileged auth user. Idempotent if already cascaded.
  const { error: authError } = await admin.auth.admin.deleteUser(user.id);
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // Best-effort: clear the caller's session cookies.
  await supabase.auth.signOut().catch(() => {});

  return NextResponse.json({ ok: true });
}

export async function POST() {
  return handler();
}

export async function DELETE() {
  return handler();
}
