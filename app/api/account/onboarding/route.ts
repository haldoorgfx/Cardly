import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Attendee onboarding save. Mirrors the mobile wizard
// (eventera_mobile/lib/attendee/onboarding/onboarding_screen.dart) and writes
// to the profiles columns added in migration 048. Everything is optional except
// that a body must parse; a bare-bones call (e.g. "skip all") simply flips the
// completion flags. Both onboarding_done (web attendee gate, migration 010) and
// onboarding_completed (migration 024, mobile parity) are set on finish/skip.

const schema = z.object({
  // Step 1 · basics
  full_name:         z.string().nullable().optional(),
  avatar_url:        z.string().nullable().optional(),
  city:              z.string().nullable().optional(),
  phone:             z.string().nullable().optional(),
  // Step 2 · work
  job_title:         z.string().nullable().optional(),
  organization:      z.string().nullable().optional(),
  industry:          z.string().nullable().optional(),
  role_types:        z.array(z.string()).optional(),
  // Step 3 · interests
  interests:         z.array(z.string()).optional(),
  // Step 4 · goals
  goals:             z.array(z.string()).optional(),
  // Step 5 · networking
  directory_visible: z.boolean().optional(),
  open_to_connect:   z.boolean().optional(),
  linkedin_url:      z.string().nullable().optional(),
  x_url:             z.string().nullable().optional(),
  // Step 6 · dietary & access (PRIVATE)
  dietary:           z.array(z.string()).optional(),
  accessibility:     z.array(z.string()).optional(),
  onboarding_notes:  z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Always mark onboarding finished so the wizard never nags again. We set both
  // completion columns for web/mobile parity. Local cast keeps us off the
  // shared generated types (which other agents may be editing).
  const patch = {
    ...parsed.data,
    onboarding_done: true,
    onboarding_completed: true,
  } as Record<string, unknown>;

  const { error } = await supabase
    .from('profiles')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(patch as any)
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
