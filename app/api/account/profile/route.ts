import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Canonical profile save. This is the single write path for the unified profile
// editor (components/account/ProfileSettings.tsx), rendered at both the attendee
// route (/account/profile) and the organizer Settings "Profile" section.
// It covers identity + work/networking + social + directory visibility. The
// networking columns were added in migration 048; some are not yet in the shared
// generated types (owned by another agent), so we cast at the DB boundary.
const schema = z.object({
  // Identity
  full_name:          z.string().nullable().optional(),
  avatar_url:         z.string().nullable().optional(),
  bio:                z.string().nullable().optional(),
  city:               z.string().nullable().optional(),
  phone:              z.string().nullable().optional(),
  // Work
  job_title:          z.string().nullable().optional(),
  organization:       z.string().nullable().optional(),
  industry:           z.string().nullable().optional(),
  role_types:         z.array(z.string()).optional(),
  // Networking / discovery
  interests:          z.array(z.string()).optional(),
  goals:              z.array(z.string()).optional(),
  directory_visible:  z.boolean().optional(),
  open_to_connect:    z.boolean().optional(),
  linkedin_url:       z.string().nullable().optional(),
  x_url:              z.string().nullable().optional(),
  // Preferences that round-trip on this editor
  notification_prefs: z.record(z.string(), z.boolean()).optional(),
  language:           z.string().optional(),
});

export async function PATCH(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { error } = await supabase
    .from('profiles')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(parsed.data as any)
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
