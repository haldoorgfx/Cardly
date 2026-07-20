import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteOwnAccount } from '@/lib/account/delete';

// Deletes the CALLER'S OWN account and data. Destructive + irreversible.
// The guards and the actual deletion live in lib/account/delete.ts, shared
// with the `deleteAccount` server action so the two can't drift apart.
//
// Also used by the mobile app (attendee_profile_screen.dart) — it posts here
// rather than deleting anything client-side, so the guards apply there too.
async function handler() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await deleteOwnAccount(user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
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
