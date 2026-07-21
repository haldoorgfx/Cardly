import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ownedSpeaker } from '@/lib/rbac/ownership';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';
import { zSafeUrl } from '@/lib/url/safeUrl';

// This route was entirely unvalidated: whatever JSON arrived was written
// straight to the row. The three social fields are rendered as `href` on the
// PUBLIC speaker profile (/s/[slug]/[speakerId]) and on the public event page,
// so `javascript:alert(document.cookie)` in `website_url` was stored XSS that
// fires for every visitor — the same class already fixed on the booth page.
// zSafeUrl (NOT z.string().url(), which happily accepts `javascript:`) both
// rejects and normalises. See lib/url/safeUrl.ts.
const Schema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  // Rendered on the public profile and in its OG description, but the speaker's
  // own editor had no field for it — organizer-writable only.
  headline: z.string().max(300).trim().nullable().optional(),
  role: z.string().max(200).trim().nullable().optional(),
  company: z.string().max(200).trim().nullable().optional(),
  bio: z.string().max(5000).nullable().optional(),
  twitter_url: zSafeUrl,
  linkedin_url: zSafeUrl,
  website_url: zSafeUrl,
  // Written by the headshot upload route, which returns a Storage public URL.
  photo_url: zSafeUrl,
});

export async function PATCH(
  req: Request,
  { params }: { params: { speakerId: string } }
) {
  // AuthZ: only the speaker themself (email/role match) or the event's
  // organizer may edit a speaker profile. This route was previously open.
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  let allowed = Boolean(await ownedSpeaker(user.id, params.speakerId));
  if (!allowed) {
    // Event organizer fallback
    const { data: speakerRow } = await adminAny
      .from('speakers')
      .select('event_id')
      .eq('id', params.speakerId)
      .maybeSingle();
    if (speakerRow?.event_id) {
      const { data: event } = await adminAny
        .from('events')
        .select('id')
        .eq('id', speakerRow.event_id)
        .in('user_id', await manageableOwnerIds(user.id))
        .maybeSingle();
      allowed = Boolean(event);
    }
  }
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const raw = await req.json().catch(() => null);
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const body = parsed.data;

  // Only write keys the client actually sent — an omitted field must not wipe
  // an existing value (photo_url in particular; the editor omits it when the
  // speaker never touched their headshot).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};
  for (const key of ['name', 'headline', 'role', 'company', 'bio', 'twitter_url', 'linkedin_url', 'website_url', 'photo_url'] as const) {
    if (body[key] !== undefined) updates[key] = body[key] === '' ? null : body[key];
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true });

  const { error } = await adminAny
    .from('speakers')
    .update(updates)
    .eq('id', params.speakerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
